import { create } from 'zustand';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface OverlayDefinition {
    id: string;
    component: LazyExoticComponent<ComponentType<any>>;
    /** Raw loader for preloading */
    loader: () => Promise<{ default: ComponentType<any> }>;
    alwaysMounted: boolean;
}

interface OverlayRegistryState {
    overlays: Map<string, OverlayDefinition>;
}

export const useOverlayRegistry = create<OverlayRegistryState>(() => ({
    overlays: new Map(),
}));

export function registerOverlay(
    id: string,
    load: () => Promise<{ default: ComponentType<any> }>,
    options?: { alwaysMounted?: boolean }
): void {
    const definition: OverlayDefinition = {
        id,
        component: lazy(load),
        loader: load,
        alwaysMounted: options?.alwaysMounted ?? true,
    };

    useOverlayRegistry.setState((state) => {
        const overlays = new Map(state.overlays);
        overlays.set(id, definition);
        return { overlays };
    });

    console.log(`[OverlayRegistry] Registered overlay: ${id}`);
}

export function unregisterOverlay(id: string): void {
    useOverlayRegistry.setState((state) => {
        const overlays = new Map(state.overlays);
        overlays.delete(id);
        return { overlays };
    });
}

export function getRegisteredOverlays(): OverlayDefinition[] {
    return Array.from(useOverlayRegistry.getState().overlays.values());
}
