import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';

/**
 * Decorator that marks a class as a controller
 * Controllers handle incoming events and delegate to services
 *
 * @param prefix - Optional prefix for all event handlers in this controller
 *
 * @example
 * ```typescript
 * @Controller('player')
 * export class PlayerController {
 *   @OnClient('spawn')  // Listens for 'player:spawn'
 *   async spawn(@Source() source: number) {}
 * }
 * ```
 */
export function Controller(prefix?: string): ClassDecorator {
    return (target: Function) => {
        Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, true, target);
        Reflect.defineMetadata(METADATA_KEYS.CONTROLLER_PREFIX, prefix || '', target);

        // Initialize event handlers array
        if (!Reflect.hasMetadata(METADATA_KEYS.EVENT_HANDLERS, target)) {
            Reflect.defineMetadata(METADATA_KEYS.EVENT_HANDLERS, [], target);
        }
    };
}

/**
 * Get controller metadata
 */
export function getControllerMetadata(target: Function) {
    return {
        isController: Reflect.getMetadata(METADATA_KEYS.CONTROLLER, target) === true,
        prefix: Reflect.getMetadata(METADATA_KEYS.CONTROLLER_PREFIX, target) || '',
        handlers: Reflect.getMetadata(METADATA_KEYS.EVENT_HANDLERS, target) || [],
    };
}
