export type ListenerKind = 'net' | 'local';
export type Listener = (...args: any[]) => unknown;

const WARN_AT = 10;

const listeners = new Map<string, Set<Listener>>();
const warned = new Set<string>();

function keyOf(kind: ListenerKind, event: string): string {
    return `${kind}:${event}`;
}

function attach(kind: ListenerKind, event: string, handlers: Set<Listener>): void {
    const dispatch = (...args: any[]) => {
        for (const handler of [...handlers]) handler(...args);
    };
    if (kind === 'net') onNet(event, dispatch);
    else on(event, dispatch);
}

function warnWhenCrowded(key: string, count: number): void {
    if (count <= WARN_AT || warned.has(key)) return;
    warned.add(key);
    console.warn(`[merinaa] ${count} Listener auf "${key}". Wird ein Listener bei jedem Aufruf neu angemeldet? Die Abmeldefunktion von listen() nutzen.`);
}

export function listen(kind: ListenerKind, event: string, handler: Listener): () => void {
    const key = keyOf(kind, event);
    let handlers = listeners.get(key);
    if (!handlers) {
        handlers = new Set();
        listeners.set(key, handlers);
        attach(kind, event, handlers);
    }
    handlers.add(handler);
    warnWhenCrowded(key, handlers.size);

    const registered = handlers;
    return () => {
        registered.delete(handler);
    };
}

export function listenerCount(kind: ListenerKind, event: string): number {
    return listeners.get(keyOf(kind, event))?.size ?? 0;
}
