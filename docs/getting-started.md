---
label: Getting started
icon: rocket
order: 90
---

# Getting started

## Prerequisites

- **Node.js ≥ 22** (FiveM's Cerulean runtime)
- **pnpm** (recommended; npm/yarn work too)
- **Docker** (for the MySQL + FiveM + Adminer compose stack)

## Scaffold a new project

```bash
npm init merinaa my-server
cd my-server
pnpm install
```

The `postinstall` hook runs `npx deepkit-type-install` for you — Deepkit's
TypeScript transformer needs to be injected before the first compile.

What you got:

```
my-server/
├── docker/                    MySQL + FiveM + Adminer compose
├── framework.config.yaml      runtime config (ENV-substituted at boot)
├── modules/
│   ├── merinaa.config.ts      app manifest
│   ├── config.ts              getDatabaseConfig / getEnvironment helpers
│   ├── tsconfig.{json,client.json}
│   ├── global.d.ts
│   └── hello/                 example module
│       ├── module.config.ts
│       ├── server/ (module, service, controller, guard, index)
│       ├── client/ (index, hello.client.ts)
│       └── ui/pages/HelloPage.tsx
├── resource/                  FiveM resource output (built)
│   └── fxmanifest.lua
├── scripts/
│   ├── build.js               generator → tsc → esbuild pipeline
│   └── generate-module-registry.js
├── ui/
│   ├── index.html
│   ├── main.tsx               imports @modules/.merinaa/ui
│   └── styles.css
├── package.json
├── tsconfig.base.json
├── vite.config.mts            @modules/* alias
└── vitest.config.ts
```

## First build

```bash
pnpm run build
```

That runs:

1. `scripts/generate-module-registry.js` — reads your manifests, writes
   `modules/.merinaa/{server,client,ui}.ts`
2. `tspc` — compiles TypeScript with the Deepkit reflection transformer
3. `esbuild` — bundles server + client
4. `vite build` — bundles NUI

Output lands in `resource/`.

## Run it

```bash
cp .env.example .env        # MySQL credentials live here
pnpm run docker:up          # MySQL + FiveM
pnpm run docker:logs        # tail the server
```

Connect in FiveM to `localhost:30120` and type `/hello` in chat — you
should see the hello page with focus, movement and camera locked.

## Dev loop

```bash
pnpm run dev
```

Watches `merinaa.config.ts` + every `module.config.ts` and re-runs the
generator automatically. For UI hot-reload, open a second terminal:

```bash
pnpm run dev:ui
```

## Next

- [Authoring a module](./modules/index.md) — services, controllers, pages
- [Architecture](./architecture.md) — how the generator splits the bundles
