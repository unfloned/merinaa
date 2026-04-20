import type { ExecutionContext } from './event.interface';

/**
 * Call handler for interceptors
 */
export interface CallHandler<T = any> {
    /**
     * Proceeds to the next handler
     */
    handle(): Promise<T>;
}

/**
 * Interceptor interface - intercepts incoming/outgoing data
 */
export interface Interceptor<T = any, R = any> {
    /**
     * Intercepts the request/response
     * @param context - The execution context
     * @param next - The call handler to proceed
     * @returns The transformed result
     */
    intercept(context: ExecutionContext, next: CallHandler<T>): Promise<R> | R;
}

/**
 * Interceptor metadata for registration
 */
export interface InterceptorMetadata {
    interceptor: Interceptor;
    scope: 'global' | 'controller' | 'handler';
}
