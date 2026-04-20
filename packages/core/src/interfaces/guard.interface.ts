import type { ExecutionContext } from './event.interface';

/**
 * Guard interface - determines if a request should be handled
 */
export interface Guard {
    /**
     * Determines if the current request should be handled
     * @param context - The execution context
     * @returns boolean or Promise<boolean> indicating if request should proceed
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

/**
 * Guard metadata for registration
 */
export interface GuardMetadata {
    guard: Guard;
    scope: 'global' | 'controller' | 'handler';
}
