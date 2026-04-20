import { create } from 'zustand';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Definition of a registered UI page.
 *
 * Pages are kept mounted for the lifetime of the UI so their internal
 * `useNuiEvent(...)` listeners are active by the time the triggering event
 * arrives. Visibility is the page's own responsibility — typically driven
 * by its own `:open` / `:close` events.
 *
 * The `loader` function is kept separately from the React.lazy wrapper so
 * `createUI()` can preload all pages before the first React render,
 * guaranteeing listeners are registered before any NUI event is dispatched.
 */
export interface PageDefinition {
    event: string;
    component: LazyExoticComponent<ComponentType<any>>;
    /** Raw loader, used by createUI() to preload the module */
    loader: () => Promise<{ default: ComponentType<any> }>;
    closeEvent?: string;
    name?: string;
}

interface PageRegistryState {
    pages: Map<string, PageDefinition>;
}

export const usePageRegistry = create<PageRegistryState>(() => ({
    pages: new Map(),
}));

export interface RegisterPageOptions {
    name?: string;
    closeEvent?: string;
}

export function registerPage(
    event: string,
    load: () => Promise<{ default: ComponentType<any> }>,
    options?: RegisterPageOptions
): void {
    const definition: PageDefinition = {
        event,
        component: lazy(load),
        loader: load,
        name: options?.name || event,
        closeEvent: options?.closeEvent,
    };

    usePageRegistry.setState((state) => {
        const pages = new Map(state.pages);
        pages.set(event, definition);
        return { pages };
    });

    console.log(`[PageRegistry] Registered page: ${definition.name} (${event})`);
}

export function unregisterPage(event: string): void {
    usePageRegistry.setState((state) => {
        const pages = new Map(state.pages);
        pages.delete(event);
        return { pages };
    });
}

export function getRegisteredPages(): PageDefinition[] {
    return Array.from(usePageRegistry.getState().pages.values());
}
