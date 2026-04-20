import 'reflect-metadata';
import { METADATA_KEYS, ParamType } from '../constants';
import type { ParameterMetadata, Type, Pipe } from '../interfaces';

/**
 * Creates a parameter decorator
 */
function createParamDecorator(type: ParamType, data?: string) {
    return (...pipes: Type<Pipe>[]): ParameterDecorator => {
        return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
            if (!propertyKey) return;

            const existingParams: ParameterMetadata[] =
                Reflect.getMetadata(METADATA_KEYS.PARAMS, target, propertyKey) || [];

            existingParams.push({
                index: parameterIndex,
                type,
                data,
                pipes,
            });

            // Sort by index
            existingParams.sort((a, b) => a.index - b.index);

            Reflect.defineMetadata(METADATA_KEYS.PARAMS, existingParams, target, propertyKey);
        };
    };
}

/**
 * Get the source player ID (server-side)
 *
 * @example
 * ```typescript
 * @OnClient('event')
 * async handle(@Source() source: number) {}
 * ```
 */
export function Source(): ParameterDecorator {
    return createParamDecorator(ParamType.SOURCE)();
}

/**
 * Get the event body/payload
 *
 * @example
 * ```typescript
 * @OnClient('event')
 * async handle(@Body() data: MyDto) {}
 * ```
 */
export function Body(...pipes: Type<Pipe>[]): ParameterDecorator {
    return createParamDecorator(ParamType.BODY)(...pipes);
}

/**
 * Get a specific property from the event body
 *
 * @param property - Property name to extract
 *
 * @example
 * ```typescript
 * @OnClient('event')
 * async handle(@Param('id') id: number) {}
 * ```
 */
export function Param(property: string, ...pipes: Type<Pipe>[]): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        if (!propertyKey) return;

        const existingParams: ParameterMetadata[] =
            Reflect.getMetadata(METADATA_KEYS.PARAMS, target, propertyKey) || [];

        existingParams.push({
            index: parameterIndex,
            type: ParamType.PARAM,
            data: property,
            pipes,
        });

        existingParams.sort((a, b) => a.index - b.index);

        Reflect.defineMetadata(METADATA_KEYS.PARAMS, existingParams, target, propertyKey);
    };
}

/**
 * Get the player state object
 *
 * @example
 * ```typescript
 * @OnClient('event')
 * async handle(@Player() player: PlayerState) {}
 * ```
 */
export function Player(): ParameterDecorator {
    return createParamDecorator(ParamType.PLAYER)();
}

/**
 * Get the execution context
 *
 * @example
 * ```typescript
 * @OnClient('event')
 * async handle(@Context() ctx: ExecutionContext) {}
 * ```
 */
export function Context(): ParameterDecorator {
    return createParamDecorator(ParamType.CONTEXT)();
}
