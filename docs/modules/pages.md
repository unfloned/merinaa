---
label: Pages & overlays
icon: browser
order: 90
---

# Pages & overlays

## The mental model

Both pages and overlays are **always-mounted React components**, preloaded
by `createUI()` before the first render. Their visibility is their own
responsibility. The framework wraps them in a Suspense + ErrorBoundary
and calls it a day.

This matters: if you ship a page that doesn't listen for its own
`:open` event, it renders its empty state permanently.

## Pages

A page is a UI piece that gets **focus + the cursor + control locks**
when shown. Think: Bank UI, Inventory, Admin Panel.

Declared in `module.config.ts`:

```ts
ui: {
    pages: [
        {
            id: 'bank',
            event: 'bank:open',
            closeEvent: 'bank:close',   // default: event with ':open'→':close'
            component: 'pages/BankPage',
            focus: true,                 // SetNuiFocus(true, true) on showPage
            disableMovement: true,       // locks WASD / sprint / jump
            disableCamera: true,         // locks mouse look
            closeOnEscape: true,         // Escape triggers hidePage()
        },
    ],
}
```

Opened from the client:

```ts
import { showPage, hidePage } from '@merinaa/client';

showPage('bank', { accountId: 42 });   // dispatches bank:open + applies focus
hidePage();                             // or hidePage('bank') — dispatches bank:close
```

Component:

```tsx
import { useNuiEvent } from '@merinaa/ui/hooks';
import { useState, useCallback } from 'react';

export default function BankPage() {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<any>(null);

    useNuiEvent('bank:open', useCallback((payload) => {
        setData(payload);
        setVisible(true);
    }, []));

    useNuiEvent('bank:close', useCallback(() => setVisible(false), []));

    if (!visible) return null;
    return <div>...</div>;
}
```

## Overlays

An overlay is a UI piece that **does not grab focus** — HUDs,
notification toasts, persistent widgets.

```ts
ui: {
    overlays: [
        { id: 'bank:hud', component: 'overlays/BankHud', alwaysMounted: true },
    ],
}
```

- `alwaysMounted: true` (default) — mount at app start, component
  manages visibility internally
- `alwaysMounted: false` — mount/unmount on `overlay:show:<id>` /
  `overlay:hide:<id>` events

Event-toggled overlays are dispatched from the client:

```ts
showOverlay('bank:hud');   // mounts the overlay
hideOverlay('bank:hud');   // unmounts
```

## Typed showPage

The generator emits `modules/.merinaa/page-ids.ts` with a `PageId`
union of every registered page id. Import it for compile-time
protection against typos:

```ts
import type { PageId } from '@modules/.merinaa/page-ids';
import { showPage } from '@merinaa/client';

const id: PageId = 'bank';   // Error if 'bank' isn't a registered id
showPage(id, { accountId: 42 });
```

## Error isolation

Every page and overlay is wrapped in an `ErrorBoundary`. If a component
throws during render, the error is logged with the page/overlay
identifier and that one component renders `null` — the rest of the UI
keeps working. In dev you want to fix the error; in production it keeps
the server playable.

## Common gotchas

- **Page renders nothing** — you forgot the internal `useNuiEvent`
  listener or its `setVisible(true)` call. Pages are always mounted; no
  event = no render.
- **Double state** — don't listen for the same event twice (once in the
  wrapper, once internally). The framework does not gate mounting, so
  only your component matters.
- **Escape doesn't close** — `closeOnEscape: false` was set, or the page
  has `useState(visible)` that isn't reset on the close event.
