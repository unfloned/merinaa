# @merinaa/client

Client-side runtime for the Merinaa FiveM framework. Provides
`ClientApplication` for registering decorator-based controllers, an NUI
bridge, typed RPC client, and FiveM native helpers.

## Install

```bash
npm install @merinaa/client @merinaa/core reflect-metadata
```

Peer dependencies: `@citizenfx/client`, `reflect-metadata`.

## Quick example

```ts
// src/client-entry.ts
import 'reflect-metadata';
import { ClientApplication } from '@merinaa/client';

import './modules/hello/client';   // side-effect registers controllers

ClientApplication.getInstance().start();
```

```ts
// src/modules/hello/client/hello.client.ts
import { Controller, OnServer } from '@merinaa/core';

@Controller()
export class HelloClientController {
    @OnServer('hello:greeted')
    onGreeted(message: string): void {
        console.log('[Hello]', message);
        SendNuiMessage(JSON.stringify({ type: 'hello:open', message }));
    }
}

// src/modules/hello/client/index.ts
import { ClientApplication } from '@merinaa/client';
import { HelloClientController } from './hello.client';
ClientApplication.getInstance().registerController(HelloClientController);
```

## What's inside

- `ClientApplication` — singleton, registers controllers + tick handlers
- `createClient` — declarative module loader for multi-module setups
- `NuiBridge` — typed NUI messaging
- `rpcClient` — typed RPC calls to the server (`rpcClient.controller<T>(...)`)
- `notification.service`, `player-local.service` — built-in helpers
- Native re-exports and streaming utilities

## License

MIT
