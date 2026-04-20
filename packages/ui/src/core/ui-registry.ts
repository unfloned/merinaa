import type { ComponentType } from 'react';

/**
 * Client-side UI Component Registry.
 *
 * Modules register their React components here at BUILD TIME.
 * At runtime, server-side metadata (tab definitions, editor configs)
 * is merged with these components for rendering.
 *
 * @example
 * ```typescript
 * // In modules/custom-blips/ui/registry.ts (build-time):
 * uiRegistry.register('admin-tab', 'blips', BlipAdminTab);
 *
 * // In AdminPanel.tsx (runtime):
 * const Component = uiRegistry.get('admin-tab', 'blips');
 * ```
 */
class UIComponentRegistry {
    private components = new Map<string, ComponentType<any>>();

    /**
     * Register a component under a namespace + id
     * @param namespace - Registry namespace (e.g. 'admin-tab', 'gamedesigner-editor')
     * @param id - Component id (e.g. 'blips', 'farming')
     * @param component - React component to render
     */
    register(namespace: string, id: string, component: ComponentType<any>): void {
        const key = `${namespace}:${id}`;
        this.components.set(key, component);
    }

    /**
     * Get a specific component
     */
    get(namespace: string, id: string): ComponentType<any> | undefined {
        return this.components.get(`${namespace}:${id}`);
    }

    /**
     * Get all components for a namespace
     */
    getAll(namespace: string): Array<{ id: string; component: ComponentType<any> }> {
        const result: Array<{ id: string; component: ComponentType<any> }> = [];
        const prefix = `${namespace}:`;
        for (const [key, component] of this.components) {
            if (key.startsWith(prefix)) {
                result.push({ id: key.slice(prefix.length), component });
            }
        }
        return result;
    }

    /**
     * Check if a component is registered
     */
    has(namespace: string, id: string): boolean {
        return this.components.has(`${namespace}:${id}`);
    }
}

export const uiRegistry = new UIComponentRegistry();
