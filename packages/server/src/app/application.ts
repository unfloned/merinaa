import type { Type, Guard, Interceptor, Pipe } from '@merinaa/core';
import { Container } from '../container/container';
import { ModuleLoader } from '../container/module-loader';
import { EventBus } from '../events/event-bus';
import { EventRegistry } from '../events/event-registry';
import { LoggerService } from '../services/logger.service';
import { ConfigService } from '../services/config.service';
import { DatabaseModule } from '../database/database.module';

/**
 * Main application class
 */
export class Application {
    private isStarted = false;
    private globalGuards: Type<Guard>[] = [];
    private globalInterceptors: Type<Interceptor>[] = [];
    private globalPipes: Type<Pipe>[] = [];

    constructor(
        private container: Container,
        private moduleLoader: ModuleLoader,
        private eventBus: EventBus,
        private eventRegistry: EventRegistry,
        private logger: LoggerService
    ) {}

    /**
     * Start the application with the root module
     */
    async start(rootModule: Type<any>): Promise<void> {
        if (this.isStarted) {
            throw new Error('Application already started');
        }

        this.logger.log('Application', 'Starting...');

        try {
            // Phase 1: Load modules (scan structure, collect entities, call onModuleInit)
            // No providers/controllers are registered yet — they may depend on Database
            await this.moduleLoader.load(rootModule);

            // Connect database with all collected entities from modules
            const collectedEntities = this.moduleLoader.getCollectedEntities();
            this.logger.log('Application', `Collected ${collectedEntities.length} entities from modules`);
            await DatabaseModule.connectWithEntities(collectedEntities);

            // Phase 2: Now that DB is connected, register all providers, repositories, controllers
            await this.moduleLoader.initializeProviders();

            // Wait for database migrations to complete before calling OnReady methods
            // DatabaseModule emits 'database:ready' after migrations finish
            await this.waitForDatabaseReady();

            // Call all OnReady methods (after modules loaded, DB ready)
            await this.moduleLoader.callOnReadyMethods();

            this.isStarted = true;
            this.logger.log('Application', 'Started successfully!');

            // Emit application bootstrap event (internal EventBus)
            await this.eventBus.emit('framework:bootstrap');

            // Also emit as FiveM event for standalone modules
            emit('framework:bootstrap');
        } catch (error) {
            this.logger.error('Application', 'Failed to start:', error);
            throw error;
        }
    }

    /**
     * Stop the application
     */
    async stop(): Promise<void> {
        if (!this.isStarted) return;

        this.logger.log('Application', 'Stopping...');

        // Emit shutdown event
        await this.eventBus.emit('framework:shutdown');

        // Destroy all modules
        await this.moduleLoader.destroyAll();

        this.isStarted = false;
        this.logger.log('Application', 'Stopped.');
    }

    /**
     * Get the DI container
     */
    getContainer(): Container {
        return this.container;
    }

    /**
     * Get the event bus
     */
    getEventBus(): EventBus {
        return this.eventBus;
    }

    /**
     * Get a provider from the container
     */
    get<T>(target: Type<T>): T {
        return this.container.get(target);
    }

    /**
     * Check if application is running
     */
    isRunning(): boolean {
        return this.isStarted;
    }

    /**
     * Wait for database:ready event (emitted after migrations complete)
     * Times out after 30 seconds to prevent infinite wait
     */
    private waitForDatabaseReady(): Promise<void> {
        return new Promise((resolve) => {
            let resolved = false;

            // Set a timeout in case the event was already emitted or DB is not configured
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    this.logger.warn('Application', 'database:ready timeout - proceeding anyway');
                    resolve();
                }
            }, 30000);

            // Listen for the database:ready event
            on('database:ready', () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    this.logger.log('Application', 'Database ready - proceeding with OnReady methods');
                    resolve();
                }
            });
        });
    }
}
