import { getNuiBridge } from './nui-bridge';

/**
 * Decorator to register a method as NUI callback
 */
export function NuiCallback(action: string): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const original = descriptor.value;

        // Store callback info for later registration
        const callbacks: Array<{ action: string; method: string }> =
            Reflect.getMetadata('framework:nui:callbacks', target.constructor) || [];

        callbacks.push({ action, method: propertyKey as string });

        Reflect.defineMetadata('framework:nui:callbacks', callbacks, target.constructor);

        return descriptor;
    };
}

/**
 * Register all NUI callbacks from a class
 */
export function registerNuiCallbacks(instance: any): void {
    const callbacks: Array<{ action: string; method: string }> =
        Reflect.getMetadata('framework:nui:callbacks', instance.constructor) || [];

    const bridge = getNuiBridge();

    for (const { action, method } of callbacks) {
        bridge.onCallback(action, (data: any) => {
            return instance[method](data);
        });
    }
}

/**
 * Helper class for NUI communication
 */
export class NuiHelper {
    /**
     * Send notification to NUI
     */
    static notify(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
        getNuiBridge().send('notify', { message, type });
    }

    /**
     * Show loading state
     */
    static showLoading(message?: string): void {
        getNuiBridge().send('loading', { show: true, message });
    }

    /**
     * Hide loading state
     */
    static hideLoading(): void {
        getNuiBridge().send('loading', { show: false });
    }

    /**
     * Show confirmation dialog
     */
    static async confirm(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            const bridge = getNuiBridge();

            // Register one-time callback
            const handleConfirm = (data: { confirmed: boolean }) => {
                bridge.offCallback('confirm:response');
                resolve(data.confirmed);
            };

            bridge.onCallback('confirm:response', handleConfirm);
            bridge.send('confirm', { title, message });
        });
    }

    /**
     * Show input dialog
     */
    static async input(title: string, placeholder?: string): Promise<string | null> {
        return new Promise((resolve) => {
            const bridge = getNuiBridge();

            const handleInput = (data: { value: string | null }) => {
                bridge.offCallback('input:response');
                resolve(data.value);
            };

            bridge.onCallback('input:response', handleInput);
            bridge.send('input', { title, placeholder });
        });
    }

    /**
     * Update progress bar
     */
    static updateProgress(progress: number, message?: string): void {
        getNuiBridge().send('progress', { progress, message });
    }
}
