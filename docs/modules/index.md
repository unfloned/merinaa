---
label: Modules
icon: file-code
order: 70
---

# Authoring a module

```bash
merinaa module bank
```

Creates `modules/bank/` with a ready-to-go shape. Open
`modules/merinaa.config.ts`, import the module and add it to the array
— that's it.

## Folder convention

```
modules/bank/
├── module.config.ts     manifest (metadata, pages, overlays)
├── server/
│   ├── index.ts         default-exports the @Module class
│   ├── bank.module.ts   @Module
│   ├── bank.controller.ts @Controller
│   ├── bank.service.ts  @Injectable
│   ├── bank.guard.ts    @Guard (optional)
│   └── entities/        @entity classes for the ORM
├── client/
│   ├── index.ts         side-effect entry
│   └── bank.client.ts   decorator-based client controller
├── shared/              types used by both server and client
└── ui/
    ├── pages/           page components (one per registered page)
    ├── overlays/        overlay components
    └── components/      module-local reusable React bits
```

## Server side

```ts
// bank.service.ts
import { Injectable, LoggerService } from '@merinaa/core';

@Injectable()
export class BankService {
    constructor(private logger: LoggerService) {}

    deposit(accountId: number, amount: number): void {
        this.logger.info(`[Bank] +$${amount} to ${accountId}`);
    }
}

// bank.controller.ts
import { Controller, OnClient, UseGuards } from '@merinaa/core';
import { BankService } from './bank.service';
import { BankGuard } from './bank.guard';

@Controller()
@UseGuards(BankGuard)
export class BankController {
    constructor(private bank: BankService) {}

    @OnClient('bank:deposit')
    deposit(src: number, accountId: number, amount: number): void {
        this.bank.deposit(accountId, amount);
    }
}

// bank.module.ts
@Module({
    providers: [BankService, BankController, BankGuard],
    exports: [BankService],
})
export class BankModule {}

// index.ts
export { BankModule as default } from './bank.module';
```

## Client side

```ts
// client/bank.client.ts
import { showPage, hidePage } from '@merinaa/client';

RegisterCommand('bank', () => {
    showPage('bank', { accountId: 42 });
}, false);
```

`showPage('bank', data)` handles all of the following for you:

- `SetNuiFocus(true, true)` (per the `focus` flag in module.config)
- Starts a `DisableControlAction` tick loop for movement/camera
- Binds Escape to `hidePage()` (per `closeOnEscape`)
- Dispatches `{ type: 'bank:open', accountId: 42 }` over NUI

## UI side

Pages are **always mounted** — preloaded by `createUI()` before the
first render. The component manages its own visibility via its internal
`useNuiEvent` subscriptions. This is important: a page that uses
`useState(false)` and only flips to `true` inside `useNuiEvent('bank:open', ...)`
will render nothing until the event fires.

```tsx
// ui/pages/BankPage.tsx
import { useNuiEvent } from '@merinaa/ui/hooks';
import { useState, useCallback } from 'react';

export default function BankPage() {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<any>(null);

    useNuiEvent('bank:open', useCallback((payload) => {
        setData(payload);
        setVisible(true);
    }, []));

    useNuiEvent('bank:close', useCallback(() => {
        setVisible(false);
    }, []));

    if (!visible) return null;

    return <div>...</div>;
}
```

## Overlays

Overlays live in `ui/overlays/` and are registered under
`ui.overlays` in `module.config.ts`.

- `alwaysMounted: true` (default) — component mounts at app start, manages
  visibility internally. Use this for HUDs, persistent widgets, death
  screens.
- `alwaysMounted: false` — component mounts/unmounts on
  `overlay:show:<id>` / `overlay:hide:<id>` events dispatched by
  `showOverlay(id)` / `hideOverlay(id)` on the client.

## Where to next

- [Pages & overlays in detail](./pages.md)
- [Security](../security.md) — guards, rate limiting
- [Database & migrations](./database.md)
- [Lifecycle hooks](./lifecycle.md)
