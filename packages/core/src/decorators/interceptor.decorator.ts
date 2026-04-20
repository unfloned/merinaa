import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';
import type { Type, Interceptor } from '../interfaces';

/**
 * Decorator that applies interceptors to controllers or handlers
 * Interceptors can transform requests/responses
 *
 * @param interceptors - Interceptor classes to apply
 *
 * @example
 * ```typescript
 * @Controller('player')
 * @UseInterceptors(LoggingInterceptor)
 * export class PlayerController {
 *
 *   @OnClient('getData')
 *   @UseInterceptors(CacheInterceptor)
 *   async getData(@Source() source: number) {}
 * }
 * ```
 */
export function UseInterceptors(
    ...interceptors: (Type<Interceptor> | Interceptor)[]
): ClassDecorator & MethodDecorator {
    return (
        target: Object | Function,
        propertyKey?: string | symbol,
        descriptor?: PropertyDescriptor
    ) => {
        if (propertyKey && descriptor) {
            // Method decorator
            const existing = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, target, propertyKey) || [];
            Reflect.defineMetadata(
                METADATA_KEYS.INTERCEPTORS,
                [...existing, ...interceptors],
                target,
                propertyKey
            );
        } else {
            // Class decorator
            const existing = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, target) || [];
            Reflect.defineMetadata(
                METADATA_KEYS.INTERCEPTORS,
                [...existing, ...interceptors],
                target
            );
        }
    };
}

/**
 * Get interceptors for a controller or handler
 */
export function getInterceptors(target: Object, propertyKey?: string | symbol): Type<Interceptor>[] {
    const classInterceptors = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, target.constructor) || [];

    if (propertyKey) {
        const methodInterceptors = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, target, propertyKey) || [];
        return [...classInterceptors, ...methodInterceptors];
    }

    return classInterceptors;
}
