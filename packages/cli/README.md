# @merinaa/cli

Scaffolding CLI for the Merinaa FiveM framework.

## Install

You don't install this package directly — use it via `npm init` or `npx`:

```bash
npm init merinaa my-server            # preferred
# or
npx @merinaa/cli init my-server
```

## Commands

### `merinaaa init <project-name>`

Creates a new FiveM server project with the full Merinaa stack:

- `package.json` with `@merinaa/*` deps pre-wired
- `tsconfig.json` (decorators + reflection + DOM lib)
- `fxmanifest.lua` (inside `resource/`)
- `framework.config.yaml` (YAML with ENV substitution)
- `vitest.config.ts` with the Discord reporter
- `docker/docker-compose.yml` (MySQL + FiveM + Adminer) + `server.cfg`
- `scripts/build.js` (tspc + esbuild + vite)
- `src/entry.ts` + `src/client-entry.ts`
- Working `hello` module as a cargo-cult template (server + client + UI)
- React NUI boilerplate: `ui/index.html`, `main.tsx`, Tailwind + PostCSS

Aborts cleanly if the target folder exists and isn't empty.

### `merinaaa module <module-name>`

Scaffolds a new module under `src/modules/<module-name>/`:

- `server/` — module, controller, service, entities folder
- `client/` — index + controller
- `ui/` — page registration + React component
- `shared/types.ts` — type contract between sides

Placeholders (`{{MODULE_NAME}}`, `{{MODULE_PASCAL}}`, `{{MODULE_CAMEL}}`)
are substituted in file contents and filenames. The command prints the
three import statements you need to add afterwards.

## License

MIT
