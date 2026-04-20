---
label: CLI
icon: terminal
order: 40
---

# CLI reference

The CLI is shipped as `@merinaa/cli`. Two commands:

## `merinaa init <project>`

Or its npm-init alias: `npm init merinaa <project>`.

Scaffolds a new FiveM server project at `./<project>`. Produces the
entire layout described under [Getting started](./getting-started.md).

Placeholders substituted:
- `{{PROJECT_NAME}}` — the folder name
- `{{PROJECT_DESCRIPTION}}` — a default description

## `merinaa module <name>`

Run inside a project. Scaffolds `modules/<name>/` with:

- `module.config.ts` with a pre-wired page declaration
- `server/` (module, service, controller, guard, index)
- `client/` (index, controller)
- `shared/` (types)
- `ui/pages/<Pascal>Page.tsx`

Placeholders:
- `{{MODULE_NAME}}` — lowercase-with-hyphens
- `{{MODULE_PASCAL}}` — PascalCase
- `{{MODULE_CAMEL}}` — camelCase

Follow-up prompt shows the one-line wire-up for `merinaa.config.ts`.

## Typical flow

```bash
npm init merinaa my-server
cd my-server
pnpm install

merinaa module jobs           # scaffolds modules/jobs/
# edit modules/merinaa.config.ts, add: import jobs from './jobs/module.config';
# and push `jobs` into the modules array

pnpm run build
```
