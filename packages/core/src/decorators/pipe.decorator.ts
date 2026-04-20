import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';
import type { Type, Pipe } from '../interfaces';

/**
 * Decorator that applies pipes to controllers or handlers
 * Pipes transform and validate input data
 *
 * @param pipes - Pipe classes to apply
 *
 * @example
 * ```typescript
 * @Controller('player')
 * @UsePipes(ValidationPipe)
 * export class PlayerController {
 *
 *   @OnClient('update')
 *   @UsePipes(TransformPipe)
 *   async update(@Body() data: UpdateDto) {}
 * }
 * ```
 */
export function UsePipes(...pipes: (Type<Pipe> | Pipe)[]): ClassDecorator & MethodDecorator {
    return (
        target: Object | Function,
        propertyKey?: string | symbol,
        descriptor?: PropertyDescriptor
    ) => {
        if (propertyKey && descriptor) {
            // Method decorator
            const existing = Reflect.getMetadata(METADATA_KEYS.PIPES, target, propertyKey) || [];
            Reflect.defineMetadata(
                METADATA_KEYS.PIPES,
                [...existing, ...pipes],
                target,
                propertyKey
            );
        } else {
            // Class decorator
            const existing = Reflect.getMetadata(METADATA_KEYS.PIPES, target) || [];
            Reflect.defineMetadata(
                METADATA_KEYS.PIPES,
                [...existing, ...pipes],
                target
            );
        }
    };
}

/**
 * Get pipes for a controller or handler
 */
export function getPipes(target: Object, propertyKey?: string | symbol): Type<Pipe>[] {
    const classPipes = Reflect.getMetadata(METADATA_KEYS.PIPES, target.constructor) || [];

    if (propertyKey) {
        const methodPipes = Reflect.getMetadata(METADATA_KEYS.PIPES, target, propertyKey) || [];
        return [...classPipes, ...methodPipes];
    }

    return classPipes;
}
