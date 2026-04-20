/**
 * Consumer-facing configuration types for merinaa apps.
 *
 * These types describe the shape of `merinaa.config.ts` (project root)
 * and `module.config.ts` (per module). The pre-build generator reads these
 * and emits surface-specific registries (`.merinaa/server.ts`, `.merinaa/client.ts`,
 * `.merinaa/ui.ts`).
 *
 * All values are plain metadata (strings, booleans) — no runtime imports,
 * so a single config can be read by server-esbuild, client-esbuild and
 * UI-vite bundlers alike without cross-bundle pollution.
 */

/**
 * Database config passed through to DatabaseModule.forRoot(...).
 * Re-declared here (instead of importing from @deepkit/orm) to keep @merinaa/core
 * free of database-package dependencies.
 */
export interface AppDatabaseConfig {
    type: 'mysql' | 'postgres' | 'sqlite';
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    [key: string]: unknown;
}

export interface AppConfig {
    /** Project name (kebab-case) */
    name: string;
    /** Database configuration — passed to DatabaseModule.forRoot */
    database?: AppDatabaseConfig;
    /** Active modules */
    modules: ModuleManifest[];
    /** Framework-level overrides merged into ConfigService */
    framework?: Record<string, unknown>;
}

export interface ModuleManifest {
    /**
     * Unique module identifier. Must match folder name
     * (e.g. `name: 'bank'` → `modules/bank/`).
     */
    name: string;

    /** Default: true. Set to false to exclude the module from all registries. */
    enabled?: boolean;

    /**
     * Other module names this module depends on. The generator uses this to
     * produce a deterministic load order.
     */
    dependsOn?: string[];

    /**
     * Controls how the generator handles this module's server code.
     *
     *  - `true` (default when a `server/` folder exists): import the default
     *    export of `modules/<name>/server/index.ts` as a `@Module`-decorated
     *    class and register it with Deepkit DI.
     *  - `'side-effect'`: perform a bare `import '@modules/<name>/server'`
     *    so standalone server code (e.g. top-level `RegisterCommand(...)`)
     *    executes without going through DI.
     *  - `false`: skip this module on the server.
     */
    hasServer?: boolean | 'side-effect';

    /**
     * When true, the generator adds a side-effect import of `modules/<name>/client`
     * to the client bundle. Expected: `modules/<name>/client/index.ts` registers
     * its controllers/commands on import.
     */
    hasClient?: boolean;

    /** UI pages and overlays contributed by this module. */
    ui?: ModuleUI;
}

export interface ModuleUI {
    pages?: PageDef[];
    overlays?: OverlayDef[];
}

export interface PageDef {
    /**
     * Short identifier used by client-side `showPage(id, ...)` calls.
     *
     * Defaults to the `event` value with a trailing `:open` suffix stripped
     * (so `event: 'bank:open'` → `id: 'bank'`). Declare explicitly for pages
     * whose event doesn't follow the `:open` convention.
     */
    id?: string;

    /** NUI event that opens this page (e.g. `'bank:open'`) */
    event: string;

    /**
     * Component path **relative to `modules/<name>/ui/`**, without extension.
     * Example: `'pages/BankPage'` → `modules/bank/ui/pages/BankPage.tsx`.
     *
     * The file must default-export the React component.
     */
    component: string;

    /**
     * NUI event that closes this page.
     * Default: `event` with `:open` replaced by `:close`,
     * or `event + ':close'` if no `:open` suffix is present.
     */
    closeEvent?: string;

    /** Grab NUI focus on open. Default: true. */
    focus?: boolean;

    /** Disable all player movement controls while the page is open. Default: false. */
    disableMovement?: boolean;

    /** Disable camera controls while the page is open. Default: false. */
    disableCamera?: boolean;

    /** Close the page when the user presses Escape. Default: true. */
    closeOnEscape?: boolean;
}

export interface OverlayDef {
    /** Unique overlay id (e.g. `'bank:hud'`) */
    id: string;

    /**
     * Component path relative to `modules/<name>/ui/`, without extension.
     * Example: `'overlays/BankHud'` → `modules/bank/ui/overlays/BankHud.tsx`.
     */
    component: string;

    /**
     * When true, the overlay is mounted from app start and manages its own
     * visibility internally. Overlays never receive NUI focus or cursor —
     * if an overlay needs to briefly interact with the mouse, the module
     * should open a page instead.
     *
     * Default: true.
     */
    alwaysMounted?: boolean;
}

/**
 * Resolved page options delivered to the client bundle via the generated
 * `pageOptions` map. Feeds `openPage()` / `closePage()` helpers so they
 * can apply the correct focus/control behavior.
 */
export interface PageOptions {
    id: string;
    event: string;
    closeEvent: string;
    focus: boolean;
    disableMovement: boolean;
    disableCamera: boolean;
    closeOnEscape: boolean;
}
