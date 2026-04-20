---
label: Home
icon: home
order: 100
description: A modular TypeScript framework for FiveM servers
---

# Merinaa

A modular TypeScript framework for FiveM servers: Deepkit DI, decorator-
based controllers, YAML config with ENV substitution, Deepkit ORM +
migrations, a lazy-loaded React NUI with a page / overlay registry,
Vitest with live Discord reports, and a CLI that scaffolds the whole
thing in one command.

## Quick start

```bash
npm init merinaa my-server
cd my-server
pnpm install
cp .env.example .env
pnpm run build
pnpm run docker:up
```

Connect with FiveM: `localhost:30120`.

## Why

- **One consumer surface, three bundles.** You edit `merinaa.config.ts`
  + per-module `module.config.ts`. The generator produces server,
  client and UI entry points — you never hand-wire bundle entries.
- **Decorators over config files.** `@Module`, `@Controller`,
  `@OnClient`, `@OnServer`, `@Cron`, `@Guard`, `@Interceptor`, `@Pipe`
  cover the whole server lifecycle.
- **Lazy-loaded React NUI.** Each page is a separate chunk. Preloaded
  inside `createUI()` before the first render — no missed events.
- **Automatic focus management.** `showPage('bank', data)` applies the
  declared options (`SetNuiFocus`, the `DisableControlAction` loop for
  movement/camera, Escape-to-close) automatically.
- **Vitest with live Discord reports.** Point `testing.discord.webhook`
  at a channel and every test run edits a single embed as results come
  in.

## Where to next

- [Getting started](./getting-started.md) — install + `hello` module walkthrough
- [Architecture](./architecture.md) — manifests, generator, bundle layout
- [Module authoring](./modules/index.md) — services, controllers, pages,
  overlays, the `showPage` API
- [Security](./security.md) — guards, rate limiting, input validation
- [Plugins & overrides](./plugins.md) — ship reusable modules
- [CLI reference](./cli.md) — `merinaa init`, `merinaa module`
- [Changelog](./changelog.md)
