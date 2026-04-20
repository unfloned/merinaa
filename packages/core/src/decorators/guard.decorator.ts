import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';
import type { Type, Guard } from '../interfaces';

/**
 * Decorator that applies guards to controllers or handlers
 * Guards determine if a request should be processed
 *
 * @param guards - Guard classes to apply
 *
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(AuthGuard, AdminGuard)
 * export class AdminController {
 *
 *   @OnClient('kick')
 *   @UseGuards(RateLimitGuard)
 *   async kick(@Source() source: number) {}
 * }
 * ```
 */
export function UseGuards(...guards: (Type<Guard> | Guard)[]): ClassDecorator & MethodDecorator {
    return (
        target: Object | Function,
        propertyKey?: string | symbol,
        descriptor?: PropertyDescriptor
    ) => {
        if (propertyKey && descriptor) {
            // Method decorator
            const existingGuards = Reflect.getMetadata(METADATA_KEYS.GUARDS, target, propertyKey) || [];
            Reflect.defineMetadata(
                METADATA_KEYS.GUARDS,
                [...existingGuards, ...guards],
                target,
                propertyKey
            );
        } else {
            // Class decorator
            const existingGuards = Reflect.getMetadata(METADATA_KEYS.GUARDS, target) || [];
            Reflect.defineMetadata(
                METADATA_KEYS.GUARDS,
                [...existingGuards, ...guards],
                target
            );
        }
    };
}

/**
 * Get guards for a controller or handler
 */
export function getGuards(target: Object, propertyKey?: string | symbol): Type<Guard>[] {
    const classGuards = Reflect.getMetadata(METADATA_KEYS.GUARDS, target.constructor) || [];

    if (propertyKey) {
        const methodGuards = Reflect.getMetadata(METADATA_KEYS.GUARDS, target, propertyKey) || [];
        return [...classGuards, ...methodGuards];
    }

    return classGuards;
}
