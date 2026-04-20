import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Locate the templates directory. In production (installed package) this is
 * `node_modules/@merinaa/cli/templates`. During development with the
 * monorepo build, it's `packages/cli/templates`.
 *
 * We resolve relative to this module's location — after compilation that's
 * `packages/cli/dist/utils/paths.js`, so templates sit at `../../templates`.
 *
 * The CLI compiles to CommonJS so `__dirname` is always available.
 */
export function resolveTemplatesDir(): string {
    const candidates = [
        resolve(__dirname, '../../templates'),     // dist/utils/paths.js → package/templates
        resolve(__dirname, '../../../templates'),  // fallback for different nesting
    ];
    for (const c of candidates) {
        if (existsSync(c)) return c;
    }
    throw new Error(`Could not locate templates directory (looked in: ${candidates.join(', ')})`);
}
