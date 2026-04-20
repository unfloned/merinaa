import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
// NOTE: vitest.config.ts is loaded by Node BEFORE the vite aliases apply,
// so we import the reporter via relative path here. In downstream projects
// consuming `@merinaa/server` as an npm package, the equivalent is:
//   import { DiscordReporter } from '@merinaa/server/testing/reporters';
import { DiscordReporter } from './packages/server/src/testing/reporters';

/**
 * Vitest root configuration.
 *
 * - Runs TypeScript sources directly (no separate build step needed).
 * - Path aliases resolve `@merinaa/*` imports to the local workspace
 *   `src/` folders. **Important:** regex-style aliases ensure deep subpaths
 *   (`@merinaa/server/testing/reporters`) resolve correctly and mirror
 *   the `exports` map in each package's `package.json`.
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./packages/server/src/testing/vitest-setup.ts'],
        include: [
            'packages/**/*.test.ts',
            'modules/**/*.test.ts',
        ],
        exclude: ['**/node_modules/**', '**/dist/**', '**/resource/**', '**/templates/**'],
        // 'default' prints to terminal, DiscordReporter posts a live-editing
        // embed to Discord when `testing.discord.webhook` is set in
        // framework.config.yaml or `DISCORD_TESTING_WEBHOOK` env. No-ops silently
        // when neither is set.
        reporters: ['default', new DiscordReporter()],
    },
    resolve: {
        alias: [
            // Match deep subpaths first so `@merinaa/server/testing`
            // doesn't accidentally resolve to `.../server/src/testing` via the
            // broader alias below. Order matters — first match wins.
            { find: /^@merinaa\/core\/(.*)$/, replacement: resolve(__dirname, 'packages/core/src/$1') },
            { find: /^@merinaa\/server\/(.*)$/, replacement: resolve(__dirname, 'packages/server/src/$1') },
            { find: /^@merinaa\/client\/(.*)$/, replacement: resolve(__dirname, 'packages/client/src/$1') },
            { find: /^@merinaa\/ui\/(.*)$/, replacement: resolve(__dirname, 'packages/ui/src/$1') },
            // Root of each package (no subpath) → index.ts
            { find: '@merinaa/core', replacement: resolve(__dirname, 'packages/core/src') },
            { find: '@merinaa/server', replacement: resolve(__dirname, 'packages/server/src') },
            { find: '@merinaa/client', replacement: resolve(__dirname, 'packages/client/src') },
            { find: '@merinaa/ui', replacement: resolve(__dirname, 'packages/ui/src') },
            { find: /^@modules\/(.*)$/, replacement: resolve(__dirname, 'modules/$1') },
        ],
    },
});
