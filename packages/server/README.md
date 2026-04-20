# @merinaa/server

Server-side runtime for the Merinaa FiveM framework. Brings up the
`Application`, wires modules, manages DI, handles config, events, and the
Deepkit ORM database layer.

## Install

```bash
npm install @merinaa/server @merinaa/core reflect-metadata
```

`@citizenfx/server` and `reflect-metadata` are peer dependencies — your
FiveM runtime provides the first, your app the second.

## Quick example

```ts
import 'reflect-metadata';
import {
    createApplicationBuilder,
    Module,
    DatabaseModule,
    loadYamlFromResource,
} from '@merinaa/server';
import { PlayerModule } from './modules/player/server/player.module';

@Module({
    imports: [
        DatabaseModule.forRoot({
            config: { connectionString: GetConvar('mysql_connection_string', '') },
            autoConnect: true,
        }),
        PlayerModule,
    ],
})
class AppModule {}

const config = loadYamlFromResource('framework.config.yaml');

createApplicationBuilder()
    .loadConfig(config)
    .build()
    .start(AppModule);
```

## Subpath exports

```ts
// Runtime
import { Module, ConfigService, DiscordWebhookService } from '@merinaa/server';

// Testing (dev-time, not in runtime bundle)
import { TestBed, installFivemMocks } from '@merinaa/server/testing';
import { DiscordReporter } from '@merinaa/server/testing/reporters';

// Typed framework config
import type { FrameworkConfig } from '@merinaa/server/config';
```

Vitest setup file:

```ts
// vitest.config.ts
export default defineConfig({
    test: { setupFiles: ['@merinaa/server/testing/setup'] },
});
```

## What's inside

- **DI Container** — singleton/transient scopes, provider overrides, factory
  support
- **ModuleLoader** — 2-phase loading: collect entities, connect DB, register
  providers + controllers, fire `@OnReady` hooks
- **ConfigService** — flat dot-path store, YAML loader with `${VAR}` env
  substitution, module-scoped defaults via `@Module({ config })`
- **DiscordWebhookService** — stateless `send/edit/delete` via fetch, no
  bot token, supports message editing for live-updating embeds
- **EventBus + EventRegistry** — framework event wiring with guards,
  interceptors, pipes
- **DatabaseModule** — Deepkit ORM (MySQL/Postgres), `BaseEntity`,
  `BaseUuidEntity`, `BaseRepository`, migrations
- **RPC registry** — typed client↔server calls

## License

MIT
