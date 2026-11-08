import 'reflect-metadata';
import { METADATA_KEYS, EventType } from '@merinaa/core';
import type { Type, EventHandler } from '@merinaa/core';
import { getNuiBridge, type NuiBridge } from '../nui/nui-bridge';
import { listen } from '../events/listeners';

/**
 * Client-side application
 */
export class ClientApplication {
    private static instance: ClientApplication;
    private isStarted = false;
    private controllers: any[] = [];
    private registered = new Set<Type<any>>();
    private tickHandlers: Map<string, number> = new Map();

    private nuiBridge: NuiBridge;

    private constructor() {
        this.nuiBridge = getNuiBridge();
    }

    /**
     * Get the application instance
     */
    static getInstance(): ClientApplication {
        if (!ClientApplication.instance) {
            ClientApplication.instance = new ClientApplication();
        }
        return ClientApplication.instance;
    }

    /**
     * Register a controller
     */
    registerController(controllerClass: Type<any>): void {
        if (this.registered.has(controllerClass)) return;
        this.registered.add(controllerClass);

        const instance = new controllerClass();
        this.controllers.push(instance);

        // Get event handlers from metadata
        const handlers: any[] = Reflect.getMetadata(METADATA_KEYS.EVENT_HANDLERS, controllerClass) || [];

        for (const handler of handlers) {
            this.registerHandler(instance, handler);
        }

        // Register tick handlers
        const prototype = controllerClass.prototype;
        const methodNames = Object.getOwnPropertyNames(prototype);

        for (const methodName of methodNames) {
            const isTick = Reflect.getMetadata('framework:tick', prototype, methodName);
            if (isTick) {
                this.registerTickHandler(instance, methodName);
            }
        }

        console.log(`[Client] Registered controller: ${controllerClass.name}`);
    }

    /**
     * Register an event handler
     */
    private registerHandler(instance: any, handler: any): void {
        const method = instance[handler.method].bind(instance);

        switch (handler.type) {
            case EventType.SERVER:
                listen('net', handler.event, method);
                break;
            case EventType.INTERNAL:
                listen('local', handler.event, method);
                break;
        }
    }

    /**
     * Register a tick handler
     */
    private registerTickHandler(instance: any, methodName: string): void {
        const method = instance[methodName].bind(instance);
        const tickId = setTick(method);
        this.tickHandlers.set(`${instance.constructor.name}.${methodName}`, tickId);
    }

    /**
     * Start the application
     */
    start(): void {
        if (this.isStarted) return;

        this.isStarted = true;
        console.log('[Client] Application started');

        emit('framework:client:ready');
    }

    /**
     * Stop the application
     */
    stop(): void {
        if (!this.isStarted) return;

        // Clear all tick handlers
        for (const [name, tickId] of this.tickHandlers) {
            clearTick(tickId);
        }
        this.tickHandlers.clear();

        this.isStarted = false;
        console.log('[Client] Application stopped');
    }

    /**
     * Get the NUI bridge
     */
    getNuiBridge(): NuiBridge {
        return this.nuiBridge;
    }

    /**
     * Send event to server
     */
    emitServer(event: string, ...args: any[]): void {
        emitNet(event, ...args);
    }

    /**
     * Listen for server events
     */
    onServer(event: string, handler: EventHandler): () => void {
        return listen('net', event, handler);
    }
}

/**
 * Create client application builder
 */
export function createClientApp(): ClientApplication {
    return ClientApplication.getInstance();
}
