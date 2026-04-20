import 'reflect-metadata';
import { Module } from '@merinaa/core';
import type { AppConfig, Type } from '@merinaa/core';
import { createApplicationBuilder } from './application-builder';
import { DatabaseModule, type DatabaseConfig } from '../database/database.module';
import { loadYamlFromResource } from '../config';
import { RateLimitService } from '../services/rate-limit.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';

export interface BootstrapServerOptions {
    /** Feature module classes (each decorated with @Module) */
    modules: Type<any>[];
    /** The resolved AppConfig from merinaa.config.ts */
    app: AppConfig;
    /**
     * Optional: override the database config shipped in `app.database`.
     * Typically used by Everlast to feed convar-derived values.
     */
    databaseConfig?: DatabaseConfig;
    /**
     * Optional: YAML config filename to load from the resource directory.
     * If provided and the file exists, it is loaded before `app.framework`
     * overrides are applied.
     */
    yamlConfig?: string;
    /** Additional flat configuration (dot-paths) applied last. Overrides everything else. */
    extraConfig?: Record<string, any>;
}

/**
 * Boot a merinaa server application from a generated `.merinaa/server.ts`.
 *
 * Handles the full lifecycle:
 *   1. Load YAML config (optional)
 *   2. Apply AppConfig.framework overrides
 *   3. Apply extraConfig overrides (highest priority)
 *   4. Build dynamic @Module-decorated AppModule with DatabaseModule.forRoot(...)
 *      and all feature modules from the generator
 *   5. Start the application
 *
 * @example
 * ```ts
 * // .merinaa/server.ts — generated
 * import { bootstrapServer } from '@merinaa/server';
 * import { default as BankModule } from '@modules/bank/server';
 * import app from '../merinaa.config';
 *
 * bootstrapServer({ modules: [BankModule], app, databaseConfig: app.database as any });
 * ```
 */
export async function bootstrapServer(options: BootstrapServerOptions): Promise<void> {
    const { modules, app, databaseConfig, yamlConfig, extraConfig } = options;

    console.log(`[Framework] Bootstrapping server: ${app.name}`);

    const builder = createApplicationBuilder();

    // 1. Optional YAML
    if (yamlConfig) {
        try {
            const loaded = loadYamlFromResource(yamlConfig);
            if (loaded) builder.loadConfig(loaded);
        } catch (err) {
            console.warn(`[Framework] Could not load YAML config '${yamlConfig}':`, err);
        }
    }

    // 2. AppConfig.framework overrides
    if (app.framework) {
        builder.loadConfig({ framework: app.framework } as Record<string, any>);
    }

    // 3. extraConfig (convar-derived, highest priority)
    if (extraConfig) {
        builder.configure(extraConfig);
    }

    // 4. Build root module
    const imports: Type<any>[] = [];

    const dbConfig = databaseConfig ?? (app.database as DatabaseConfig | undefined);
    if (dbConfig) {
        imports.push(DatabaseModule.forRoot({ config: dbConfig, autoConnect: true }));
    }

    imports.push(...modules);

    @Module({ imports })
    class AppModule {}

    // Register the rate-limit service so it's available globally and wire
    // its guard if the consumer configured any rateLimit.* keys.
    builder.useGlobalProviders(RateLimitService);
    if (app.framework?.rateLimit || extraConfig?.['rateLimit']) {
        builder.useGlobalGuards(RateLimitGuard);
    }

    const application = builder.build();
    await application.start(AppModule);

    console.log(`[Framework] Server ready: ${app.name} with ${modules.length} modules`);
}
