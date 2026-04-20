import type { EventHandler } from '@merinaa/core';

/**
 * Central event bus for internal framework events
 */
export class EventBus {
    private handlers = new Map<string, Set<EventHandler>>();
    private onceHandlers = new Map<string, Set<EventHandler>>();

    /**
     * Subscribe to an event
     */
    on(event: string, handler: EventHandler): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);

        // Return unsubscribe function
        return () => this.off(event, handler);
    }

    /**
     * Subscribe to an event (once)
     */
    once(event: string, handler: EventHandler): () => void {
        if (!this.onceHandlers.has(event)) {
            this.onceHandlers.set(event, new Set());
        }
        this.onceHandlers.get(event)!.add(handler);

        return () => this.onceHandlers.get(event)?.delete(handler);
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, handler: EventHandler): void {
        this.handlers.get(event)?.delete(handler);
        this.onceHandlers.get(event)?.delete(handler);
    }

    /**
     * Emit an event
     */
    async emit(event: string, ...args: any[]): Promise<void> {
        // Regular handlers
        const handlers = this.handlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    await handler(...args);
                } catch (error) {
                    console.error(`[EventBus] Error in handler for ${event}:`, error);
                }
            }
        }

        // Once handlers
        const onceHandlers = this.onceHandlers.get(event);
        if (onceHandlers) {
            for (const handler of onceHandlers) {
                try {
                    await handler(...args);
                } catch (error) {
                    console.error(`[EventBus] Error in once handler for ${event}:`, error);
                }
            }
            this.onceHandlers.delete(event);
        }
    }

    /**
     * Remove all handlers for an event
     */
    removeAllListeners(event?: string): void {
        if (event) {
            this.handlers.delete(event);
            this.onceHandlers.delete(event);
        } else {
            this.handlers.clear();
            this.onceHandlers.clear();
        }
    }

    /**
     * Get handler count for an event
     */
    listenerCount(event: string): number {
        return (this.handlers.get(event)?.size || 0) + (this.onceHandlers.get(event)?.size || 0);
    }

    // === FiveM Bridge ===

    /**
     * Register a FiveM client event handler (onNet)
     */
    onClient(event: string, handler: (source: number, ...args: any[]) => void | Promise<void>): void {
        onNet(event, (...args: any[]) => {
            const source = (global as any).source as number;
            handler(source, ...args);
        });
    }

    /**
     * Emit an event to a specific client or all clients
     */
    emitClient(event: string, target: number | -1, ...args: any[]): void {
        emitNet(event, target, ...args);
    }

    /**
     * Emit an event to all clients
     */
    emitAllClients(event: string, ...args: any[]): void {
        emitNet(event, -1, ...args);
    }

    /**
     * Register a local server event
     */
    onServer(event: string, handler: (...args: any[]) => void | Promise<void>): void {
        on(event, handler);
    }

    /**
     * Emit a local server event
     */
    emitServer(event: string, ...args: any[]): void {
        emit(event, ...args);
    }
}

// Export singleton
export const eventBus = new EventBus();
