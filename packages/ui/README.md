# @merinaa/ui

React-based NUI framework for Merinaa. Ships a page registry, NUI bridge
hooks, and reusable components so every Merinaa project gets a consistent
UI layer.

## Install

```bash
npm install @merinaa/ui react react-dom
```

Peer dependencies: `react ^18 || ^19`, `react-dom ^18 || ^19`.

## Quick example

```tsx
// ui/main.tsx
import 'reflect-metadata';
import { createUI } from '@merinaa/ui';

import './styles.css';
import './registrations';   // side-effect imports that call registerPage(...)

createUI().mount('#root');
```

```ts
// src/modules/hello/ui/index.ts
import { registerPage } from '@merinaa/ui';
import { HelloPage } from './HelloPage';

registerPage('hello:open', HelloPage, {
    name: 'Hello',
    closeEvent: 'hello:close',
});
```

```tsx
// src/modules/hello/ui/HelloPage.tsx
export function HelloPage({ message }: { message?: string }) {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="rounded-lg bg-slate-900/90 p-6 text-white">
                <h2>{message ?? 'Hello!'}</h2>
            </div>
        </div>
    );
}
```

## API

- **`createUI(options?)`** — creates a UI app, mounts with `.mount(selector)`.
  Accepts a `pages` array or relies on side-effect `registerPage` imports.
- **`registerPage(event, Component, { name?, closeEvent? })`** — registers a
  page that renders when the matching NUI event (`SendNuiMessage({ type })`)
  arrives. Props from the payload flow into the component.
- **`usePageRegistry()`** — Zustand hook with the live page map.
- **`useNui(event, handler)`** — subscribe to any NUI event in a component.
- **`<DynamicPages />`** — renders whichever page is currently active.

## License

MIT
