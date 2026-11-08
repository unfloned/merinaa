import { handleNui } from '../events/nui-handlers';

/**
 * Bridge between client scripts and NUI (React)
 */
export class NuiBridge {
    private callbacks = new Map<string, (data: any) => any>();
    private isVisible = false;
    private currentPage: string | null = null;

    constructor() {
        this.setupCallbacks();
    }

    /**
     * Setup NUI callback handlers
     */
    private setupCallbacks(): void {
        handleNui('framework', (data: any, cb: (response: any) => void) => {
            const { action, payload } = data;

            const handler = this.callbacks.get(action);
            if (handler) {
                try {
                    const result = handler(payload);
                    if (result instanceof Promise) {
                        result
                            .then((res) => cb(res ?? { ok: true }))
                            .catch((err) => cb({ error: err.message }));
                    } else {
                        cb(result ?? { ok: true });
                    }
                } catch (error: any) {
                    cb({ error: error.message });
                }
            } else {
                cb({ error: `Unknown action: ${action}` });
            }
        });

        // Built-in close handler
        this.onCallback('close', () => {
            this.hide();
        });
    }

    /**
     * Register a callback handler
     */
    onCallback(action: string, handler: (data: any) => any): void {
        this.callbacks.set(action, handler);
    }

    /**
     * Remove a callback handler
     */
    offCallback(action: string): void {
        this.callbacks.delete(action);
    }

    /**
     * Send a message to NUI
     */
    send(action: string, payload?: any): void {
        SendNUIMessage({ action, payload });
    }

    /**
     * Show NUI with a specific page
     */
    show(page: string, data?: any, focus: boolean = true, cursor: boolean = true): void {
        this.isVisible = true;
        this.currentPage = page;

        SetNuiFocus(focus, cursor);
        this.send('show', { page, data });
    }

    /**
     * Hide NUI
     */
    hide(): void {
        this.isVisible = false;
        this.currentPage = null;

        SetNuiFocus(false, false);
        this.send('hide');
    }

    /**
     * Toggle NUI visibility
     */
    toggle(page: string, data?: any): void {
        if (this.isVisible && this.currentPage === page) {
            this.hide();
        } else {
            this.show(page, data);
        }
    }

    /**
     * Check if NUI is visible
     */
    getVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Get current page
     */
    getCurrentPage(): string | null {
        return this.currentPage;
    }

    /**
     * Set focus state
     */
    setFocus(hasFocus: boolean, hasCursor: boolean): void {
        SetNuiFocus(hasFocus, hasCursor);
    }

    /**
     * Set focus but keep game input
     */
    setFocusKeepInput(keepInput: boolean): void {
        SetNuiFocusKeepInput(keepInput);
    }
}

// Singleton instance
let nuiBridge: NuiBridge | null = null;

/**
 * Get the NUI bridge instance
 */
export function getNuiBridge(): NuiBridge {
    if (!nuiBridge) {
        nuiBridge = new NuiBridge();
    }
    return nuiBridge;
}
