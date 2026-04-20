import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';
import type { ModuleOptions } from '../interfaces';

/**
 * Decorator that marks a class as a module
 * Modules are the basic building blocks of the framework
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [DatabaseModule],
 *   controllers: [PlayerController],
 *   providers: [PlayerService],
 *   exports: [PlayerService],
 * })
 * export class PlayerModule {}
 * ```
 */
export function Module(options: ModuleOptions = {}): ClassDecorator {
    return (target: Function) => {
        // Store module options
        Reflect.defineMetadata(METADATA_KEYS.MODULE_OPTIONS, options, target);

        // Store individual arrays for easier access
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_IMPORTS,
            options.imports || [],
            target
        );
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_CONTROLLERS,
            options.controllers || [],
            target
        );
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_PROVIDERS,
            options.providers || [],
            target
        );
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_EXPORTS,
            options.exports || [],
            target
        );
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_ENTITIES,
            options.entities || [],
            target
        );
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_REPOSITORIES,
            options.repositories || [],
            target
        );
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_CONFIG,
            options.config || null,
            target
        );
        Reflect.defineMetadata(
            METADATA_KEYS.MODULE_CONFIG_NAMESPACE,
            options.configNamespace || null,
            target
        );
    };
}

/**
 * Marks a module as global, making its exports available everywhere
 *
 * @example
 * ```typescript
 * @Global()
 * @Module({
 *   providers: [ConfigService],
 *   exports: [ConfigService],
 * })
 * export class ConfigModule {}
 * ```
 */
export function Global(): ClassDecorator {
    return (target: Function) => {
        Reflect.defineMetadata('framework:global', true, target);
    };
}
