import 'reflect-metadata';
import { METADATA_KEYS, Scope } from '../constants';

export interface InjectableOptions {
    /**
     * Scope of the injectable
     * - singleton: One instance for the entire application (default)
     * - transient: New instance each time it's injected
     * - request: New instance for each request/event
     */
    scope?: Scope;
}

/**
 * Decorator that marks a class as injectable
 * Injectable classes can be injected into other classes via constructor
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PlayerService {
 *   constructor(private repository: PlayerRepository) {}
 * }
 * ```
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
    return (target: Function) => {
        Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, true, target);
        Reflect.defineMetadata(METADATA_KEYS.SCOPE, options.scope || Scope.SINGLETON, target);
    };
}

/**
 * Decorator to inject a specific token
 *
 * @example
 * ```typescript
 * constructor(@Inject('DATABASE_URL') private dbUrl: string) {}
 * ```
 */
export function Inject(token: string | symbol): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const existingTokens = Reflect.getMetadata('framework:inject:tokens', target) || {};
        existingTokens[parameterIndex] = token;
        Reflect.defineMetadata('framework:inject:tokens', existingTokens, target);
    };
}

/**
 * Decorator to mark a dependency as optional
 *
 * @example
 * ```typescript
 * constructor(@Optional() private cache?: CacheService) {}
 * ```
 */
export function Optional(): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const optionals = Reflect.getMetadata('framework:inject:optional', target) || [];
        optionals.push(parameterIndex);
        Reflect.defineMetadata('framework:inject:optional', optionals, target);
    };
}
