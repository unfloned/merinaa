import { useEffect, useRef } from 'react';
import { useNuiVisibility, useNuiEvent, fetchNui } from './hooks/useNui';
import { useNuiStore, NotifyType, Hint } from './stores/nui.store';
import { Notifications } from './components/Notifications';
import { Hints } from './components/Hints';
import { HUDOverlay } from './components/HUDOverlay';
import { DynamicPages, DynamicOverlays } from './core';

// YACA notification ID for persistent warning
const YACA_NOTIFICATION_ID = 'yaca-connection-warning';

/**
 * Minimal framework shell.
 *
 * The app only renders framework-level primitives (notifications, hints,
 * HUD overlay for placing-mode, and the two dynamic registries). Concrete
 * pages and overlays are registered by consumers via `registerPage` /
 * `registerOverlay` (typically through the generated `.merinaa/ui.ts`).
 */
export function App() {
    const { visible } = useNuiVisibility();
    const notifications = useNuiStore((state) => state.notifications);
    const hints = useNuiStore((state) => state.hints);
    const addNotification = useNuiStore((state) => state.addNotification);
    const showHint = useNuiStore((state) => state.showHint);
    const hideHint = useNuiStore((state) => state.hideHint);
    const removeNotification = useNuiStore((state) => state.removeNotification);
    const updateNotificationProgress = useNuiStore((state) => state.updateNotificationProgress);

    // Notification handler (from server NotificationService → client NuiBridge)
    useNuiEvent('notify', (data: {
        type: NotifyType; message: string; duration?: number;
        id?: string; title?: string; progress?: number; canCancel?: boolean;
    }) => {
        const duration = data.type === 'progress' ? 0 : (data.duration ?? 5000);
        addNotification({
            id: data.id || `notify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: data.type,
            message: data.message,
            duration,
            title: data.title,
            createdAt: Date.now(),
            progress: data.progress,
            canCancel: data.canCancel,
        });
    });

    useNuiEvent('notify:updateProgress', (data: { id: string; progress: number }) => {
        updateNotificationProgress(data.id, data.progress);
    });

    useNuiEvent('notify:remove', (data: { id: string }) => {
        removeNotification(data.id);
    });

    useNuiEvent('hint:show', (data: Hint) => showHint(data));
    useNuiEvent('hint:hide', (data: { id: string }) => hideHint(data.id));

    // YACA status — persistent warning while voice is disconnected
    const yacaChecked = useRef(false);
    useEffect(() => {
        if (yacaChecked.current) return;
        yacaChecked.current = true;

        const timer = setTimeout(async () => {
            try {
                const result = await fetchNui<void, { connected: boolean; error: string | null }>('yaca:getStatus');
                if (result && !result.connected) {
                    addNotification({
                        id: YACA_NOTIFICATION_ID,
                        type: 'warning',
                        message: result.error || 'Voice-Plugin nicht verbunden.',
                        duration: 0,
                        title: 'Voice nicht verbunden',
                        createdAt: Date.now(),
                    });
                }
            } catch (err) {
                console.warn('[App] Failed to query YACA status:', err);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [addNotification]);

    useNuiEvent('yaca:error', (data: { id: string; message: string }) => {
        addNotification({
            id: YACA_NOTIFICATION_ID,
            type: 'warning',
            message: data.message,
            duration: 0,
            title: 'Voice nicht verbunden',
            createdAt: Date.now(),
        });
    });

    useNuiEvent('yaca:connected', () => {
        removeNotification(YACA_NOTIFICATION_ID);
        addNotification({
            id: `yaca-success-${Date.now()}`,
            type: 'success',
            message: 'Voice wurde erfolgreich verbunden.',
            duration: 3000,
            title: 'Voice verbunden',
            createdAt: Date.now(),
        });
    });

    // Escape key → sends 'close' to client framework, which calls closePage()
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && visible) {
                const resourceName = (window as any).GetParentResourceName?.() ?? 'merinaa';
                fetch(`https://${resourceName}/merinaa`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'close-page' }),
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible]);

    return (
        <div className="w-full h-full relative">
            {/* Module-registered overlays (always-mounted widgets + event-toggled) */}
            <DynamicOverlays />

            {/* Module-registered pages (lazy-loaded, focus-managed by client helpers) */}
            <DynamicPages />

            {/* Framework primitives */}
            <HUDOverlay />
            <Hints hints={hints} />
            <Notifications notifications={notifications} />
        </div>
    );
}
