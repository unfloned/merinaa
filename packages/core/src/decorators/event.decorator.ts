import 'reflect-metadata';
import { METADATA_KEYS, EventType } from '../constants';
import type { EventHandlerMetadata } from '../interfaces';

/**
 * Creates an event handler decorator
 */
function createEventDecorator(type: EventType) {
    return (event: string): MethodDecorator => {
        return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
            const constructor = target.constructor;

            // Get existing handlers
            const handlers: Partial<EventHandlerMetadata>[] =
                Reflect.getMetadata(METADATA_KEYS.EVENT_HANDLERS, constructor) || [];

            // Get parameter metadata
            const params = Reflect.getMetadata(METADATA_KEYS.PARAMS, target, propertyKey) || [];

            // Get guards, interceptors, pipes from method
            const guards = Reflect.getMetadata(METADATA_KEYS.GUARDS, target, propertyKey) || [];
            const interceptors = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, target, propertyKey) || [];
            const pipes = Reflect.getMetadata(METADATA_KEYS.PIPES, target, propertyKey) || [];

            // Add new handler
            handlers.push({
                event,
                type,
                method: propertyKey as string,
                controller: constructor as any,
                params,
                guards,
                interceptors,
                pipes,
            });

            Reflect.defineMetadata(METADATA_KEYS.EVENT_HANDLERS, handlers, constructor);

            return descriptor;
        };
    };
}

/**
 * Listen for events from clients (onNet)
 * @param event - Event name to listen for
 *
 * @example
 * ```typescript
 * @OnClient('player:spawn')
 * async handleSpawn(@Source() source: number, @Body() data: SpawnDto) {}
 * ```
 */
export const OnClient = createEventDecorator(EventType.CLIENT);

/**
 * Listen for local events (same environment)
 * @param event - Event name to listen for
 *
 * @example
 * ```typescript
 * @On('internal:playerLoaded')
 * async handlePlayerLoaded(player: PlayerState) {}
 * ```
 */
export const On = createEventDecorator(EventType.INTERNAL);

/**
 * Listen for events from server (client-side)
 * @param event - Event name to listen for
 */
export const OnServer = createEventDecorator(EventType.SERVER);

/**
 * Listen once for an event
 */
function createOnceDecorator(type: EventType) {
    return (event: string): MethodDecorator => {
        return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
            const decorator = createEventDecorator(type)(event);
            decorator(target, propertyKey, descriptor);

            // Mark as once
            Reflect.defineMetadata('framework:once', true, target, propertyKey);

            return descriptor;
        };
    };
}

export const OnceClient = createOnceDecorator(EventType.CLIENT);
export const Once = createOnceDecorator(EventType.INTERNAL);
export const OnceServer = createOnceDecorator(EventType.SERVER);

// Native FiveM events
/**
 * Called when a player connects
 */
export function OnPlayerConnect(): MethodDecorator {
    return createEventDecorator(EventType.NATIVE)('playerConnecting');
}

/**
 * Called when a player is fully joined
 */
export function OnPlayerJoin(): MethodDecorator {
    return createEventDecorator(EventType.NATIVE)('playerJoining');
}

/**
 * Called when a player disconnects
 */
export function OnPlayerDisconnect(): MethodDecorator {
    return createEventDecorator(EventType.NATIVE)('playerDropped');
}

/**
 * Called when this resource starts
 */
export function OnResourceStart(): MethodDecorator {
    return createEventDecorator(EventType.NATIVE)('onResourceStart');
}

/**
 * Called when this resource stops
 */
export function OnResourceStop(): MethodDecorator {
    return createEventDecorator(EventType.NATIVE)('onResourceStop');
}

/**
 * Called on game tick (client-side)
 */
export function OnTick(): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata('framework:tick', true, target, propertyKey);
        return descriptor;
    };
}
