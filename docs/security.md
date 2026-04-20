---
title: Security
order: 50
---

# Security

FiveM is a hostile environment — every `@OnClient` event handler is a
public HTTP endpoint in all but name. Merinaa ships three building blocks
you should know about.

## Guards — authorization

Guards are classes that implement `canActivate(context)` and return
`boolean`. Attached via `@UseGuards(SomeGuard)` on a controller or a
specific handler, they run before the handler. Return `false` and the
handler is skipped silently.

```ts
import { Injectable } from '@merinaa/core';
import type { Guard, ExecutionContext } from '@merinaa/core';
import { PermissionService } from '@merinaa/server';

@Injectable()
export class AdminGuard implements Guard {
    constructor(private perms: PermissionService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        return this.perms.has(context.source, 'admin:use');
    }
}

@Controller()
export class AdminController {
    @OnClient('admin:kick')
    @UseGuards(AdminGuard)
    kick(src: number, targetId: number) {
        DropPlayer(targetId.toString(), 'You were kicked');
    }
}
```

## Rate limiting

`RateLimitService` is a built-in token-bucket limiter. Configure it in
`framework.config.yaml` (or `app.framework.rateLimit` in merinaa.config.ts)
— if any `rateLimit.*` key is set, `bootstrapServer()` automatically
registers the global `RateLimitGuard`.

```yaml
# framework.config.yaml
rateLimit:
    windowMs: 1000          # default window
    max: 20                 # default max calls per window per source
    events:
        bank:deposit:
            windowMs: 5000
            max: 3          # tighter — real money flow
        admin:kick:
            windowMs: 1000
            max: 1
```

Throttled calls are logged at warn level and silently rejected — no
error propagates to the client.

## Input validation

Merinaa doesn't validate `@OnClient` arguments for you. The client can
send anything. Two defensive patterns:

**1. Pipes** — for transforming + validating arguments:

```ts
@OnClient('bank:deposit')
deposit(
    src: number,
    @Body(new ValidationPipe({ min: 1, max: 100_000 })) amount: number,
) {
    // amount is guaranteed to be 1..100_000 here
}
```

**2. Deepkit runtime types** — combined with Deepkit's type-compiler,
you can validate full object shapes:

```ts
interface DepositRequest {
    accountId: string & MinLength<1>;
    amount: number & Positive & Maximum<100_000>;
}

@OnClient('bank:deposit')
deposit(src: number, request: DepositRequest) {
    // Deepkit + ValidationPipe rejects malformed requests
}
```

## Common pitfalls

- **Trusting the source of truth** — `@Source() src` is the only thing
  you can trust from a client call. Don't accept a player id as a
  parameter and skip authorization.
- **Admin commands registered via `RegisterCommand`** run in the FiveM
  command dispatcher, not via `@OnClient` — they bypass guards. If you
  register an admin command client-side, verify admin status on the
  server via net-events, not just in the command body.
- **NUI callbacks** (`RegisterNuiCallbackType`) also run outside the
  `@OnClient` flow and bypass guards. If your UI has a "make me admin"
  button, authorize on the server.
