import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';

/**
 * RPC Action metadata
 */
export interface RpcActionMetadata {
    methodName: string;
    actionName: string;
    options: RpcActionOptions;
}

/**
 * RPC Action options
 */
export interface RpcActionOptions {
    /** Custom action name (defaults to method name) */
    name?: string;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Whether to validate input parameters */
    validate?: boolean;
    /** Rate limit per minute (0 = unlimited) */
    rateLimit?: number;
}

/**
 * RPC Controller options
 */
export interface RpcControllerOptions {
    /** Controller namespace/prefix */
    namespace?: string;
}

/**
 * RPC Controller metadata
 */
export interface RpcControllerMetadata {
    name: string;
    namespace: string;
    options: RpcControllerOptions;
}

/**
 * Marks a class as an RPC Controller
 * RPC Controllers handle type-safe client-server communication
 *
 * @example
 * ```typescript
 * @RpcController('player')
 * export class PlayerRpcController {
 *     @RpcAction()
 *     async getMoney(): Promise<{ cash: number; bank: number }> {
 *         return { cash: 500, bank: 5000 };
 *     }
 * }
 * ```
 */
export function RpcController(name: string, options: RpcControllerOptions = {}): ClassDecorator {
    return (target: Function) => {
        const metadata: RpcControllerMetadata = {
            name,
            namespace: options.namespace || name,
            options,
        };

        Reflect.defineMetadata(METADATA_KEYS.RPC_CONTROLLER, metadata, target);

        // Also mark as injectable
        Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, true, target);
    };
}

/**
 * Marks a method as an RPC Action
 * RPC Actions can be called from the client with full type safety
 *
 * @example
 * ```typescript
 * @RpcAction()
 * async spawn(x: number, y: number, z: number): Promise<{ success: boolean }> {
 *     // Implementation
 *     return { success: true };
 * }
 *
 * @RpcAction({ name: 'transfer', timeout: 10000 })
 * async transferMoney(targetId: string, amount: number): Promise<boolean> {
 *     return true;
 * }
 * ```
 */
export function RpcAction(options: RpcActionOptions = {}): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const methodName = String(propertyKey);
        const actionName = options.name || methodName;

        const metadata: RpcActionMetadata = {
            methodName,
            actionName,
            options: {
                timeout: 30000, // Default 30 seconds
                validate: true,
                rateLimit: 0,
                ...options,
            },
        };

        // Get existing actions or create new array
        const existingActions: RpcActionMetadata[] =
            Reflect.getMetadata(METADATA_KEYS.RPC_ACTIONS, target.constructor) || [];

        existingActions.push(metadata);

        Reflect.defineMetadata(METADATA_KEYS.RPC_ACTIONS, existingActions, target.constructor);

        return descriptor;
    };
}

/**
 * Get RPC Controller metadata
 */
export function getRpcControllerMetadata(target: Function): RpcControllerMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEYS.RPC_CONTROLLER, target);
}

/**
 * Get RPC Actions metadata
 */
export function getRpcActionsMetadata(target: Function): RpcActionMetadata[] {
    return Reflect.getMetadata(METADATA_KEYS.RPC_ACTIONS, target) || [];
}

/**
 * Check if a class is an RPC Controller
 */
export function isRpcController(target: Function): boolean {
    return Reflect.hasMetadata(METADATA_KEYS.RPC_CONTROLLER, target);
}
