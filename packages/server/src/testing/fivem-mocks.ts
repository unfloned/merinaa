/**
 * FiveM runtime mocks for tests.
 *
 * FiveM exposes globals like `GetConvar`, `emit`, `on`, `emitNet`, `onNet`
 * that don't exist outside the FiveM scripting runtime. These mocks make
 * framework code testable under plain Node + vitest.
 *
 * Import this file once in your vitest setup — it installs no-op globals
 * that tests can override with `vi.spyOn(globalThis, 'emit')`.
 */

export interface FivemMockRegistry {
    /** Captured emit() calls. */
    emits: Array<{ event: string; args: any[] }>;
    /** Captured emitNet() calls. */
    emitNets: Array<{ event: string; target: number | undefined; args: any[] }>;
    /** Registered on() handlers by event name. */
    onHandlers: Map<string, Function[]>;
    /** Registered onNet() handlers by event name. */
    onNetHandlers: Map<string, Function[]>;
    /** Values returned from GetConvar — overridable per-test. */
    convars: Map<string, string>;
}

/**
 * Install mock globals on `globalThis`. Idempotent — safe to call multiple
 * times. Returns the registry for inspection/reset in tests.
 */
export function installFivemMocks(): FivemMockRegistry {
    const registry: FivemMockRegistry = (globalThis as any).__fivemMocks ?? {
        emits: [],
        emitNets: [],
        onHandlers: new Map(),
        onNetHandlers: new Map(),
        convars: new Map([
            ['sv_hostname', 'Test Server'],
            ['sv_maxclients', '32'],
            ['framework_env', 'development'],
            ['framework_debug', 'false'],
            ['framework_locale', 'en'],
            ['mysql_connection_string', ''],
        ]),
    };

    (globalThis as any).__fivemMocks = registry;

    // GetConvar / GetConvarInt
    (globalThis as any).GetConvar = (name: string, fallback: string = '') =>
        registry.convars.get(name) ?? fallback;
    (globalThis as any).GetConvarInt = (name: string, fallback: number = 0) => {
        const v = registry.convars.get(name);
        if (v === undefined) return fallback;
        const n = parseInt(v, 10);
        return Number.isNaN(n) ? fallback : n;
    };

    // emit / emitNet
    (globalThis as any).emit = (event: string, ...args: any[]) => {
        registry.emits.push({ event, args });
        const handlers = registry.onHandlers.get(event);
        if (handlers) for (const h of handlers) h(...args);
    };
    (globalThis as any).emitNet = (event: string, target: number | undefined, ...args: any[]) => {
        registry.emitNets.push({ event, target, args });
    };

    // on / onNet
    (globalThis as any).on = (event: string, handler: Function) => {
        const arr = registry.onHandlers.get(event) ?? [];
        arr.push(handler);
        registry.onHandlers.set(event, arr);
    };
    (globalThis as any).onNet = (event: string, handler: Function) => {
        const arr = registry.onNetHandlers.get(event) ?? [];
        arr.push(handler);
        registry.onNetHandlers.set(event, arr);
    };

    // Misc natives used by framework bootstrap
    (globalThis as any).GetCurrentResourceName = () => 'fivem-framework';
    (globalThis as any).GetPlayerName = (_src: number) => 'TestPlayer';
    (globalThis as any).GetPlayerIdentifiers = (_src: number) => [];

    return registry;
}

/**
 * Reset all captured state (emits, handlers). Useful between tests.
 */
export function resetFivemMocks(): void {
    const r: FivemMockRegistry | undefined = (globalThis as any).__fivemMocks;
    if (!r) return;
    r.emits.length = 0;
    r.emitNets.length = 0;
    r.onHandlers.clear();
    r.onNetHandlers.clear();
}

/**
 * Set a Convar value for the duration of a test.
 */
export function setConvar(name: string, value: string): void {
    const r: FivemMockRegistry | undefined = (globalThis as any).__fivemMocks;
    if (!r) throw new Error('installFivemMocks() must be called first');
    r.convars.set(name, value);
}
