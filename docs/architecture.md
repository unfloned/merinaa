---
title: Architecture
order: 20
---

# Architecture

## The big picture

FiveM needs three separate bundles:

- `resource/server/server.js` — runs in the server Node.js runtime
- `resource/client/client.js` — runs on every connected client
- `resource/ui/` — the NUI (React, shipped to Chromium)

Merinaa turns a pair of manifests into those bundles:

```
modules/merinaa.config.ts          app manifest — lists modules
modules/<name>/module.config.ts    module manifest — metadata, page/overlay declarations
                │
                │ pre-build generator (scripts/generate-module-registry.js)
                ▼
modules/.merinaa/server.ts         esbuild entry → resource/server/server.js
modules/.merinaa/client.ts         esbuild entry → resource/client/client.js
modules/.merinaa/ui.ts             vite entry     → resource/ui/
```

Each generated file references **only its bundler's surface**. The
server bundle never sees TSX. The UI bundle never sees Deepkit.

## App manifest

```ts
// modules/merinaa.config.ts
import { defineApp } from '@merinaa/core';
import { getDatabaseConfig } from './config';

import bank from './bank/module.config';
import character from './character/module.config';

export default defineApp({
    name: 'my-server',
    database: getDatabaseConfig(),
    modules: [bank, character],

    framework: {
        rateLimit: {
            windowMs: 1000,
            max: 20,
        },
    },
});
```

## Module manifest

```ts
// modules/bank/module.config.ts
import { defineModule } from '@merinaa/core';

export default defineModule({
    name: 'bank',
    hasServer: true,        // default-exports @Module class from server/index.ts
    hasClient: true,        // side-effect imports client/index.ts

    ui: {
        pages: [
            {
                id: 'bank',
                event: 'bank:open',
                closeEvent: 'bank:close',
                component: 'pages/BankPage',
                focus: true,
                disableMovement: true,
                disableCamera: true,
                closeOnEscape: true,
            },
        ],
        overlays: [
            {
                id: 'bank:hud',
                component: 'overlays/BankHud',
                alwaysMounted: true,
            },
        ],
    },
});
```

## hasServer variants

| Value | Meaning |
|---|---|
| `true` (default when `server/index.ts` exists) | Default-imports the `@Module`-decorated class and hands it to Deepkit DI |
| `'side-effect'` | Bare `import '@modules/<name>/server'` for modules that have no class (top-level `RegisterCommand` etc.) |
| `false` | Skip on server entirely |

## Generator validation

On every build the generator checks:

- Unique module names
- Unique page ids (`id` either explicit or derived from event)
- Unique page events
- Unique overlay ids
- Every `component` path resolves to a real `.tsx` / `.ts` / `index.tsx` file
- `dependsOn` references resolve and have no cycles

A clear error with the module name is thrown if any check fails.

## Generated files

Produced into `modules/.merinaa/` (gitignored):

- `server.ts` — `import 'reflect-metadata'; bootstrapServer({ modules: [...], app, ... });`
- `client.ts` — side-effect imports + `bootstrapClient({ pageOptions })`
- `ui.ts` — `createUI({ modules: { bank: { pages: [...], overlays: [...] } } }).mount('#root');`
- `page-ids.ts` — typed `PageId` union for compile-time autocomplete on `showPage()`

## Build pipeline

`scripts/build.js`:

1. Run the generator
2. Clean `modules/dist/`
3. `tspc -p modules/tsconfig.json` (server compile with Deepkit reflection)
4. `tspc -p modules/tsconfig.client.json` (client compile)
5. `esbuild` bundles both
6. Copy `framework.config.yaml` + emit `version.json`

Watch mode (`pnpm run dev`) also watches `merinaa.config.ts` + every
`*/module.config.ts` via chokidar and re-runs the generator on change.
