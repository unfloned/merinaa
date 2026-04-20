import type { Type, Guard, Interceptor, Pipe, Provider } from '@merinaa/core';
import { Container } from '../container/container';
import { ModuleLoader } from '../container/module-loader';
import { EventBus, eventBus } from '../events/event-bus';
import { EventRegistry } from '../events/event-registry';
import { Application } from './application';
import { LoggerService } from '../services/logger.service';
import { ConfigService } from '../services/config.service';
import { DiscordWebhookService } from '../services/discord-webhook.service';
import { CronService } from '../services/cron.service';
import { PermissionService } from '../services/permission.service';

/**
 * Builder for creating Application instances
 */
export class ApplicationBuilder {
    private globalGuards: Type<Guard>[] = [];
    private globalInterceptors: Type<Interceptor>[] = [];
    private globalPipes: Type<Pipe>[] = [];
    private globalProviders: (Type<any> | Provider)[] = [];

    private container: Container;
    private eventBusInstance: EventBus;
    private logger: LoggerService;
    private config: ConfigService;

    constructor() {
        this.container = Container.getInstance();
        this.eventBusInstance = eventBus;
        this.logger = new LoggerService();
        this.config = new ConfigService();

        // Register core services
        this.container.registerProvider({
            provide: LoggerService,
            useValue: this.logger,
        });
        this.container.registerProvider({
            provide: ConfigService,
            useValue: this.config,
        });
        this.container.registerProvider({
            provide: EventBus,
            useValue: this.eventBusInstance,
        });
    }

    /**
     * Add global guards
     */
    useGlobalGuards(...guards: Type<Guard>[]): this {
        this.globalGuards.push(...guards);
        return this;
    }

    /**
     * Add global interceptors
     */
    useGlobalInterceptors(...interceptors: Type<Interceptor>[]): this {
        this.globalInterceptors.push(...interceptors);
        return this;
    }

    /**
     * Add global pipes
     */
    useGlobalPipes(...pipes: Type<Pipe>[]): this {
        this.globalPipes.push(...pipes);
        return this;
    }

    /**
     * Add global providers
     */
    useGlobalProviders(...providers: (Type<any> | Provider)[]): this {
        this.globalProviders.push(...providers);
        return this;
    }

    /**
     * Set configuration values (flat dot-path keys).
     * Existing keys are overwritten.
     *
     * @example builder.configure({ 'framework.debug': true, 'server.name': 'Dev' })
     */
    configure(config: Record<string, any>): this {
        for (const [key, value] of Object.entries(config)) {
            this.config.set(key, value);
        }
        return this;
    }

    /**
     * Load a nested configuration object. Flattened to dot-paths and set
     * with overwrite semantics. This is the primary way to load a root
     * `framework.config.ts` file.
     *
     * Module defaults (from `@Module({ config })`) are merged **later**
     * during module loading — they won't overwrite anything set here.
     *
     * @example
     * builder.loadConfig({
     *   framework: { debug: true },
     *   testing: { discord: { enabled: true, webhook: '...' } },
     * });
     */
    loadConfig(config: Record<string, any>): this {
        this.config.load(config);
        return this;
    }

    /**
     * Build the application
     */
    build(): Application {
        // Register framework services lazily — they read ConfigService values
        // that may have been set via loadConfig()/configure() above.
        this.container.registerProvider({
            provide: DiscordWebhookService,
            useValue: new DiscordWebhookService(this.config, this.logger),
        });
        this.container.registerProvider({
            provide: CronService,
            useValue: new CronService(this.logger),
        });
        this.container.registerProvider({
            provide: PermissionService,
            useValue: new PermissionService(this.logger, this.eventBusInstance),
        });

        // Register global providers
        this.container.registerAll(this.globalProviders);

        // Create event registry
        const eventRegistry = new EventRegistry(this.container, this.eventBusInstance);
        this.container.registerProvider({
            provide: EventRegistry,
            useValue: eventRegistry,
        });

        // Create module loader
        const moduleLoader = new ModuleLoader(this.container, eventRegistry);

        // Create and return application
        return new Application(
            this.container,
            moduleLoader,
            this.eventBusInstance,
            eventRegistry,
            this.logger
        );
    }
}

/**
 * Create a new application builder
 */
export function createApplicationBuilder(): ApplicationBuilder {
    return new ApplicationBuilder();
}
