# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] — 2026-11-08

### Fixed

- Client: each event gets a single native listener, so repeated registrations no longer trigger the FiveM "possible EventEmitter memory leak" warning. NUI callbacks are replaced instead of stacked, controllers and the spawn handler register once

### Added

- Client: `listen(kind, event, handler)` returns an unsubscribe function and warns with the event name when more than 10 handlers pile up on one event; `listenerCount()` for diagnostics

## [0.4.1] — 2026-11-04

### Fixed

- Published packages ship Deepkit reflection again (0.3.0 and 0.4.0 were built without it because the CI cache skipped the type-compiler install script)

## [0.4.0] — 2026-11-04

Toolchain update. Consumers need TypeScript 6 and Tailwind 4.

### Changed

- Deepkit 1.1.0 across `@merinaa/server` and the template
- TypeScript 6 with ts-patch 4; `module` / `moduleResolution` now `node16`, `baseUrl` dropped
- `@merinaa/ui` classes use Tailwind 4 names; consumers scan it via `@source` instead of `content`
- Vitest 5, Vite 8, React 19 (peer range still allows React 18), ESLint 10, esbuild 0.28
- Template: `vite.config.mts` and `postcss.config.mjs`, Tailwind 4 via `@tailwindcss/postcss`

### Fixed

- Smoke test now builds the scaffolded project including the UI and works with pnpm 11+

## [0.3.0] — 2026-04-19

Major architectural shift: the whole consumer surface collapses into two
file types (`merinaa.config.ts` + `module.config.ts`). Hand-written server,
client and UI entry points are gone — the pre-build generator produces
them. All five packages move to a unified `0.3.0` version.

### Added

**`@merinaa/core`**
- `defineApp(config)` + `defineModule(config)` — identity helpers with
  TypeScript inference for the new app / module manifests
- `AppConfig`, `ModuleManifest`, `PageDef`, `OverlayDef`, `PageOptions`,
  `AppDatabaseConfig` interfaces
- `resolvePageCloseEvent(event, explicit?)` helper (mirrors generator logic)
- `ModuleManifest.hasServer` now accepts `'side-effect'` for standalone
  modules that have no `@Module` class (top-level `RegisterCommand` etc.)
- `PageDef` gains optional `id` field; defaults to `event` with `:open`
  stripped, so `showPage('bank')` resolves `bank:open`

**`@merinaa/server`**
- `bootstrapServer({ modules, app, databaseConfig?, yamlConfig?, extraConfig? })`
  — builds the dynamic `@Module`-decorated `AppModule` with
  `DatabaseModule.forRoot(...)` + feature modules from the generator and
  starts the app. Called from generated `.merinaa/server.ts`.

**`@merinaa/client`**
- `bootstrapClient({ pageOptions })` seeds the framework's page-options
  map. Called from generated `.merinaa/client.ts`.
- `showPage(id, data?)` / `hidePage(id?)` — open/close a registered page
  by id or event name. Applies `SetNuiFocus`, starts the
  `DisableControlAction` loop for movement/camera, binds Escape to
  `hidePage()` when `closeOnEscape: true`.
- `showOverlay(id)` / `hideOverlay(id)` — toggle event-driven overlays.
- `openPage` / `closePage` kept as deprecated aliases.

**`@merinaa/ui`**
- `createUI({ modules })` accepts a `ModuleUIRegistry` produced by the
  generator. Preloads all lazy component chunks before the first render
  so `useNuiEvent` listeners are active by the time the client dispatches
  any event (fixes the "first event is lost" race).
- Pages and overlays are always-mounted from app start; their visibility
  is self-managed via internal `useNuiEvent` subscriptions.
- `registerOverlay(id, load, { alwaysMounted? })` + `DynamicOverlays`
  render alongside `DynamicPages`. Event-toggled overlays (i.e.
  `alwaysMounted: false`) respond to `overlay:show:<id>` /
  `overlay:hide:<id>` dispatched by `showOverlay` / `hideOverlay`.
- `ErrorBoundary` wraps every page + overlay slot. A crash in one
  module's UI is logged and contained — the rest keeps rendering.
- Subpath exports published:
  - `@merinaa/ui/hooks` — `useNuiEvent`, `useNuiVisibility`, `fetchNui`,
    `useNuiCallback`, `useKeyPress`, `useNuiSetup`
  - `@merinaa/ui/components` — `SidePanel`, `HUDOverlay`, `Hints`,
    `Notifications`, `SkillsPanel`
  - `@merinaa/ui/stores` — `useNuiStore` + typed state interfaces
  - `@merinaa/ui/utils` — item-icon helpers
- `src/pages/` (the ~40 Everlast-specific demo pages that shipped in
  0.1.0) is gone. Consumers own their pages under `modules/<name>/ui/`.

**`@merinaa/cli`**
- Templates fully rewritten for the new architecture.
- `templates/base/`:
  - `modules/merinaa.config.ts`, `modules/config.ts` helpers
  - Example `modules/hello/` with `module.config.ts` + server + client
    + lazy UI page using `showPage()`
  - `modules/tsconfig.{json,client.json}` and `modules/global.d.ts`
  - `scripts/build.js` — generator → tsc → esbuild pipeline, watch
    mode re-runs the generator on config changes via chokidar
  - `scripts/generate-module-registry.js` — validates unique page ids,
    checks component file existence, emits `PageId` typed union
  - Root-level `vite.config.ts` with `@modules/*` alias, `ui/main.tsx`
    just imports `@modules/.merinaa/ui`, `tailwind.config.js` scans
    `modules/**/ui/`
- `templates/module/` — every scaffold includes `module.config.ts`,
  `server/index.ts` with default export, and `ui/pages/<Pascal>Page.tsx`
  using `useNuiEvent` with a `showPage`-compatible shape.
- `merinaa module <name>` now scaffolds to `modules/<name>/` (was
  `src/modules/<name>/`) and prints the one-line follow-up
  ("add it to merinaa.config.ts"), not a three-step rewire.

### Changed

- All packages move to unified `0.3.0`. The loose `0.2.x` patch versions
  that accumulated during development (core 0.2.2, client 0.2.1, ui
  0.2.3, cli 0.2.0) are superseded.
- `@merinaa/ui` is now a pure framework shell. Concrete pages are a
  consumer responsibility.

### Removed

- `@merinaa/ui/src/pages/` — all 40 Everlast-specific example pages
- `@merinaa/ui/src/components/{phone,admin,character,gamedesigner,hud}/`
  — demo components that belonged to a downstream consumer
- `@merinaa/ui/src/data/` — demo data

### Migration

Coming from `0.1.x`:

1. Replace `src/entry.ts` with `modules/merinaa.config.ts` (use
   `defineApp` from `@merinaa/core`).
2. For each module, add `modules/<name>/module.config.ts` via
   `defineModule`. Move the `@Module`-decorated class to
   `server/index.ts` as the default export.
3. Replace hand-written `src/client-entry.ts` side-effect import list
   with an empty file — the generator handles it.
4. Replace the manual `ui/registrations.ts` with module manifests
   declaring pages/overlays; move page components from
   `src/modules/<name>/ui/` to `modules/<name>/ui/pages/`.
5. Replace `SetNuiFocus(true, true); SendNUIMessage({ type: 'x:open', ... })`
   call sites with `showPage('x', { ... })` on the client.
6. Drop `scripts/build.js` in favour of the new one from the
   0.3.0 template (or `pnpm add -D chokidar` and port the extra
   generator step manually).

## [0.1.0] — 2026-04-15

Initial public release. Framework is stable enough for greenfield FiveM
server projects.

### Added

**`@merinaa/core`**
- `@Module`, `@Controller`, `@Injectable`, `@OnClient`, `@OnServer`, `@On`, `@OnReady`
- `@Guard`, `@Interceptor`, `@Pipe` decorators
- `@Source`, `@Body`, `@Param` parameter decorators
- `@RpcController` + `@RpcAction` for typed RPC
- Lifecycle hooks: `OnModuleInit`, `OnModuleDestroy`, `OnApplicationBootstrap`

**`@merinaa/server`**
- `Application` + `ApplicationBuilder` with `.loadConfig()` / `.configure()`
- `ModuleLoader` with 2-phase loading
- `Container` — DI with singleton/transient scopes, provider overrides
- `ConfigService` — flat dot-path store with `load/merge/getSection`, YAML loader, ENV substitution
- `DiscordWebhookService` — stateless send/edit/delete via fetch
- `EventBus` + `EventRegistry` — framework event wiring
- `DatabaseModule` with Deepkit ORM, `BaseEntity`/`BaseUuidEntity`, `BaseRepository`
- RPC registry for client↔server typed calls
- Subpath exports: `./testing`, `./testing/reporters`, `./testing/setup`, `./config`
- Added in `0.2.x`: `@Cron` + `CronService`, `PermissionService`, `BaseStringPKEntity`

**`@merinaa/server/testing`**
- `TestBed`, FiveM mocks, Vitest `DiscordReporter`

**`@merinaa/client`**
- `ClientApplication`, NUI bridge, typed RPC client
- Player-local service, notification service

**`@merinaa/ui`**
- `createUI`, `registerPage`, `useNui`, `DynamicPages`

**`@merinaa/cli`**
- `merinaa init <project>` + `merinaa module <name>`
- `create-merinaa` alias for `npm init merinaa`

[0.3.0]: https://github.com/unfloned/merinaa/releases/tag/v0.3.0
[0.1.0]: https://github.com/unfloned/merinaa/releases/tag/v0.1.0
