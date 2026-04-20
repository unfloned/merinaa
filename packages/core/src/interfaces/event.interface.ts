import type { EventType } from '../constants';
import type { Type } from './common.interface';

/**
 * Execution context for guards, interceptors, and handlers
 */
export interface ExecutionContext {
    /**
     * Source player ID (server ID)
     */
    readonly source: number;

    /**
     * Event name that was triggered
     */
    readonly event: string;

    /**
     * Event type (client, server, internal)
     */
    readonly type: EventType;

    /**
     * Arguments passed to the event
     */
    readonly args: any[];

    /**
     * Get the controller class
     */
    getClass(): Type<any>;

    /**
     * Get the handler method name
     */
    getHandler(): string;

    /**
     * Get custom data attached to context
     */
    getData<T = any>(key?: string): T;

    /**
     * Set custom data on context
     */
    setData<T = any>(key: string, value: T): void;
}

/**
 * Event RPC context (for switching context)
 */
export interface EventRpcContext {
    /**
     * Get the source player ID
     */
    getSource(): number;

    /**
     * Get event arguments
     */
    getArgs<T = any[]>(): T;

    /**
     * Get specific argument by index
     */
    getArgByIndex<T = any>(index: number): T;
}

/**
 * Event handler metadata
 */
export interface EventHandlerMetadata {
    /**
     * Event name to listen for
     */
    event: string;

    /**
     * Event type
     */
    type: EventType;

    /**
     * Handler method name
     */
    method: string;

    /**
     * Controller class
     */
    controller: Type<any>;

    /**
     * Parameter metadata
     */
    params: ParameterMetadata[];

    /**
     * Guards to apply
     */
    guards: Type<any>[];

    /**
     * Interceptors to apply
     */
    interceptors: Type<any>[];

    /**
     * Pipes to apply
     */
    pipes: Type<any>[];
}

/**
 * Parameter metadata
 */
export interface ParameterMetadata {
    /**
     * Parameter index
     */
    index: number;

    /**
     * Parameter type (source, body, param, etc.)
     */
    type: string;

    /**
     * Additional data (e.g., param name)
     */
    data?: string;

    /**
     * Pipe to apply to this parameter
     */
    pipes?: Type<any>[];
}
