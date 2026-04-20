import {
    RpcRequest,
    RpcResponse,
    RpcError,
    RpcErrorCode,
    RpcClientOptions,
    PendingRpcCall,
} from '@merinaa/core';

/**
 * Default client options
 */
const DEFAULT_OPTIONS: RpcClientOptions = {
    defaultTimeout: 30000,
    debug: false,
    retryOnError: false,
    maxRetries: 3,
};

/**
 * RPC Client
 * Handles client-side RPC calls to the server
 */
export class RpcClient {
    private static instance: RpcClient;

    private options: RpcClientOptions;
    private pendingCalls = new Map<string, PendingRpcCall>();
    private callCounter = 0;
    private initialized = false;

    private constructor(options: Partial<RpcClientOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Get singleton instance
     */
    static getInstance(options?: Partial<RpcClientOptions>): RpcClient {
        if (!RpcClient.instance) {
            RpcClient.instance = new RpcClient(options);
        }
        return RpcClient.instance;
    }

    /**
     * Initialize the RPC client
     */
    initialize(): void {
        if (this.initialized) return;

        // Listen for RPC responses from server
        onNet('framework:rpc:response', (response: RpcResponse) => {
            this.handleResponse(response);
        });

        this.initialized = true;

        if (this.options.debug) {
            console.log('[RpcClient] Initialized');
        }
    }

    /**
     * Call an RPC action on the server
     */
    async call<T = any>(controller: string, action: string, ...args: any[]): Promise<T> {
        if (!this.initialized) {
            this.initialize();
        }

        const requestId = this.generateRequestId();
        const timeout = this.options.defaultTimeout!;

        return new Promise<T>((resolve, reject) => {
            // Create timeout
            const timeoutId = setTimeout(() => {
                this.pendingCalls.delete(requestId);
                reject(this.createError(RpcErrorCode.TIMEOUT, `RPC call timed out after ${timeout}ms`));
            }, timeout);

            // Track pending call
            this.pendingCalls.set(requestId, {
                id: requestId,
                controller,
                action,
                resolve,
                reject,
                timeout: timeoutId,
                startTime: Date.now(),
            });

            // Send request to server
            const request: RpcRequest = {
                id: requestId,
                controller,
                action,
                args,
                timestamp: Date.now(),
            };

            emitNet('framework:rpc:request', request);

            if (this.options.debug) {
                console.log(`[RpcClient] Calling ${controller}:${action}`, args);
            }
        });
    }

    /**
     * Handle response from server
     */
    private handleResponse(response: RpcResponse): void {
        const pending = this.pendingCalls.get(response.id);
        if (!pending) {
            if (this.options.debug) {
                console.warn(`[RpcClient] Received response for unknown request: ${response.id}`);
            }
            return;
        }

        // Clear timeout
        clearTimeout(pending.timeout);
        this.pendingCalls.delete(response.id);

        const duration = Date.now() - pending.startTime;

        if (this.options.debug) {
            console.log(
                `[RpcClient] Response for ${pending.controller}:${pending.action} in ${duration}ms`,
                response.success ? response.data : response.error
            );
        }

        if (response.success) {
            pending.resolve(response.data);
        } else {
            pending.reject(this.createError(
                response.error?.code || RpcErrorCode.INTERNAL_ERROR,
                response.error?.message || 'Unknown error',
                response.error?.details
            ));
        }
    }

    /**
     * Generate unique request ID
     */
    private generateRequestId(): string {
        return `rpc_${Date.now()}_${++this.callCounter}`;
    }

    /**
     * Create an error object
     */
    private createError(code: string, message: string, details?: any): RpcClientError {
        return new RpcClientError(code, message, details);
    }

    /**
     * Create a typed controller proxy
     * This provides full type safety for RPC calls
     *
     * @example
     * ```typescript
     * interface PlayerRpc {
     *     getMoney(): Promise<{ cash: number; bank: number }>;
     *     spawn(x: number, y: number, z: number): Promise<{ success: boolean }>;
     * }
     *
     * const playerRpc = rpcClient.controller<PlayerRpc>('player');
     * const money = await playerRpc.getMoney(); // Fully typed!
     * ```
     */
    controller<T extends object>(name: string): RpcProxy<T> {
        return new Proxy({} as RpcProxy<T>, {
            get: (_, action: string) => {
                return (...args: any[]) => this.call(name, action, ...args);
            },
        });
    }

    /**
     * Get number of pending calls
     */
    getPendingCount(): number {
        return this.pendingCalls.size;
    }

    /**
     * Cancel all pending calls
     */
    cancelAll(reason: string = 'Cancelled'): void {
        for (const [id, pending] of this.pendingCalls) {
            clearTimeout(pending.timeout);
            pending.reject(this.createError('CANCELLED', reason));
        }
        this.pendingCalls.clear();
    }

    /**
     * Update options
     */
    configure(options: Partial<RpcClientOptions>): void {
        this.options = { ...this.options, ...options };
    }
}

/**
 * RPC Client Error
 */
export class RpcClientError extends Error {
    public readonly code: string;
    public readonly details?: any;

    constructor(code: string, message: string, details?: any) {
        super(message);
        this.name = 'RpcClientError';
        this.code = code;
        this.details = details;
    }

    /**
     * Check if error is a timeout
     */
    isTimeout(): boolean {
        return this.code === RpcErrorCode.TIMEOUT;
    }

    /**
     * Check if error is rate limited
     */
    isRateLimited(): boolean {
        return this.code === RpcErrorCode.RATE_LIMITED;
    }

    /**
     * Check if error is unauthorized
     */
    isUnauthorized(): boolean {
        return this.code === RpcErrorCode.UNAUTHORIZED;
    }

    /**
     * Check if error is validation error
     */
    isValidationError(): boolean {
        return this.code === RpcErrorCode.VALIDATION_ERROR;
    }
}

/**
 * RPC Proxy type - converts interface methods to async calls
 */
export type RpcProxy<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer R>
        ? (...args: A) => Promise<R>
        : T[K] extends (...args: infer A) => infer R
        ? (...args: A) => Promise<R>
        : never;
};

// Export singleton
export const rpcClient = RpcClient.getInstance();
