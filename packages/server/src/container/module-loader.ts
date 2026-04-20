import 'reflect-metadata';
import { METADATA_KEYS, getOnReadyMethods, getCronHandlers } from '@merinaa/core';
import type { Type, ModuleOptions, Provider } from '@merinaa/core';
import { Container } from './container';
import { EventRegistry } from '../events/event-registry';
import { ConfigService } from '../services/config.service';
import { CronService } from '../services/cron.service';

interface DeferredModule {
    moduleClass: Type<any>;
    options: ModuleOptions;
    dynamicProviders: (Type<any> | Provider)[];
}

/**
 * Loads and initializes modules in two phases:
 *
 * Phase 1 (load): Scan modules, collect entities, register useValue providers, call onModuleInit
 * Phase 2 (initializeProviders): After DB connection, register all providers, repositories, controllers
 */
export class ModuleLoader {
    private loadedModules = new Set<Type<any>>();
    private moduleInstances = new Map<Type<any>, any>();
    private registeredControllers: Type<any>[] = [];
    private collectedEntities: Type<any>[] = [];
    private collectedRepositories: Type<any>[] = [];
    private deferredModules: DeferredModule[] = [];

    constructor(
        private container: Container,
        private eventRegistry: EventRegistry
    ) {}

    /**
     * Derive the config namespace for a module. Uses `configNamespace` from
     * metadata if set, otherwise lowercases the class name with "Module"
     * stripped (e.g. `BankModule` → `bank`).
     */
    private getModuleConfigNamespace(moduleClass: Type<any>): string {
        const explicit = Reflect.getMetadata(METADATA_KEYS.MODULE_CONFIG_NAMESPACE, moduleClass);
        if (explicit && typeof explicit === 'string') return explicit;
        const name = moduleClass.name.replace(/Module$/, '');
        return name.charAt(0).toLowerCase() + name.slice(1);
    }

    /**
     * Phase 1: Load modules - scan structure, collect entities, run onModuleInit
     * Does NOT register providers/controllers that depend on Database
     */
    async load(moduleClass: Type<any>): Promise<void> {
        if (this.loadedModules.has(moduleClass)) {
            return;
        }

        this.loadedModules.add(moduleClass);

        const options: ModuleOptions = Reflect.getMetadata(METADATA_KEYS.MODULE_OPTIONS, moduleClass) || {};

        // Load imported modules first
        for (const importedModule of options.imports || []) {
            await this.load(importedModule);
        }

        // Process dynamic providers (from forRoot/forFeature patterns)
        // Only register useValue immediately, defer everything else
        const dynamicProviders: (Type<any> | Provider)[] = [];

        if (typeof (moduleClass as any).createProviders === 'function') {
            const allDynamicProviders = (moduleClass as any).createProviders();
            for (const provider of allDynamicProviders || []) {
                if (typeof provider !== 'function' && (provider as Provider).useValue !== undefined) {
                    // useValue providers can be registered immediately (no dependencies)
                    await this.container.registerProviderAsync(provider as Provider);
                } else {
                    dynamicProviders.push(provider);
                }
            }
            console.log(`[ModuleLoader] Loaded immediate providers from ${moduleClass.name}, deferred ${dynamicProviders.length}`);
        }

        // Create module instance
        const moduleInstance = this.container.has(moduleClass)
            ? this.container.get(moduleClass)
            : new moduleClass();

        this.moduleInstances.set(moduleClass, moduleInstance);

        // Call onModuleInit (allows modules to do setup before DB connection)
        if (typeof moduleInstance.onModuleInit === 'function') {
            await moduleInstance.onModuleInit();
        }

        // Collect entities from module
        const entities: Type<any>[] = Reflect.getMetadata(METADATA_KEYS.MODULE_ENTITIES, moduleClass) || [];
        if (entities.length > 0) {
            this.collectedEntities.push(...entities);
            console.log(`[ModuleLoader] Collected ${entities.length} entities from ${moduleClass.name}`);
        }

        // Merge module-scoped config defaults into ConfigService.
        // Root/bootstrap values take precedence over these defaults (merge only
        // fills in missing keys).
        const moduleConfig = Reflect.getMetadata(METADATA_KEYS.MODULE_CONFIG, moduleClass);
        if (moduleConfig && this.container.has(ConfigService)) {
            const namespace = this.getModuleConfigNamespace(moduleClass);
            const configService = this.container.get(ConfigService);
            configService.merge({ [namespace]: moduleConfig });
            console.log(`[ModuleLoader] Merged config for ${moduleClass.name} (namespace: ${namespace})`);
        }

        // Store module info for Phase 2
        this.deferredModules.push({ moduleClass, options, dynamicProviders });

        console.log(`[ModuleLoader] Loaded module: ${moduleClass.name}`);
    }

    /**
     * Phase 2: Register all providers, repositories, and controllers
     * Must be called AFTER database connection is established
     */
    async initializeProviders(): Promise<void> {
        for (const { moduleClass, options, dynamicProviders } of this.deferredModules) {
            // 1. Register dynamic providers (factories first, then classes)
            const factories = dynamicProviders.filter(p => typeof p !== 'function' && (p as Provider).useFactory);
            const classes = dynamicProviders.filter(p => typeof p === 'function' || !(p as Provider).useFactory);

            for (const provider of factories) {
                await this.container.registerProviderAsync(provider as Provider);
            }
            for (const provider of classes) {
                if (typeof provider === 'function') {
                    this.container.register(provider);
                } else {
                    await this.container.registerProviderAsync(provider as Provider);
                }
            }

            // 2. Register static providers from @Module({ providers })
            for (const provider of options.providers || []) {
                if (typeof provider === 'function') {
                    this.container.register(provider);
                } else {
                    this.container.registerProvider(provider as Provider);
                }
            }

            // 3. Register repositories from @Module({ repositories })
            const repositories: Type<any>[] = Reflect.getMetadata(METADATA_KEYS.MODULE_REPOSITORIES, moduleClass) || [];
            if (repositories.length > 0) {
                this.collectedRepositories.push(...repositories);
                for (const repo of repositories) {
                    this.container.register(repo);
                }
            }

            // 4. Register controllers
            for (const controller of options.controllers || []) {
                this.container.register(controller);
                await this.eventRegistry.registerController(controller);
                this.registeredControllers.push(controller);
            }
        }

        const totalProviders = this.deferredModules.reduce((sum, d) =>
            sum + d.dynamicProviders.length + (d.options.providers?.length || 0), 0);
        console.log(`[ModuleLoader] Initialized ${this.deferredModules.length} modules (${totalProviders} providers, ${this.registeredControllers.length} controllers)`);

        this.deferredModules = [];
    }

    /**
     * Get a loaded module instance
     */
    getModule<T>(moduleClass: Type<T>): T | undefined {
        return this.moduleInstances.get(moduleClass);
    }

    /**
     * Get all loaded modules
     */
    getLoadedModules(): Type<any>[] {
        return Array.from(this.loadedModules);
    }

    /**
     * Get all entities collected from modules
     */
    getCollectedEntities(): Type<any>[] {
        return [...this.collectedEntities];
    }

    /**
     * Get all repositories collected from modules
     */
    getCollectedRepositories(): Type<any>[] {
        return [...this.collectedRepositories];
    }

    /**
     * Call all OnReady methods on registered controllers
     * Should be called after all modules are loaded and DB is ready
     */
    async callOnReadyMethods(): Promise<void> {
        let totalCalled = 0;

        for (const controllerClass of this.registeredControllers) {
            const methods = getOnReadyMethods(controllerClass);

            if (methods.length === 0) continue;

            const instance = this.container.get(controllerClass);

            for (const methodName of methods) {
                if (typeof instance[methodName] === 'function') {
                    console.log(`[ModuleLoader] Calling OnReady: ${controllerClass.name}.${methodName}()`);
                    try {
                        await instance[methodName]();
                        totalCalled++;
                    } catch (error) {
                        console.error(`[ModuleLoader] OnReady error in ${controllerClass.name}.${methodName}():`, error);
                    }
                }
            }
        }

        if (totalCalled > 0) {
            console.log(`[ModuleLoader] Called ${totalCalled} OnReady methods`);
        }

        // Register cron jobs after OnReady (services are fully initialized)
        this.registerCronHandlers();
    }

    /**
     * Scan registered controllers for @Cron methods and register them
     * with the CronService.
     */
    private registerCronHandlers(): void {
        if (!this.container.has(CronService)) return;

        const cronService = this.container.get(CronService);
        let totalRegistered = 0;

        for (const controllerClass of this.registeredControllers) {
            const cronHandlers = getCronHandlers(controllerClass);
            if (cronHandlers.length === 0) continue;

            const instance = this.container.get(controllerClass);

            for (const handler of cronHandlers) {
                const jobName = `${controllerClass.name}.${handler.method}`;
                const callback = instance[handler.method].bind(instance);
                cronService.register(jobName, handler.options, callback);
                totalRegistered++;
            }
        }

        if (totalRegistered > 0) {
            console.log(`[ModuleLoader] Registered ${totalRegistered} cron jobs`);
        }
    }

    /**
     * Get all registered controllers
     */
    getRegisteredControllers(): Type<any>[] {
        return [...this.registeredControllers];
    }

    /**
     * Destroy all modules
     */
    async destroyAll(): Promise<void> {
        // Stop all cron jobs first
        if (this.container.has(CronService)) {
            this.container.get(CronService).destroyAll();
        }

        for (const [moduleClass, instance] of this.moduleInstances) {
            if (typeof instance.onModuleDestroy === 'function') {
                await instance.onModuleDestroy();
            }
        }

        this.loadedModules.clear();
        this.moduleInstances.clear();
        this.registeredControllers = [];
    }
}
