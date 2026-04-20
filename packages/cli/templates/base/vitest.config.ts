import { defineConfig } from 'vitest/config';
import { DiscordReporter } from '@merinaa/server/testing/reporters';

/**
 * Vitest configuration.
 *
 * - Runs TypeScript sources directly via vitest's transform.
 * - Installs FiveM mocks (GetConvar, emit, onNet, ...) before each test file.
 * - DiscordReporter posts a live-editing embed when `testing.discord.webhook`
 *   is set in `framework.config.yaml` or the `DISCORD_TESTING_WEBHOOK` env.
 *   Silently no-ops when neither is set.
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['@merinaa/server/testing/setup'],
        include: ['src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/resource/**'],
        reporters: ['default', new DiscordReporter()],
    },
});
