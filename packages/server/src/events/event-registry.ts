import 'reflect-metadata';
import { METADATA_KEYS, EventType, ParamType } from '@merinaa/core';
import type { Type, EventHandlerMetadata, Guard, Interceptor, Pipe, ParameterMetadata } from '@merinaa/core';
import { Container } from '../container/container';
import { EventBus } from './event-bus';
import { ExecutionContextImpl, CallHandlerImpl } from './execution-context';
import { getControllerMetadata } from '@merinaa/core';

/**
 * Registry for all event handlers
 */
export class EventRegistry {
    private handlers: EventHandlerMetadata[] = [];

    constructor(
        private container: Container,
        private eventBus: EventBus
    ) {}

    /**
     * Register a controller and its event handlers
     */
    async registerController(controllerClass: Type<any>): Promise<void> {
        const metadata = getControllerMetadata(controllerClass);

        if (!metadata.isController) {
            console.warn(`[EventRegistry] ${controllerClass.name} is not a controller`);
            return;
        }

        const controllerHandlers: Partial<EventHandlerMetadata>[] =
            Reflect.getMetadata(METADATA_KEYS.EVENT_HANDLERS, controllerClass) || [];

        // Get class-level guards/interceptors/pipes
        const classGuards = Reflect.getMetadata(METADATA_KEYS.GUARDS, controllerClass) || [];
        const classInterceptors = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, controllerClass) || [];
        const classPipes = Reflect.getMetadata(METADATA_KEYS.PIPES, controllerClass) || [];

        for (const handler of controllerHandlers) {
            // Build full event name with prefix
            const eventName = metadata.prefix
                ? `${metadata.prefix}:${handler.event}`
                : handler.event!;

            const fullHandler: EventHandlerMetadata = {
                event: eventName,
                type: handler.type!,
                method: handler.method!,
                controller: controllerClass,
                params: handler.params || [],
                guards: [...classGuards, ...(handler.guards || [])],
                interceptors: [...classInterceptors, ...(handler.interceptors || [])],
                pipes: [...classPipes, ...(handler.pipes || [])],
            };

            this.handlers.push(fullHandler);
            this.registerHandler(fullHandler);
        }

        console.log(`[EventRegistry] Registered ${controllerHandlers.length} handlers from ${controllerClass.name}`);
    }

    /**
     * Register a single event handler
     */
    private registerHandler(metadata: EventHandlerMetadata): void {
        const handler = async (source: number, ...args: any[]) => {
            try {
                await this.executeHandler(metadata, source, args);
            } catch (error) {
                console.error(`[EventRegistry] Error in ${metadata.event}:`, error);
            }
        };

        switch (metadata.type) {
            case EventType.CLIENT:
                this.eventBus.onClient(metadata.event, handler);
                break;
            case EventType.INTERNAL:
                this.eventBus.onServer(metadata.event, (...args) => handler(-1, ...args));
                break;
            case EventType.NATIVE:
                this.registerNativeEvent(metadata, handler);
                break;
        }
    }

    /**
     * Register native FiveM events
     */
    private registerNativeEvent(
        metadata: EventHandlerMetadata,
        handler: (source: number, ...args: any[]) => Promise<void>
    ): void {
        switch (metadata.event) {
            case 'playerConnecting':
                on('playerConnecting', (name: string, setKickReason: (reason: string) => void, deferrals: any) => {
                    const source = (global as any).source as number;
                    handler(source, name, setKickReason, deferrals);
                });
                break;
            case 'playerDropped':
                on('playerDropped', (reason: string) => {
                    const source = (global as any).source as number;
                    handler(source, reason);
                });
                break;
            case 'onResourceStart':
                on('onResourceStart', (resourceName: string) => {
                    if (resourceName === GetCurrentResourceName()) {
                        handler(-1, resourceName);
                    }
                });
                break;
            case 'onResourceStop':
                on('onResourceStop', (resourceName: string) => {
                    if (resourceName === GetCurrentResourceName()) {
                        handler(-1, resourceName);
                    }
                });
                break;
            default:
                on(metadata.event, (...args: any[]) => {
                    const source = (global as any).source as number || -1;
                    handler(source, ...args);
                });
        }
    }

    /**
     * Execute a handler with guards, interceptors, and pipes
     */
    private async executeHandler(
        metadata: EventHandlerMetadata,
        source: number,
        args: any[]
    ): Promise<any> {
        const context = new ExecutionContextImpl(
            source,
            metadata.event,
            metadata.type,
            args,
            metadata.controller,
            metadata.method
        );

        // Run guards
        for (const GuardClass of metadata.guards) {
            const guard = this.resolveGuardOrInterceptor<Guard>(GuardClass);
            const canActivate = await guard.canActivate(context);
            if (!canActivate) {
                return; // Guard rejected
            }
        }

        // Get controller instance
        const controller = this.container.get(metadata.controller);
        const method = controller[metadata.method].bind(controller);

        // Resolve parameters
        const resolvedParams = await this.resolveParameters(metadata.params, source, args, context);

        // Create handler function
        const handlerFn = async () => {
            // Run pipes on parameters
            const pipedParams = await this.runPipes(metadata.pipes, resolvedParams);
            return method(...pipedParams);
        };

        // Run interceptors
        if (metadata.interceptors.length > 0) {
            return this.runInterceptors(metadata.interceptors, context, handlerFn);
        }

        return handlerFn();
    }

    /**
     * Resolve parameters based on decorators
     */
    private async resolveParameters(
        params: ParameterMetadata[],
        source: number,
        args: any[],
        context: ExecutionContextImpl
    ): Promise<any[]> {
        // If no param decorators, return source and args
        if (params.length === 0) {
            return [source, ...args];
        }

        const resolved: any[] = [];

        for (const param of params) {
            switch (param.type) {
                case ParamType.SOURCE:
                    resolved[param.index] = source;
                    break;
                case ParamType.BODY:
                    resolved[param.index] = args[0];
                    break;
                case ParamType.PARAM:
                    resolved[param.index] = args[0]?.[param.data!];
                    break;
                case ParamType.PLAYER:
                    // Will be resolved by PlayerService
                    resolved[param.index] = context.getData('player');
                    break;
                case ParamType.CONTEXT:
                    resolved[param.index] = context;
                    break;
                default:
                    resolved[param.index] = args[param.index];
            }
        }

        return resolved;
    }

    /**
     * Run pipes on parameters
     */
    private async runPipes(pipeClasses: Type<Pipe>[], params: any[]): Promise<any[]> {
        if (pipeClasses.length === 0) {
            return params;
        }

        const result = [...params];

        for (const PipeClass of pipeClasses) {
            const pipe = this.resolveGuardOrInterceptor<Pipe>(PipeClass);
            for (let i = 0; i < result.length; i++) {
                result[i] = await pipe.transform(result[i], { type: 'body' });
            }
        }

        return result;
    }

    /**
     * Run interceptors chain
     */
    private async runInterceptors(
        interceptorClasses: Type<Interceptor>[],
        context: ExecutionContextImpl,
        handler: () => Promise<any>
    ): Promise<any> {
        // Build chain from end to start
        let chain = handler;

        for (let i = interceptorClasses.length - 1; i >= 0; i--) {
            const InterceptorClass = interceptorClasses[i];
            const interceptor = this.resolveGuardOrInterceptor<Interceptor>(InterceptorClass);
            const currentChain = chain;

            chain = async () => {
                const callHandler = new CallHandlerImpl(currentChain);
                return interceptor.intercept(context, callHandler);
            };
        }

        return chain();
    }

    /**
     * Resolve a guard or interceptor (can be class or instance)
     */
    private resolveGuardOrInterceptor<T>(target: Type<T> | T): T {
        if (typeof target === 'function') {
            // It's a class, resolve from container
            return this.container.get(target as Type<T>);
        }
        // It's already an instance
        return target as T;
    }

    /**
     * Get all registered handlers
     */
    getHandlers(): EventHandlerMetadata[] {
        return [...this.handlers];
    }
}
