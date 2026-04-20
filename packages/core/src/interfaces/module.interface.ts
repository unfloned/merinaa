import type { Type } from './common.interface';

export interface ModuleOptions {
    /**
     * List of modules to import
     */
    imports?: Type<any>[];

    /**
     * List of controllers to register
     */
    controllers?: Type<any>[];

    /**
     * List of providers (services) to register
     */
    providers?: (Type<any> | Provider)[];

    /**
     * List of providers to export to other modules
     */
    exports?: Type<any>[];

    /**
     * List of database entities this module owns
     * Entities are collected by the ModuleLoader and passed to the DatabaseModule
     */
    entities?: Type<any>[];

    /**
     * List of repository classes this module provides
     * Repositories are automatically registered as providers and exports
     */
    repositories?: Type<any>[];

    /**
     * Default configuration for this module.
     *
     * Gets merged into `ConfigService` under `configNamespace`
     * (or the module class name lowercased with "Module" stripped) when the
     * module loads. Values already set in ConfigService (from root
     * `framework.config.ts` or `app.configure()`) override these defaults.
     *
     * @example
     * ```typescript
     * @Module({
     *   config: { interestRate: 0.05, rotationIntervalMs: 60_000 },
     * })
     * export class BankModule {}
     * // config.getSection('bank') → { interestRate, rotationIntervalMs }
     * ```
     */
    config?: Record<string, any>;

    /**
     * Override the config namespace. Defaults to module class name lowercased
     * with "Module" suffix stripped (e.g. `BankModule` → `bank`).
     */
    configNamespace?: string;
}

export interface DynamicModule extends ModuleOptions {
    module: Type<any>;
    global?: boolean;
}

export interface Provider {
    provide: string | symbol | Type<any>;
    useClass?: Type<any>;
    useValue?: any;
    useFactory?: (...args: any[]) => any;
    inject?: (string | symbol | Type<any>)[];
}

export interface OnModuleInit {
    onModuleInit(): Promise<void> | void;
}

export interface OnModuleDestroy {
    onModuleDestroy(): Promise<void> | void;
}

export interface OnApplicationBootstrap {
    onApplicationBootstrap(): Promise<void> | void;
}

export interface OnApplicationShutdown {
    onApplicationShutdown(signal?: string): Promise<void> | void;
}
