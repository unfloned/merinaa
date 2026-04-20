import type { AppConfig, ModuleManifest } from './interfaces/app-config.interface';

/**
 * Declare a merinaa application. Used in the project root `merinaa.config.ts`.
 *
 * The returned object is consumed by the pre-build generator which produces
 * the three surface-specific registries (`.merinaa/server.ts`, `.merinaa/client.ts`,
 * `.merinaa/ui.ts`).
 *
 * @example
 * ```ts
 * // merinaa.config.ts
 * import { defineApp } from '@merinaa/core';
 * import bank from './modules/bank/module.config';
 * import character from './modules/character/module.config';
 *
 * export default defineApp({
 *     name: 'everlast',
 *     database: { type: 'mysql', host: '...', ... },
 *     modules: [bank, character],
 * });
 * ```
 */
export function defineApp(config: AppConfig): AppConfig {
    return config;
}

/**
 * Declare a merinaa module manifest. Used in `modules/<name>/module.config.ts`.
 *
 * The manifest contains only metadata — no runtime imports of server classes
 * or React components. Code is picked up by convention from the sibling
 * `server/`, `client/` and `ui/` folders.
 *
 * @example
 * ```ts
 * // modules/bank/module.config.ts
 * import { defineModule } from '@merinaa/core';
 *
 * export default defineModule({
 *     name: 'bank',
 *     hasServer: true,
 *     hasClient: true,
 *     ui: {
 *         pages: [
 *             { event: 'bank:open', component: 'pages/BankPage',
 *               focus: true, disableMovement: true, disableCamera: true },
 *             { event: 'atm:open', component: 'pages/AtmPage', focus: true },
 *         ],
 *         overlays: [
 *             { id: 'bank:hud', component: 'overlays/BankHud', alwaysMounted: true },
 *         ],
 *     },
 * });
 * ```
 */
export function defineModule(config: ModuleManifest): ModuleManifest {
    return config;
}

/**
 * Compute the effective close-event for a page.
 * Mirrors the default logic the generator applies so tooling stays aligned.
 */
export function resolvePageCloseEvent(event: string, explicit?: string): string {
    if (explicit) return explicit;
    if (event.endsWith(':open')) return event.slice(0, -':open'.length) + ':close';
    return event + ':close';
}
