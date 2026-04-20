import 'reflect-metadata';
import { METADATA_KEYS, Scope } from '@merinaa/core';
import type { Type, Provider } from '@merinaa/core';

/**
 * Simple but powerful Dependency Injection Container
 */
export class Container {
    private static instance: Container;

    private singletons = new Map<any, any>();
    private providers = new Map<any, Provider>();
    private factories = new Map<any, () => any>();

    private constructor() {}

    /**
     * Get the container instance (singleton)
     */
    static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    /**
     * Register a class as a provider.
     *
     * If an instance is already registered (e.g. via `registerProvider({ useValue })`
     * in a test to mock this dependency), it is kept — a second `register()` call
     * is a no-op. This lets TestBed overrides take precedence over module-declared
     * providers.
     */
    register<T>(target: Type<T>): void {
        if (this.singletons.has(target)) {
            // Already registered (e.g. as a test mock) — don't overwrite.
            return;
        }

        const scope = Reflect.getMetadata(METADATA_KEYS.SCOPE, target) || Scope.SINGLETON;

        this.providers.set(target, {
            provide: target,
            useClass: target,
        });

        // For singletons, create instance immediately
        if (scope === Scope.SINGLETON) {
            this.singletons.set(target, this.createInstance(target));
        }
    }

    /**
     * Register a provider configuration
     */
    registerProvider(provider: Provider): void {
        const token = provider.provide;

        if (provider.useValue !== undefined) {
            this.singletons.set(token, provider.useValue);
        } else if (provider.useFactory) {
            this.factories.set(token, () => {
                const deps = (provider.inject || []).map((dep) => this.resolve(dep));
                return provider.useFactory!(...deps);
            });
        } else if (provider.useClass) {
            this.providers.set(token, provider);
        }

        this.providers.set(token, provider);
    }

    /**
     * Resolve a dependency
     */
    resolve<T>(target: Type<T> | string | symbol): T {
        // Check for existing singleton
        if (this.singletons.has(target)) {
            return this.singletons.get(target);
        }

        // Check for factory
        if (this.factories.has(target)) {
            const instance = this.factories.get(target)!();
            this.singletons.set(target, instance);
            return instance;
        }

        // Check for provider
        const provider = this.providers.get(target);
        if (provider) {
            if (provider.useValue !== undefined) {
                return provider.useValue;
            }
            if (provider.useClass) {
                const instance = this.createInstance(provider.useClass);
                const scope = Reflect.getMetadata(METADATA_KEYS.SCOPE, provider.useClass) || Scope.SINGLETON;
                if (scope === Scope.SINGLETON) {
                    this.singletons.set(target, instance);
                }
                return instance;
            }
        }

        // Try to create instance directly
        if (typeof target === 'function') {
            const instance = this.createInstance(target as Type<T>);
            this.singletons.set(target, instance);
            return instance;
        }

        throw new Error(`Cannot resolve dependency: ${String(target)}`);
    }

    /**
     * Create an instance of a class, resolving its dependencies
     */
    private createInstance<T>(target: Type<T>): T {
        // Get constructor parameter types
        const paramTypes: Type<any>[] = Reflect.getMetadata(METADATA_KEYS.PARAM_TYPES, target) || [];

        // Get custom injection tokens
        const injectTokens = Reflect.getMetadata('framework:inject:tokens', target) || {};

        // Get optional parameters
        const optionals = Reflect.getMetadata('framework:inject:optional', target) || [];

        // Resolve dependencies
        const deps = paramTypes.map((paramType, index) => {
            // Check for custom token
            const customToken = injectTokens[index];
            if (customToken) {
                try {
                    return this.resolve(customToken);
                } catch (error) {
                    if (optionals.includes(index)) {
                        return undefined;
                    }
                    throw error;
                }
            }

            // Try to resolve by type
            try {
                return this.resolve(paramType);
            } catch (error) {
                if (optionals.includes(index)) {
                    return undefined;
                }
                throw new Error(
                    `Cannot resolve dependency at index ${index} for ${target.name}: ${paramType?.name || 'unknown'}`
                );
            }
        });

        return new target(...deps);
    }

    /**
     * Check if a provider is registered
     */
    has(target: any): boolean {
        return this.singletons.has(target) || this.providers.has(target) || this.factories.has(target);
    }

    /**
     * Get or create a dependency
     */
    get<T>(target: Type<T>): T {
        return this.resolve(target);
    }

    /**
     * Clear all registrations (useful for testing)
     */
    clear(): void {
        this.singletons.clear();
        this.providers.clear();
        this.factories.clear();
    }

    /**
     * Register multiple providers at once
     */
    registerAll(providers: (Type<any> | Provider)[]): void {
        for (const provider of providers) {
            if (typeof provider === 'function') {
                this.register(provider);
            } else {
                this.registerProvider(provider);
            }
        }
    }

    /**
     * Register a provider with async factory support
     * Used for providers that need async initialization (like database connections)
     */
    async registerProviderAsync(provider: Provider): Promise<void> {
        const token = provider.provide;

        if (provider.useValue !== undefined) {
            this.singletons.set(token, provider.useValue);
        } else if (provider.useFactory) {
            // Resolve dependencies and call factory
            const deps = (provider.inject || []).map((dep) => this.resolve(dep));
            const result = provider.useFactory(...deps);

            // Handle async factories
            const instance = result instanceof Promise ? await result : result;
            this.singletons.set(token, instance);
        } else if (provider.useClass) {
            this.providers.set(token, provider);
        }

        this.providers.set(token, provider);
    }
}

// Use global variable to ensure same instance across all bundles
// This is critical for standalone modules that need to access the DI container
const GLOBAL_CONTAINER_KEY = '__MERINAA_CONTAINER__';

function getGlobalContainer(): Container {
    const g = globalThis as any;
    if (!g[GLOBAL_CONTAINER_KEY]) {
        g[GLOBAL_CONTAINER_KEY] = Container.getInstance();
    }
    return g[GLOBAL_CONTAINER_KEY];
}

// Export singleton instance (always the same across all modules)
export const container = getGlobalContainer();
