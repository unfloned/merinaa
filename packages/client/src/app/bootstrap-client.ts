import type { PageOptions } from '@merinaa/core';
import { setPageOptions } from '../ui/page-manager';

export interface BootstrapClientOptions {
    /** Page options map keyed by open-event (produced by the generator) */
    pageOptions: Record<string, PageOptions>;
}

/**
 * Boot the merinaa client runtime from a generated `.merinaa/client.ts`.
 *
 * The generator emits one side-effect `import` per module (their controllers
 * self-register on load) and then calls this bootstrap with the resolved
 * page-options map. The map feeds the `openPage()` / `closePage()` helpers
 * so they can apply focus and control-locking automatically.
 *
 * @example
 * ```ts
 * // .merinaa/client.ts — generated
 * import { bootstrapClient } from '@merinaa/client';
 * import '@modules/bank/client';
 * import '@modules/character/client';
 *
 * bootstrapClient({
 *     pageOptions: {
 *         'bank:open': { focus: true, disableMovement: true, disableCamera: true,
 *                        closeOnEscape: true, closeEvent: 'bank:close' },
 *     },
 * });
 * ```
 */
export function bootstrapClient(options: BootstrapClientOptions): void {
    setPageOptions(options.pageOptions);
}
