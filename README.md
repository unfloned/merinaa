# Merinaa

[![npm](https://img.shields.io/npm/v/@merinaa/core.svg?label=%40merinaa%2Fcore&color=0ea5e9)](https://www.npmjs.com/package/@merinaa/core)
[![license](https://img.shields.io/github/license/unfloned/merinaa.svg?color=green)](./LICENSE)
[![tests](https://img.shields.io/badge/tests-79%20passing-brightgreen)](./packages/server/src)
[![docs](https://img.shields.io/badge/docs-merinaa.dev-0ea5e9)](https://merinaa.dev)
[![discord](https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/pbXw4acstw)

> A full-TypeScript framework for FiveM servers. DI, decorators, ORM, lazy React NUI — scaffolded with one command.

## Quick start

```bash
npm init merinaa my-server
cd my-server
pnpm install
pnpm run docker:up
```

Connect with FiveM at `localhost:30120`. Full walkthrough in the [**Getting Started**](https://merinaa.dev/getting-started/) guide.

## Features

- **Dependency injection** (Deepkit) — `@Module`, `@Controller`, `@Injectable`, scoped providers
- **Decorator-based events** — `@OnClient`, `@OnServer`, `@Cron`, `@Guard`, `@Interceptor`, `@Pipe`
- **Deepkit ORM + migrations** — type-driven entities, MySQL + Postgres
- **Lazy-loaded React NUI** — page/overlay registry, auto-focus, automatic movement/camera lock
- **YAML config + ENV substitution** — `framework.config.yaml` with `${DISCORD_WEBHOOK}` refs
- **Generator-based modules** — edit `module.config.ts`, get three bundle entries for free
- **Vitest + live Discord reports** — test results stream into your channel as they run
- **CLI scaffolding** — `merinaa init <name>` and `merinaa module <name>`

## Packages

| Package | Description |
|---|---|
| [`@merinaa/core`](./packages/core) | Decorators, DI primitives, metadata keys, module + app manifests |
| [`@merinaa/server`](./packages/server) | Application bootstrap, ORM, events, RPC, guards, interceptors, pipes |
| [`@merinaa/client`](./packages/client) | `bootstrapClient`, `showPage`/`hidePage`/`showOverlay`/`hideOverlay`, NUI bridge |
| [`@merinaa/ui`](./packages/ui) | React NUI shell, hooks, components, page/overlay registry |
| [`@merinaa/cli`](./packages/cli) | `merinaa init` and `merinaa module` |

## Requirements

- Node.js ≥ 22 (FiveM's Cerulean runtime)
- pnpm (recommended)
- Docker (local MySQL + FiveM container)

## Community

- **Docs:** [merinaa.dev](https://merinaa.dev)
- **Discord:** [join the server](https://discord.gg/pbXw4acstw)
- **Issues / Discussions:** [github.com/unfloned/merinaa](https://github.com/unfloned/merinaa/issues)

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Security issues: see [`SECURITY.md`](./SECURITY.md).

## License

MIT — see [LICENSE](./LICENSE).
