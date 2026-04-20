import { ClientApplication } from './client-application';

/**
 * Client module interface
 * Each module provides an init function that sets up client-side logic
 */
export interface ClientModuleDefinition {
    /** Module name for logging */
    name: string;
    /** Initialize the module (import client scripts, register handlers) */
    init: () => void | Promise<void>;
}

interface CreateClientOptions {
    /** Client modules to load */
    modules: ClientModuleDefinition[];
}

/**
 * Create and start the client application with modules
 *
 * @example
 * ```typescript
 * // client.ts
 * import { createClient } from '@everlast/client';
 *
 * createClient({
 *   modules: [
 *     { name: 'bank', init: () => import('./modules/bank/client') },
 *     { name: 'inventory', init: () => import('./modules/inventory/client') },
 *   ]
 * }).start();
 * ```
 */
export function createClient(options: CreateClientOptions) {
    const app = ClientApplication.getInstance();

    return {
        /**
         * Initialize all modules and start the client
         */
        async start() {
            console.log(`[Framework] Loading ${options.modules.length} client modules...`);

            for (const mod of options.modules) {
                try {
                    await mod.init();
                    console.log(`[Framework] Client module loaded: ${mod.name}`);
                } catch (error) {
                    console.error(`[Framework] Failed to load client module: ${mod.name}`, error);
                }
            }

            app.start();
            console.log(`[Framework] ${options.modules.length} client modules loaded`);
        },

        /**
         * Get the underlying ClientApplication instance
         */
        getApp() {
            return app;
        },
    };
}
