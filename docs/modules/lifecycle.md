---
title: Lifecycle hooks
order: 40
---

# Lifecycle hooks

Merinaa classes can declare four lifecycle hooks by implementing one or
more of these interfaces. The framework calls them in a deterministic
order during startup.

| Interface | When |
|---|---|
| `OnModuleInit` | After the DI container instantiates the class and before any `@OnClient` / `@OnServer` handlers are wired |
| `OnApplicationBootstrap` | After every module has finished `onModuleInit` — the full graph is live |
| `OnReady` | After the database is connected and migrations are complete (use for DB seeding) |
| `OnApplicationShutdown` | On resource stop — flush caches, close sockets |

## Order

```
1. DI container instantiates all providers / controllers
2. For every instance: onModuleInit()
3. Event handlers (@OnClient, @OnServer, @On) are wired to the event bus
4. For every instance: onApplicationBootstrap()
5. DatabaseModule connects + runs migrations
6. For every method decorated with @OnReady: the method is invoked
7. Resource stop: for every instance with onApplicationShutdown: the method is invoked
```

## Example

```ts
import { Controller, OnReady } from '@merinaa/core';
import type { OnModuleInit, OnApplicationShutdown } from '@merinaa/core';

@Controller()
export class BankController implements OnModuleInit, OnApplicationShutdown {
    private tickId: number | null = null;

    onModuleInit(): void {
        // DI has wired dependencies but no events are live yet.
        this.loadStaticData();
    }

    @OnReady()
    async seedBankAccounts(): Promise<void> {
        // DB is connected. Safe to query.
        await this.bankService.seedDefaultAccounts();
    }

    onApplicationShutdown(): void {
        if (this.tickId !== null) clearInterval(this.tickId);
    }
}
```

## When to use which

- **Config-only work** (read `ConfigService`, cache a setting):
  `onModuleInit`.
- **Cross-module coordination** (need another module's service to exist):
  `onApplicationBootstrap`.
- **Database-dependent setup** (seed rows, backfill data):
  `@OnReady()`.
- **Cleanup** (stop timers, close sockets): `onApplicationShutdown`.

## `@OnReady` vs lifecycle interfaces

`@OnReady()` is a method decorator, not a class interface. It lets you
pick which specific method runs when the DB is ready — useful when a
controller has multiple startup responsibilities and you want them at
different phases.

```ts
@Controller()
export class WorldController {
    onModuleInit() { /* static setup */ }

    @OnReady()
    async loadDynamicData() { /* DB query */ }
}
```
