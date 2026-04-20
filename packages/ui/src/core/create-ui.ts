import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '../App';
import { registerPage, getRegisteredPages } from './page-registry';
import { registerOverlay, getRegisteredOverlays } from './overlay-registry';
import type { ComponentType } from 'react';

export interface ModuleUIRegistry {
    [moduleName: string]: {
        pages?: Array<{
            event: string;
            load: () => Promise<{ default: ComponentType<any> }>;
            closeEvent?: string;
            focus?: boolean;
            disableMovement?: boolean;
            disableCamera?: boolean;
            closeOnEscape?: boolean;
        }>;
        overlays?: Array<{
            id: string;
            load: () => Promise<{ default: ComponentType<any> }>;
            alwaysMounted?: boolean;
        }>;
    };
}

export interface CreateUIOptions {
    modules?: ModuleUIRegistry;
    /** Legacy: direct page registrations */
    pages?: Array<{
        event: string;
        load: () => Promise<{ default: ComponentType<any> }>;
        closeEvent?: string;
        name?: string;
    }>;
}

/**
 * Create and mount the merinaa UI application.
 *
 * Flow:
 *   1. Register every page + overlay from the module registry.
 *   2. Preload all lazy module chunks (awaits every loader).
 *   3. Only after all preloads resolve, mount React and report `ui:ready`.
 *
 * Step 2 is critical — without it the client would start dispatching NUI
 * events before the lazy-loaded page components had a chance to register
 * their internal listeners, and the first event of each session would be
 * silently lost.
 */
export function createUI(options: CreateUIOptions = {}) {
    if (options.modules) {
        for (const [moduleName, module] of Object.entries(options.modules)) {
            for (const page of module.pages ?? []) {
                registerPage(page.event, page.load, {
                    name: `${moduleName}:${page.event}`,
                    closeEvent: page.closeEvent,
                });
            }
            for (const overlay of module.overlays ?? []) {
                registerOverlay(overlay.id, overlay.load, {
                    alwaysMounted: overlay.alwaysMounted,
                });
            }
        }
    }

    if (options.pages) {
        for (const page of options.pages) {
            registerPage(page.event, page.load, {
                name: page.name,
                closeEvent: page.closeEvent,
            });
        }
    }

    return {
        async mount(selector: string) {
            const root = document.getElementById(selector.replace('#', ''));
            if (!root) {
                throw new Error(`[createUI] Element "${selector}" not found`);
            }

            // Preload all registered lazy modules so their React components
            // can mount synchronously on first render and their internal
            // useNuiEvent listeners are active before any event fires.
            const pages = getRegisteredPages();
            const overlays = getRegisteredOverlays();
            const loaders = [
                ...pages.map((p) => p.loader().catch((err) => {
                    console.error(`[createUI] Failed to preload page ${p.name}:`, err);
                })),
                ...overlays.map((o) => o.loader().catch((err) => {
                    console.error(`[createUI] Failed to preload overlay ${o.id}:`, err);
                })),
            ];

            await Promise.all(loaders);
            console.log(`[createUI] Preloaded ${pages.length} page(s) + ${overlays.length} overlay(s)`);

            ReactDOM.createRoot(root).render(
                React.createElement(React.StrictMode, null,
                    React.createElement(App)
                )
            );

            // Defer ui:ready by one tick so React's initial render commits
            // before we tell the client to start dispatching events.
            setTimeout(() => {
                const resourceName = (window as any).GetParentResourceName?.() ?? 'merinaa';
                fetch(`https://${resourceName}/ui:ready`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                }).catch(() => {});

                console.log('[UI] React mounted, sent ui:ready');
            }, 50);
        },
    };
}
