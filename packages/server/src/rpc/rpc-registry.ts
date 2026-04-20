import {
    METADATA_KEYS,
    RpcRequest,
    RpcResponse,
    RpcError,
    RpcErrorCode,
    RpcContext,
    RegisteredRpcAction,
} from '@merinaa/core';
import {
    getRpcControllerMetadata,
    getRpcActionsMetadata,
    RpcControllerMetadata,
    RpcActionMetadata,
} from '@merinaa/core';
import { Container } from '../container/container';
import { LoggerService } from '../services/logger.service';

/**
 * Rate limit tracker
 */
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

/**
 * RPC Registry
 * Manages server-side RPC controllers and handles incoming requests
 */
export class RpcRegistry {
    private static instance: RpcRegistry;

    private controllers = new Map<string, any>();
    private actions = new Map<string, RegisteredRpcAction>();
    private rateLimits = new Map<string, RateLimitEntry>();
    private logger: LoggerService;
    private container: Container;
    private initialized = false;

    private constructor() {
        this.container = Container.getInstance();
        this.logger = this.container.resolve(LoggerService);
    }

    /**
     * Get singleton instance
     */
    static getInstance(): RpcRegistry {
        if (!RpcRegistry.instance) {
            RpcRegistry.instance = new RpcRegistry();
        }
        return RpcRegistry.instance;
    }

    /**
     * Initialize the RPC system
     */
    initialize(): void {
        if (this.initialized) return;

        // Register FiveM event handler for RPC requests
        onNet('framework:rpc:request', (request: RpcRequest) => {
            const source = (global as any).source as number;
            this.handleRequest(source, request);
        });

        this.initialized = true;
        this.logger.log('RpcRegistry', 'Initialized');
    }

    /**
     * Register an RPC controller
     */
    registerController(controllerClass: Function): void {
        const metadata = getRpcControllerMetadata(controllerClass);
        if (!metadata) {
            throw new Error(`${controllerClass.name} is not an RPC controller`);
        }

        // Resolve controller instance from DI container
        const instance = this.container.resolve(controllerClass as any);
        this.controllers.set(metadata.name, instance);

        // Register all actions
        const actions = getRpcActionsMetadata(controllerClass);
        for (const action of actions) {
            this.registerAction(metadata, action, instance);
        }

        this.logger.log(
            'RpcRegistry',
            `Registered RPC controller: ${metadata.name} with ${actions.length} actions`
        );
    }

    /**
     * Register an RPC action
     */
    private registerAction(
        controller: RpcControllerMetadata,
        action: RpcActionMetadata,
        instance: any
    ): void {
        const key = `${controller.name}:${action.actionName}`;
        const method = instance[action.methodName].bind(instance);

        const handler = async (context: RpcContext, ...args: any[]) => {
            return method(context, ...args);
        };

        this.actions.set(key, {
            controller: controller.name,
            action: action.actionName,
            handler,
            options: {
                timeout: action.options.timeout || 30000,
                validate: action.options.validate !== false,
                rateLimit: action.options.rateLimit || 0,
            },
        });
    }

    /**
     * Handle incoming RPC request
     */
    private async handleRequest(source: number, request: RpcRequest): Promise<void> {
        const startTime = Date.now();
        const key = `${request.controller}:${request.action}`;

        try {
            // Find the action
            const action = this.actions.get(key);
            if (!action) {
                this.sendError(source, request.id, {
                    code: RpcErrorCode.ACTION_NOT_FOUND,
                    message: `Action '${request.action}' not found on controller '${request.controller}'`,
                });
                return;
            }

            // Check rate limit
            if (action.options.rateLimit > 0) {
                if (!this.checkRateLimit(source, key, action.options.rateLimit)) {
                    this.sendError(source, request.id, {
                        code: RpcErrorCode.RATE_LIMITED,
                        message: 'Rate limit exceeded. Please try again later.',
                    });
                    return;
                }
            }

            // Create context
            const context: RpcContext = {
                source,
                requestId: request.id,
                controller: request.controller,
                action: request.action,
                timestamp: request.timestamp,
            };

            // Execute with timeout
            const result = await this.executeWithTimeout(
                () => action.handler(context, ...request.args),
                action.options.timeout
            );

            // Send success response
            this.sendResponse(source, {
                id: request.id,
                success: true,
                data: result,
                timestamp: Date.now(),
            });

            // Log execution time
            const duration = Date.now() - startTime;
            if (duration > 1000) {
                this.logger.warn(
                    'RpcRegistry',
                    `Slow RPC call: ${key} took ${duration}ms (source: ${source})`
                );
            }
        } catch (error: any) {
            this.logger.error('RpcRegistry', `RPC error in ${key}: ${error.message}`);

            this.sendError(source, request.id, {
                code: error.code || RpcErrorCode.INTERNAL_ERROR,
                message: error.message || 'An internal error occurred',
                details: error.details,
            });
        }
    }

    /**
     * Execute handler with timeout
     */
    private executeWithTimeout<T>(
        handler: () => Promise<T>,
        timeout: number
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject({
                    code: RpcErrorCode.TIMEOUT,
                    message: `RPC call timed out after ${timeout}ms`,
                });
            }, timeout);

            handler()
                .then((result) => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * Check rate limit for a source/action combination
     */
    private checkRateLimit(source: number, actionKey: string, limit: number): boolean {
        const key = `${source}:${actionKey}`;
        const now = Date.now();
        const entry = this.rateLimits.get(key);

        if (!entry || now >= entry.resetTime) {
            // Create new entry
            this.rateLimits.set(key, {
                count: 1,
                resetTime: now + 60000, // Reset after 1 minute
            });
            return true;
        }

        if (entry.count >= limit) {
            return false;
        }

        entry.count++;
        return true;
    }

    /**
     * Send RPC response to client
     */
    private sendResponse(source: number, response: RpcResponse): void {
        emitNet('framework:rpc:response', source, response);
    }

    /**
     * Send RPC error to client
     */
    private sendError(source: number, requestId: string, error: RpcError): void {
        this.sendResponse(source, {
            id: requestId,
            success: false,
            error,
            timestamp: Date.now(),
        });
    }

    /**
     * Get all registered controllers
     */
    getControllers(): string[] {
        return Array.from(this.controllers.keys());
    }

    /**
     * Get all registered actions for a controller
     */
    getActions(controllerName: string): string[] {
        const actions: string[] = [];
        for (const [key] of this.actions) {
            if (key.startsWith(`${controllerName}:`)) {
                actions.push(key.split(':')[1]);
            }
        }
        return actions;
    }

    /**
     * Get statistics
     */
    getStats(): { controllers: number; actions: number } {
        return {
            controllers: this.controllers.size,
            actions: this.actions.size,
        };
    }

    /**
     * Clean up rate limit entries (call periodically)
     */
    cleanupRateLimits(): void {
        const now = Date.now();
        for (const [key, entry] of this.rateLimits) {
            if (now >= entry.resetTime) {
                this.rateLimits.delete(key);
            }
        }
    }
}

// Export singleton
export const rpcRegistry = RpcRegistry.getInstance();
