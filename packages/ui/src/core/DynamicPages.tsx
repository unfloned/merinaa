import { Suspense } from 'react';
import { usePageRegistry, type PageDefinition } from './page-registry';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Renders every registered page permanently mounted.
 *
 * Each page component is responsible for its own visibility — typically by
 * subscribing to its `:open` / `:close` events via `useNuiEvent` and early-
 * returning `null` while hidden. Lazy-loaded chunks are preloaded in
 * `createUI()` before the first render, so listeners are active before the
 * client dispatches any event.
 *
 * Each page is isolated in its own Suspense + ErrorBoundary so a broken
 * page doesn't take down the rest of the UI.
 */
export function DynamicPages() {
    const pages = usePageRegistry((state) => state.pages);

    return (
        <>
            {Array.from(pages.values()).map((page) => (
                <PageSlot key={page.event} config={page} />
            ))}
        </>
    );
}

function PageSlot({ config }: { config: PageDefinition }) {
    const Component = config.component;
    return (
        <ErrorBoundary label={`page:${config.name ?? config.event}`}>
            <Suspense fallback={null}>
                <Component />
            </Suspense>
        </ErrorBoundary>
    );
}
