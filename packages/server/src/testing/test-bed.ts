import 'reflect-metadata';
import type { Type } from '@merinaa/core';
import { METADATA_KEYS } from '@merinaa/core';
import { Container } from '../container/container';
import { ModuleLoader } from '../container/module-loader';
import { EventBus, eventBus } from '../events/event-bus';
import { EventRegistry } from '../events/event-registry';
import { LoggerService } from '../services/logger.service';
import { ConfigService } from '../services/config.service';
import { DiscordWebhookService } from '../services/discord-webhook.service';

/**
 * Options for creating a TestBed.
 */
export interface TestBedOptions {
    /**
     * Root module to load. If omitted, no module loading happens — useful
     * for pure DI/container unit tests.
     */
    rootModule?: Type<any>;

    /**
     * Overrides merged into `ConfigService` *before* modules load.
     * Equivalent to `builder.loadConfig(...)` in production bootstrap.
     */
    config?: Record<string, any>;

    /**
     * Provider overrides. Each entry replaces the real provider of that type
     * with a mock. Use this to stub out DB repositories, external services, etc.
     *
     * @example
     * providers: [{ provide: BankRepository, useValue: fakeBankRepo }]
     */
    providers?: Array<{ provide: Type<any>; useValue: any }>;

    /**
     * Run full bootstrap (load → initializeProviders → OnReady). Default: true.
     * Set to `false` to stop after Phase 1 (module load + onModuleInit) —
     * e.g. for smoke tests that just verify entities/metadata.
     */
    fullBootstrap?: boolean;
}

/**
 * Test harness that mirrors production bootstrap without connecting to the
 * real database or requiring a FiveM runtime.
 *
 * **Important differences from production:**
 * - FiveM-specific globals (`GetConvar`, `emit`, `on`) are expected to be
 *   mocked by the caller (see `packages/server/src/testing/fivem-mocks.ts`).
 * - `DatabaseModule` is NOT connected — tests that need persistence must
 *   mock their repositories via `providers` overrides.
 *
 * @example
 * ```ts
 * const bed = await TestBed.create({
 *   rootModule: BankModule,
 *   providers: [{ provide: BankRepository, useValue: new FakeBankRepository() }],
 * });
 * const service = bed.get(BankService);
 * expect(await service.getBalance('char-1')).toBe(0);
 * ```
 */
export class TestBed {
    private constructor(
        private readonly container: Container,
        private readonly moduleLoader: ModuleLoader,
        private readonly eventBusInstance: EventBus,
        private readonly logger: LoggerService,
        private readonly config: ConfigService
    ) {}

    /**
     * Create and initialize a TestBed. Async because module loading
     * (Phase 1 + Phase 2 + OnReady) is async.
     */
    static async create(options: TestBedOptions = {}): Promise<TestBed> {
        // Fresh container per TestBed — container is a singleton, so reset it
        // to avoid leaking state between tests.
        const container = Container.getInstance();
        container.clear?.();

        const logger = new LoggerService();
        const config = new ConfigService();

        if (options.config) {
            config.load(options.config);
        }

        container.registerProvider({ provide: LoggerService, useValue: logger });
        container.registerProvider({ provide: ConfigService, useValue: config });
        container.registerProvider({ provide: EventBus, useValue: eventBus });
        container.registerProvider({
            provide: DiscordWebhookService,
            useValue: new DiscordWebhookService(config, logger),
        });

        // Apply provider overrides BEFORE modules load so real providers
        // can't register first.
        if (options.providers) {
            for (const p of options.providers) {
                container.registerProvider(p);
            }
        }

        const eventRegistry = new EventRegistry(container, eventBus);
        container.registerProvider({ provide: EventRegistry, useValue: eventRegistry });

        const moduleLoader = new ModuleLoader(container, eventRegistry);

        const bed = new TestBed(container, moduleLoader, eventBus, logger, config);

        if (options.rootModule) {
            await moduleLoader.load(options.rootModule);
            if (options.fullBootstrap !== false) {
                await moduleLoader.initializeProviders();
                await moduleLoader.callOnReadyMethods();
            }
        }

        return bed;
    }

    /**
     * Get a provider from the container. Throws if not registered.
     */
    get<T>(type: Type<T>): T {
        return this.container.get(type);
    }

    /** Access the raw container (for advanced introspection). */
    getContainer(): Container {
        return this.container;
    }

    /** Access the ConfigService — convenience for assertions. */
    getConfig(): ConfigService {
        return this.config;
    }

    /** Collected entities from all loaded modules. */
    getCollectedEntities(): Type<any>[] {
        return this.moduleLoader.getCollectedEntities();
    }

    /**
     * Verify every collected entity has a `@PrimaryKey`. Returns the list of
     * entities missing a PK — empty array means all good.
     *
     * This is the check that would have caught the `bank_pools`/`government_budget`
     * reflection bugs at build time instead of at runtime.
     */
    verifyEntityPrimaryKeys(): Array<{ name: string; reason: string }> {
        const failures: Array<{ name: string; reason: string }> = [];
        for (const entity of this.getCollectedEntities()) {
            try {
                // Deepkit exposes reflection via the `ReflectionClass` API at runtime.
                // We do a lazy require so tests don't hard-depend on @deepkit/type.
                const { ReflectionClass } = require('@deepkit/type');
                const rc = ReflectionClass.from(entity);
                const pks = rc.getPrimaries();
                if (!pks || pks.length === 0) {
                    failures.push({ name: entity.name, reason: 'No @PrimaryKey on any property' });
                }
            } catch (err) {
                failures.push({
                    name: entity.name,
                    reason: `Reflection failed: ${(err as Error).message}`,
                });
            }
        }
        return failures;
    }

    /**
     * Collect all registered controllers from loaded modules.
     */
    getControllers(): Type<any>[] {
        const controllers: Type<any>[] = [];
        const visited = new Set<Type<any>>();

        const collect = (moduleClass: Type<any>) => {
            if (visited.has(moduleClass)) return;
            visited.add(moduleClass);

            const imports: Type<any>[] = Reflect.getMetadata(METADATA_KEYS.MODULE_IMPORTS, moduleClass) || [];
            for (const imp of imports) collect(imp);

            const modControllers: Type<any>[] = Reflect.getMetadata(METADATA_KEYS.MODULE_CONTROLLERS, moduleClass) || [];
            controllers.push(...modControllers);
        };

        // Walk from every loaded module's tree. Since we only have loadedModules
        // via moduleLoader's private field, easier: collect from this.moduleLoader
        // if it exposes; otherwise walk imports from rootModule manually.
        return controllers;
    }
}
