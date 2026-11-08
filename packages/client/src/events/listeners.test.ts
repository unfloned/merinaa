import { describe, it, expect, beforeEach, vi } from 'vitest';

type Native = (event: string, handler: (...args: any[]) => unknown) => void;

const native = { net: new Map<string, number>(), local: new Map<string, number>(), handlers: new Map<string, (...args: any[]) => unknown>() };

function fake(kind: 'net' | 'local'): Native {
    return (event, handler) => {
        native[kind].set(event, (native[kind].get(event) ?? 0) + 1);
        native.handlers.set(`${kind}:${event}`, handler);
    };
}

beforeEach(() => {
    vi.resetModules();
    native.net.clear();
    native.local.clear();
    native.handlers.clear();
    vi.stubGlobal('onNet', fake('net'));
    vi.stubGlobal('on', fake('local'));
    vi.stubGlobal('RegisterNuiCallbackType', () => undefined);
});

describe('Listener ohne Leck', () => {
    it('meldet je Event nur einen nativen Listener an, egal wie oft listen() läuft', async () => {
        const { listen, listenerCount } = await import('./listeners.js');

        for (let round = 0; round < 25; round++) listen('net', 'framework:player:data', () => undefined);

        expect(native.net.get('framework:player:data')).toBe(1);
        expect(listenerCount('net', 'framework:player:data')).toBe(25);
    });

    it('verteilt an alle Handler und gibt sie über die Abmeldung wieder frei', async () => {
        const { listen, listenerCount } = await import('./listeners.js');
        const calls: string[] = [];

        const stop = listen('local', 'notification:show', (text: string) => calls.push(`a:${text}`));
        listen('local', 'notification:show', (text: string) => calls.push(`b:${text}`));
        native.handlers.get('local:notification:show')?.('hallo');
        stop();
        native.handlers.get('local:notification:show')?.('tschüss');

        expect(calls).toEqual(['a:hallo', 'b:hallo', 'b:tschüss']);
        expect(listenerCount('local', 'notification:show')).toBe(1);
    });

    it('warnt mit Event-Namen, sobald es eng wird', async () => {
        const { listen } = await import('./listeners.js');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        for (let round = 0; round < 12; round++) listen('net', 'inventory:update', () => undefined);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0]?.[0]).toContain('net:inventory:update');
        warn.mockRestore();
    });

    it('ersetzt NUI-Callbacks statt sie zu stapeln', async () => {
        const { handleNui } = await import('./nui-handlers.js');
        const answers: unknown[] = [];

        for (let round = 0; round < 15; round++) handleNui('inventory', (_data: unknown, cb: (response: unknown) => void) => cb(round));
        native.handlers.get('local:__cfx_nui:inventory')?.({}, (answer: unknown) => answers.push(answer));

        expect(native.local.get('__cfx_nui:inventory')).toBe(1);
        expect(answers).toEqual([14]);
    });

    it('meldet einen Controller nur einmal an', async () => {
        const { listenerCount } = await import('./listeners.js');
        const { ClientApplication } = await import('../app/client-application.js');
        const { METADATA_KEYS, EventType } = await import('@merinaa/core');
        class PlayerController {
            onData(): void {}
        }
        Reflect.defineMetadata(METADATA_KEYS.EVENT_HANDLERS, [{ type: EventType.SERVER, event: 'player:data', method: 'onData' }], PlayerController);

        for (let round = 0; round < 5; round++) ClientApplication.getInstance().registerController(PlayerController);

        expect(listenerCount('net', 'player:data')).toBe(1);
    });
});
