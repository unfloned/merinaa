export type NuiHandler = (data: any, cb: (response: any) => void) => unknown;

const handlers = new Map<string, NuiHandler>();

export function handleNui(name: string, handler: NuiHandler): void {
    const known = handlers.has(name);
    handlers.set(name, handler);
    if (known) return;

    RegisterNuiCallbackType(name);
    on(`__cfx_nui:${name}`, (data: any, cb: (response: any) => void) => handlers.get(name)?.(data, cb));
}
