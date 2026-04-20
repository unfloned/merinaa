import { Injectable } from '@merinaa/core';

/**
 * A single entry in a Registry
 */
export interface RegistryEntry<T> {
    id: string;
    data: T;
    source: string;
    priority: number;
}

/**
 * Generic Registry base class.
 *
 * The framework provides this mechanism — modules create concrete subclasses
 * to define their own extension points.
 *
 * @example
 * ```typescript
 * // In AdminModule:
 * @Injectable()
 * export class AdminTabRegistry extends Registry<AdminTabDefinition> {}
 *
 * // In CustomBlipsModule:
 * this.adminTabRegistry.register('blips', { label: 'Blips', ... }, 'custom-blips');
 * ```
 */
@Injectable()
export abstract class Registry<T> {
    private entries = new Map<string, RegistryEntry<T>>();
    private listeners: Array<(entries: RegistryEntry<T>[]) => void> = [];

    /**
     * Register a new entry
     */
    register(id: string, data: T, source: string, priority = 0): void {
        this.entries.set(id, { id, data, source, priority });
        console.log(`[${this.constructor.name}] Registered '${id}' from ${source}`);
        this.notifyListeners();
    }

    /**
     * Remove an entry
     */
    unregister(id: string): boolean {
        const result = this.entries.delete(id);
        if (result) this.notifyListeners();
        return result;
    }

    /**
     * Get all entries sorted by priority (highest first)
     */
    getAll(): RegistryEntry<T>[] {
        return Array.from(this.entries.values())
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get a specific entry
     */
    get(id: string): RegistryEntry<T> | undefined {
        return this.entries.get(id);
    }

    /**
     * Check if an entry exists
     */
    has(id: string): boolean {
        return this.entries.has(id);
    }

    /**
     * Number of entries
     */
    get size(): number {
        return this.entries.size;
    }

    /**
     * Listen for changes
     */
    onChange(listener: (entries: RegistryEntry<T>[]) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Serialize all entries for transport to client (JSON-safe)
     */
    serialize(): Array<{ id: string; data: T; priority: number }> {
        return this.getAll().map(e => ({
            id: e.id,
            data: e.data,
            priority: e.priority,
        }));
    }

    private notifyListeners(): void {
        const entries = this.getAll();
        for (const listener of this.listeners) {
            listener(entries);
        }
    }
}
