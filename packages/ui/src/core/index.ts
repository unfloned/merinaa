export { registerPage, unregisterPage, getRegisteredPages, usePageRegistry } from './page-registry';
export type { PageDefinition, RegisterPageOptions } from './page-registry';
export {
    registerOverlay,
    unregisterOverlay,
    getRegisteredOverlays,
    useOverlayRegistry,
} from './overlay-registry';
export type { OverlayDefinition } from './overlay-registry';
export { DynamicPages } from './DynamicPages';
export { DynamicOverlays } from './DynamicOverlays';
export { createUI } from './create-ui';
export type { CreateUIOptions, ModuleUIRegistry } from './create-ui';
export { ErrorBoundary } from './ErrorBoundary';
