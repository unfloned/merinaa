import { resolve } from 'path';
import { existsSync } from 'fs';
import type { DiscordReporterOptions } from './discord-reporter';

/**
 * Resolve Discord reporter config from (in order):
 *   1. Constructor options passed by the user
 *   2. `modules/framework.config.ts` (team-shared defaults)
 *   3. Environment variables (CI-friendly)
 *
 * Returns both the loaded config (for `ConfigService`) and the flattened
 * reporter options used by the reporter itself.
 */
export function frameworkConfigFromEnvOrFile(
    userOptions: DiscordReporterOptions = {}
): { config: Record<string, any>; options: DiscordReporterOptions } {
    let fileConfig: Record<string, any> = {};
    try {
        const root = process.cwd();
        // The root framework.config.ts lives in modules/ (see PLAN-MODULAR).
        const configPath = resolve(root, 'modules/framework.config.ts');
        if (existsSync(configPath)) {
            // Using require() at runtime — vitest already resolves .ts via its
            // own transform. Swallow errors so CI without the file still works.
            const mod = require(configPath);
            fileConfig = mod.frameworkConfig ?? mod.default ?? {};
        }
    } catch {
        // Config file optional — fall back to env.
    }

    const fileTesting = fileConfig.testing?.discord ?? {};

    const options: DiscordReporterOptions = {
        webhook:
            userOptions.webhook ??
            process.env.DISCORD_TESTING_WEBHOOK ??
            fileTesting.webhook,
        mentionOnFail:
            userOptions.mentionOnFail ??
            process.env.DISCORD_TESTING_MENTION ??
            fileTesting.mentionOnFail,
        successColor: userOptions.successColor ?? fileTesting.successColor,
        failureColor: userOptions.failureColor ?? fileTesting.failureColor,
        throttleMs: userOptions.throttleMs ?? fileTesting.throttleMs,
        label: userOptions.label,
    };

    return { config: fileConfig, options };
}
