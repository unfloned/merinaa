import { useEffect, useCallback, useState, useRef } from 'react';
import { useNuiStore } from '../stores/nui.store';

/**
 * Hook to listen for NUI events
 */
export function useNuiEvent<T = any>(action: string, handler: (data: T) => void) {
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const listener = (event: MessageEvent) => {
            // Support both 'action' and 'type' for backwards compatibility
            const eventAction = event.data.action || event.data.type;
            if (eventAction === action) {
                // Prefer payload, then data, but NEVER the whole event.data object
                // which would include {action, payload} causing React error #31
                const payload = event.data.payload ?? event.data.data ?? null;
                savedHandler.current(payload);
            }
        };

        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, [action]);
}

/**
 * Hook to handle NUI visibility
 */
export function useNuiVisibility() {
    const [visible, setVisible] = useState(false);
    const [page, setPage] = useState<string | null>(null);

    useNuiEvent<{ page: string; data?: any }>('show', (data) => {
        setVisible(true);
        setPage(data.page);
    });

    useNuiEvent('hide', () => {
        setVisible(false);
        setPage(null);
    });

    return { visible, page };
}

/**
 * Fetch NUI callback directly (non-hook version)
 */
export async function fetchNui<T = any, R = any>(action: string, payload?: T): Promise<R> {
    const resourceName = (window as any).GetParentResourceName?.() ?? 'fivem-framework';

    try {
        const response = await fetch(`https://${resourceName}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {}),
        });

        const text = await response.text();
        if (!text || text.trim() === '') {
            return {} as R;
        }

        return JSON.parse(text);
    } catch (error) {
        console.warn(`[fetchNui] Failed to fetch ${action}:`, error);
        return {} as R;
    }
}

/**
 * Hook to call NUI callbacks
 */
export function useNuiCallback<T = any, R = any>(action: string) {
    return useCallback(
        async (payload?: T): Promise<R> => {
            return fetchNui<T, R>(action, payload);
        },
        [action]
    );
}

/**
 * Hook to handle keyboard shortcuts
 */
export function useKeyPress(targetKey: string, handler: () => void, deps: any[] = []) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === targetKey) {
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [targetKey, ...deps]);
}

/**
 * Setup NUI event listeners
 */
export function useNuiSetup() {
    const addNotification = useNuiStore((state) => state.addNotification);
    const setPlayerData = useNuiStore((state) => state.setPlayerData);
    const setLoading = useNuiStore((state) => state.setLoading);

    const removeNotification = useNuiStore((state) => state.removeNotification);
    const updateNotificationProgress = useNuiStore((state) => state.updateNotificationProgress);

    // Notification handler
    useNuiEvent<{
        message: string;
        type: 'success' | 'error' | 'info' | 'warning' | 'vehicle' | 'inventory' | 'progress';
        duration?: number;
        title?: string;
        id?: string;
        progress?: number;
        canCancel?: boolean;
    }>('notify', (data) => {
        addNotification({
            id: data.id || Date.now().toString(),
            message: data.message,
            type: data.type,
            duration: data.type === 'progress' ? 0 : (data.duration || 5000),
            title: data.title,
            createdAt: Date.now(),
            progress: data.progress,
            canCancel: data.canCancel,
        });
    });

    // Progress update handler
    useNuiEvent<{ id: string; progress: number }>('notify:updateProgress', (data) => {
        updateNotificationProgress(data.id, data.progress);
    });

    // Remove notification handler
    useNuiEvent<{ id: string }>('notify:remove', (data) => {
        removeNotification(data.id);
    });

    // Player data handler
    useNuiEvent('player:data', setPlayerData);

    // Loading handler
    useNuiEvent<{ show: boolean; message?: string }>('loading', (data) => {
        setLoading(data.show, data.message);
    });
}
