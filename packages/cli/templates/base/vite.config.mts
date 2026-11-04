import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite config for the NUI bundle.
 *
 * - Entry: `ui/index.html` → `ui/main.tsx` → `@modules/.merinaa/ui` (generated)
 * - Output: `resource/ui/` (shipped to FiveM via `ui_page` in fxmanifest.lua)
 * - `@modules/*` resolves module-local UI files (pages, overlays, components)
 *   referenced lazily by the generated registry entry.
 */
export default defineConfig({
    root: 'ui',
    base: './',
    plugins: [react()],
    build: {
        outDir: resolve(import.meta.dirname, 'resource/ui'),
        emptyOutDir: true,
        assetsDir: 'assets',
        rollupOptions: {
            input: resolve(import.meta.dirname, 'ui/index.html'),
        },
    },
    resolve: {
        alias: {
            '@modules': resolve(import.meta.dirname, 'modules'),
        },
    },
});
