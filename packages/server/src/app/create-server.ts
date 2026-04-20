import 'reflect-metadata';
import { Module } from '@merinaa/core';
import type { Type } from '@merinaa/core';
import { createApplicationBuilder } from './application-builder';
import { DatabaseModule, type DatabaseConfig } from '../database/database.module';

interface CreateServerOptions {
    /** Database configuration */
    database?: {
        config: DatabaseConfig;
        autoMigrate?: boolean;
    };
    /** Feature modules to load */
    modules: Type<any>[];
    /** Server configuration (key-value pairs) */
    config?: Record<string, any>;
}

/**
 * Create and configure the server application
 *
 * @example
 * ```typescript
 * // server.ts
 * import { createServer } from '@everlast/server';
 * import { BankModule } from './modules/bank/server';
 * import { InventoryModule } from './modules/inventory/server';
 *
 * const server = createServer({
 *   database: {
 *     config: getDatabaseConfig(),
 *     autoMigrate: true,
 *   },
 *   modules: [BankModule, InventoryModule],
 * });
 *
 * server.start();
 * ```
 */
export function createServer(options: CreateServerOptions) {
    const builder = createApplicationBuilder();

    // Apply config
    if (options.config) {
        builder.configure(options.config);
    }

    // Build the dynamic root module with all imports
    const imports: Type<any>[] = [];

    // Add DatabaseModule if configured
    if (options.database) {
        imports.push(
            DatabaseModule.forRoot({
                config: options.database.config,
                autoConnect: true,
            })
        );
    }

    // Add all feature modules
    imports.push(...options.modules);

    // Create root module dynamically
    @Module({ imports })
    class AppModule {}

    const app = builder.build();

    return {
        /**
         * Start the server
         */
        async start() {
            await app.start(AppModule);
            return app;
        },

        /**
         * Get the application instance (after start)
         */
        getApp() {
            return app;
        },
    };
}
