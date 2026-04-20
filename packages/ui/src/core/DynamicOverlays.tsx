import { Suspense, useCallback, useState } from 'react';
import { useOverlayRegistry, type OverlayDefinition } from './overlay-registry';
import { useNuiEvent } from '../hooks/useNui';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Renders every registered overlay.
 *
 * - `alwaysMounted: true` (default) — the component is mounted from app start
 *   and self-manages its visibility via its own `useNuiEvent(...)` listeners.
 * - `alwaysMounted: false` — the wrapper toggles the component on
 *   `overlay:show:<id>` / `overlay:hide:<id>` NUI events, typically dispatched
 *   by the client-side `showOverlay(id)` / `hideOverlay(id)` helpers.
 *
 * Each overlay is isolated in its own Suspense + ErrorBoundary so a broken
 * overlay doesn't take down the rest of the UI.
 */
export function DynamicOverlays() {
    const overlays = useOverlayRegistry((state) => state.overlays);

    return (
        <>
            {Array.from(overlays.values()).map((def) => (
                <OverlaySlot key={def.id} def={def} />
            ))}
        </>
    );
}

function OverlaySlot({ def }: { def: OverlayDefinition }) {
    const [visible, setVisible] = useState(def.alwaysMounted);

    useNuiEvent(`overlay:show:${def.id}`, useCallback(() => {
        setVisible(true);
    }, []));

    useNuiEvent(`overlay:hide:${def.id}`, useCallback(() => {
        if (!def.alwaysMounted) setVisible(false);
    }, [def.alwaysMounted]));

    if (!visible) return null;

    const Component = def.component;
    return (
        <ErrorBoundary label={`overlay:${def.id}`}>
            <Suspense fallback={null}>
                <Component />
            </Suspense>
        </ErrorBoundary>
    );
}
