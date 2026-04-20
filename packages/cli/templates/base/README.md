# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting started

```bash
pnpm install
cp .env.example .env                # fill in MySQL + optional Discord
pnpm run build                      # compiles server + client + UI into resource/
pnpm run docker:up                  # MySQL + FiveM + Adminer
pnpm run docker:logs                # tail the server logs
```

Connect with FiveM: `localhost:30120`
Adminer (DB inspect): http://localhost:8080 — server: `mysql`, user: `fivem`

## Project layout

```
{{PROJECT_NAME}}/
├── src/
│   ├── entry.ts              # Server bootstrap
│   ├── client-entry.ts       # Client bootstrap
│   └── modules/
│       └── hello/            # Example module — scaffold more with:
│                             #   npx merinaa module <name>
├── ui/                       # React NUI (Vite + Tailwind)
├── framework.config.yaml     # Runtime config (YAML + ENV substitution)
├── docker/                   # docker-compose + server.cfg for local dev
├── resource/                 # Build output + fxmanifest.lua (FiveM-facing)
├── scripts/build.js          # esbuild + tspc + vite bundling
└── vitest.config.ts          # Tests with optional Discord live-reporter
```

## Adding a module

```bash
npx merinaa module <module-name>
```

Creates `src/modules/<module-name>/` with server + client + ui + shared
subfolders. The command prints the three import statements to add (to
`src/entry.ts`, `src/client-entry.ts`, `ui/registrations.ts`).

## Development

```bash
pnpm run dev                   # watch: rebuild server + client on change
pnpm run dev:ui                # parallel: Vite HMR for the NUI
pnpm run test:watch            # parallel: Vitest watch mode
pnpm run docker:restart        # restart FiveM after a fresh build
```

## Testing

```bash
pnpm run test                  # one-shot
pnpm run test:watch            # watch mode
```

Set `testing.discord.webhook` in `framework.config.yaml` (or
`DISCORD_TESTING_WEBHOOK` env) to get a live-editing test report embed in
Discord.

## Production

Build once, copy `resource/` into your FiveM server's
`server-data/resources/[framework]/` directory, then `ensure {{PROJECT_NAME}}`
from `server.cfg`.
