/**
 * NUI Callback Helpers (functional, non-decorator)
 *
 * Reduces boilerplate for NUI callback registration from:
 *   RegisterNuiCallbackType('name');
 *   on('__cfx_nui:name', (data, cb) => { handler(data); cb({}); });
 *
 * To:
 *   onNui('name', (data) => handler(data));
 */

/**
 * Register a single NUI callback
 */
export function onNui(name: string, handler: (data: any) => any): void {
    RegisterNuiCallbackType(name);
    on(`__cfx_nui:${name}`, async (data: any, cb: Function) => {
        try {
            const result = await handler(data);
            cb(result ?? {});
        } catch (error) {
            console.error(`[NUI:${name}] Error:`, error);
            cb({ error: true });
        }
    });
}

/**
 * Register multiple NUI callbacks at once
 */
export function onNuiBatch(callbacks: Record<string, (data: any) => any>): void {
    for (const [name, handler] of Object.entries(callbacks)) {
        onNui(name, handler);
    }
}
