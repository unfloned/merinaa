import { getNuiBridge } from '../nui/nui-bridge';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'progress';

export interface NotificationOptions {
    message: string;
    type?: NotificationType;
    duration?: number;
    title?: string;
    id?: string; // Fixed ID for updating existing notifications
    progress?: number; // 0-100 for progress notifications
    canCancel?: boolean; // Show cancel hint for progress
}

/**
 * Service for displaying notifications
 */
export class NotificationService {
    private static instance: NotificationService;

    private constructor() {
        // Listen for server notifications (multiple event names for compatibility)
        onNet('framework:notify', (options: NotificationOptions) => {
            this.show(options);
        });

        onNet('notify:show', (options: NotificationOptions) => {
            this.show(options);
        });

        onNet('notify:client', (options: NotificationOptions) => {
            this.show(options);
        });

        // Listen for local client notifications (emit from other client scripts)
        on('notification:show', (options: NotificationOptions | string, message?: string) => {
            // Support both formats: object or (type, message)
            if (typeof options === 'string') {
                this.show({ type: options as NotificationType, message: message || '' });
            } else {
                this.show(options);
            }
        });
    }

    /**
     * Get the service instance
     */
    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Show a notification
     */
    show(options: NotificationOptions): void {
        // Send to NUI only (no native GTA notification)
        getNuiBridge().send('notify', {
            message: options.message,
            type: options.type || 'info',
            duration: options.duration || 5000,
            title: options.title,
            id: options.id, // Pass ID for updating existing notifications
            progress: options.progress,
            canCancel: options.canCancel,
        });
    }

    /**
     * Show a progress notification (persistent until completed or cancelled)
     */
    showProgress(id: string, title: string, progress: number, canCancel: boolean = true): void {
        this.show({
            id,
            title,
            message: `${Math.round(progress)}%`,
            type: 'progress',
            progress: Math.min(100, Math.max(0, progress)),
            duration: 0, // Persistent until manually removed
            canCancel,
        });
    }

    /**
     * Update progress of an existing progress notification
     */
    updateProgress(id: string, progress: number): void {
        getNuiBridge().send('notify:updateProgress', {
            id,
            progress: Math.min(100, Math.max(0, progress)),
        });
    }

    /**
     * Complete and remove a progress notification
     */
    completeProgress(id: string, successMessage?: string): void {
        if (successMessage) {
            this.show({
                id,
                message: successMessage,
                type: 'success',
                duration: 3000,
            });
        } else {
            getNuiBridge().send('notify:remove', { id });
        }
    }

    /**
     * Cancel/remove a progress notification
     */
    cancelProgress(id: string): void {
        getNuiBridge().send('notify:remove', { id });
    }

    /**
     * Show success notification
     */
    success(message: string, title?: string): void {
        this.show({ message, type: 'success', title });
    }

    /**
     * Show error notification
     */
    error(message: string, title?: string): void {
        this.show({ message, type: 'error', title });
    }

    /**
     * Show info notification
     */
    info(message: string, title?: string): void {
        this.show({ message, type: 'info', title });
    }

    /**
     * Show warning notification
     */
    warning(message: string, title?: string): void {
        this.show({ message, type: 'warning', title });
    }

    /**
     * Show native GTA notification
     */
    private showNative(message: string): void {
        SetNotificationTextEntry('STRING');
        AddTextComponentString(message);
        DrawNotification(false, false);
    }

    /**
     * Show advanced native notification
     */
    showAdvanced(
        message: string,
        title: string,
        subtitle: string,
        icon: string = 'CHAR_DEFAULT'
    ): void {
        SetNotificationTextEntry('STRING');
        AddTextComponentString(message);
        SetNotificationMessage(icon, icon, true, 4, title, subtitle);
        DrawNotification(false, false);
    }
}

// Export singleton getter
export function getNotificationService(): NotificationService {
    return NotificationService.getInstance();
}
