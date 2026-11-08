import { handleNui } from '../events/nui-handlers';
import type { PageOptions } from '@merinaa/core';

/**
 * Client-side page & overlay manager.
 *
 * Wired up by the generated `.merinaa/client.ts` via `bootstrapClient({ pageOptions })`.
 * Consumer code calls `showPage('bank', { accountId: 42 })` and this module
 * resolves the id → registered options, applies NUI focus, starts the
 * movement/camera lock loop, and dispatches the open event over NUI.
 *
 * `hidePage()` (or `hidePage('bank')`) reverses everything.
 *
 * Overlays are simpler: they're always mounted on the UI side. `showOverlay` /
 * `hideOverlay` just toggle their visibility via NUI events.
 */

type ActivePageState = {
    id: string;
    options: PageOptions;
    controlThread: number | null;
};

let pageOptionsMap: Record<string, PageOptions> = {};
let activePage: ActivePageState | null = null;
let escapeHandlerInstalled = false;
let closeCallbackInstalled = false;

/** Register page options. Called once during bootstrapClient(...) */
export function setPageOptions(map: Record<string, PageOptions>): void {
    pageOptionsMap = map;
    ensureEscapeHandler();
    ensureCloseCallback();
}

export function getPageOptions(idOrEvent: string): PageOptions | undefined {
    return findOptions(idOrEvent);
}

function findOptions(idOrEvent: string): PageOptions | undefined {
    for (const opts of Object.values(pageOptionsMap)) {
        if (opts.id === idOrEvent || opts.event === idOrEvent) return opts;
    }
    return undefined;
}

/**
 * Open a registered page by id. Framework applies focus, movement/camera lock
 * and sends the NUI open-event with the provided data.
 *
 * If another page is open it is closed first.
 *
 * @example
 *   showPage('bank', { accountId: 42 });
 *   showPage('fuel', { pumpId: 3, price: 1.89 });
 */
export function showPage(id: string, data?: any): void {
    const options = findOptions(id);
    if (!options) {
        console.warn(`[PageManager] showPage('${id}'): no registered page with this id/event. ` +
            `Declared pages: ${Object.values(pageOptionsMap).map((o) => o.id).join(', ')}`);
        return;
    }

    if (activePage) {
        hidePage(activePage.id);
    }

    SetNuiFocus(options.focus, options.focus);

    const controlThread = startControlLock(options);

    activePage = {
        id: options.id,
        options,
        controlThread,
    };

    SendNUIMessage({ type: options.event, ...(data ?? {}) });
}

/**
 * Close the given page (or the active one if no id is passed).
 * Releases focus and stops the movement/camera lock loop.
 */
export function hidePage(id?: string): void {
    if (!activePage) return;
    if (id && id !== activePage.id && id !== activePage.options.event) return;

    const { options, controlThread } = activePage;

    SetNuiFocus(false, false);
    if (controlThread !== null) stopControlLock(controlThread);

    SendNUIMessage({ type: options.closeEvent });

    activePage = null;
}

export function getActivePage(): string | null {
    return activePage?.id ?? null;
}

/** Show an overlay (no focus, no cursor). */
export function showOverlay(id: string): void {
    SendNUIMessage({ type: `overlay:show:${id}` });
}

export function hideOverlay(id: string): void {
    SendNUIMessage({ type: `overlay:hide:${id}` });
}

// ============================================================
// Deprecated aliases — keep for backwards-compat with earlier alphas
// ============================================================

/** @deprecated use `showPage(id, data)` */
export const openPage = showPage;

/** @deprecated use `hidePage(id?)` */
export const closePage = hidePage;

// ============================================================
// Internal: control-lock thread
// ============================================================

const controlLockActive = new Map<number, boolean>();

function startControlLock(options: PageOptions): number | null {
    if (!options.disableMovement && !options.disableCamera) return null;

    const id = Date.now();
    controlLockActive.set(id, true);

    setTick(() => {
        if (!controlLockActive.get(id)) return;

        if (options.disableMovement) {
            const moveControls = [30, 31, 21, 22, 23, 24, 25, 32, 33, 34, 35, 44, 47];
            for (const c of moveControls) DisableControlAction(0, c, true);
        }

        if (options.disableCamera) {
            DisableControlAction(0, 1, true);
            DisableControlAction(0, 2, true);
            DisableControlAction(0, 239, true);
            DisableControlAction(0, 240, true);
        }
    });

    return id;
}

function stopControlLock(id: number): void {
    controlLockActive.set(id, false);
    setTimeout(() => controlLockActive.delete(id), 100);
}

// ============================================================
// Internal: Escape + UI-initiated close
// ============================================================

function ensureEscapeHandler(): void {
    if (escapeHandlerInstalled) return;
    escapeHandlerInstalled = true;

    setTick(() => {
        if (!activePage || !activePage.options.closeOnEscape) return;
        if (IsDisabledControlJustPressed(0, 200) || IsControlJustPressed(0, 200)) {
            hidePage();
        }
    });
}

function ensureCloseCallback(): void {
    if (closeCallbackInstalled) return;
    closeCallbackInstalled = true;

    handleNui('merinaa', (data: any, cb: (resp: any) => void) => {
        try {
            if (data?.action === 'close-page') hidePage();
            cb({ ok: true });
        } catch (err: any) {
            cb({ error: err?.message ?? String(err) });
        }
    });
}
