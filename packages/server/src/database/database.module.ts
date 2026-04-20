import { Module, Global } from '@merinaa/core';
import { Database } from '@deepkit/orm';
import { DatabaseService } from './database.service';
import { PlayerRepository } from './repositories/player.repository';
import { DatabaseConfig, DATABASE_CONFIG_TOKEN } from './config/database.config';

/**
 * Database module options
 */
export interface DatabaseModuleOptions {
    config: DatabaseConfig;
    autoConnect?: boolean;
}

/**
 * Database module
 * Provides database connectivity and framework-level repositories.
 *
 * Module-specific repositories live in the respective modules.
 */
@Global()
@Module({
    providers: [],
    exports: [
        DatabaseService,
        PlayerRepository,
    ],
})
export class DatabaseModule {
    private static options: DatabaseModuleOptions;
    private static databaseService: DatabaseService | null = null;
    private static moduleEntities: any[] = [];

    /**
     * Configure the database module
     */
    static forRoot(options: DatabaseModuleOptions): typeof DatabaseModule {
        DatabaseModule.options = options;
        return DatabaseModule;
    }

    /**
     * Get module options
     */
    static getOptions(): DatabaseModuleOptions | undefined {
        return DatabaseModule.options;
    }

    /**
     * Get the DatabaseService instance (after initialization)
     */
    static getDatabaseService(): DatabaseService | null {
        return DatabaseModule.databaseService;
    }

    /**
     * Set entities collected from modules by the ModuleLoader
     */
    static setModuleEntities(entities: any[]): void {
        DatabaseModule.moduleEntities = entities;
        console.log(`[DatabaseModule] Received ${entities.length} entities from modules`);
    }

    /**
     * Create providers for the module
     */
    static createProviders() {
        const { DatabaseService } = require('./database.service');
        const dbService = new DatabaseService();
        if (DatabaseModule.options?.config) {
            dbService.configure(DatabaseModule.options.config);
        }
        DatabaseModule.databaseService = dbService;

        return [
            // Config token
            {
                provide: DATABASE_CONFIG_TOKEN,
                useValue: DatabaseModule.options?.config,
            },
            // DatabaseService as singleton (already configured)
            {
                provide: DatabaseService,
                useValue: dbService,
            },
            // Database token - returns the Deepkit Database instance
            {
                provide: Database,
                useFactory: (dbService: any) => {
                    return dbService.getDatabase();
                },
                inject: [DatabaseService],
            },
            // Player repository (framework-level)
            PlayerRepository,
        ];
    }

    /**
     * Called when module is initialized during load phase
     */
    async onModuleInit(): Promise<void> {
        const dbService = DatabaseModule.databaseService;
        if (!dbService) {
            throw new Error('DatabaseService not initialized');
        }
        console.log('[DatabaseModule] Initialized (connection deferred until all modules loaded)');
    }

    /**
     * Connect to database with all collected entities from modules
     * Called by Application.start() after all modules are loaded
     */
    static async connectWithEntities(additionalEntities: any[] = []): Promise<void> {
        const dbService = DatabaseModule.databaseService;
        if (!dbService) {
            throw new Error('DatabaseService not initialized');
        }

        if (DatabaseModule.options?.autoConnect !== false) {
            console.log('[DatabaseModule] Connecting to database...');
            await dbService.connect(additionalEntities);
            console.log('[DatabaseModule] Database connected!');
        }

        if (dbService.isConnected() && DatabaseModule.options?.config?.autoMigrate) {
            console.log('[DatabaseModule] Running migrations in background...');

            dbService.migrate()
                .then(() => {
                    console.log('[DatabaseModule] Migrations complete!');
                    emit('database:ready');
                })
                .catch((error: any) => {
                    console.error('[DatabaseModule] Migration failed:', error);
                    emit('database:ready');
                });
        } else {
            emit('database:ready');
        }
    }
}

/**
 * Re-export framework-level items only
 */
export * from './entities';
export * from './repositories';
export * from './config/database.config';
export { DatabaseService } from './database.service';
