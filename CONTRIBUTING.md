# Contributing to Merinaa

Thanks for your interest in improving Merinaa. This document covers the
local dev loop, the conventions we follow, and how to get a change merged.

## Getting started

```bash
git clone https://github.com/unfloned/merinaa.git
cd merinaa
pnpm install
pnpm run build
pnpm test
```

All 73+ tests should pass on a clean checkout. If they don't, open an
issue — we want to know.

## Repo layout

```
packages/
├── core/      decorators, types, interfaces (no runtime deps beyond reflect-metadata)
├── server/    Application, DI container, EventBus, Database, RPC, services
├── client/    ClientApplication, NUI bridge, showPage/hidePage
├── ui/        React NUI shell (page + overlay registries)
└── cli/       init + module scaffolding, project + module templates
```

Each package is a pnpm workspace with its own `tsconfig.json`, `package.json`
and a `build` script (`tspc` for the TS packages, `vite build` for `ui`).

## Making changes

1. **Open an issue first for anything larger than a fix.** Tag `rfc` for
   design discussions.
2. **Work off `main`** — feature branches are optional, we squash-merge.
3. **Test locally** — `pnpm test` runs vitest across the monorepo.
4. **Typecheck** — `pnpm run typecheck`.
5. **Keep the public API tight.** Adding a new export to `@merinaa/core`
   or `@merinaa/server` is a semver-significant change. If unsure, ask in
   the PR.
6. **Changelog entry** — if your change affects any published package,
   add an entry under the *Unreleased* section of `CHANGELOG.md`. We
   cut releases from there.

## Testing changes against a real project

The fastest feedback loop is to pack the tarballs and install them into
a test FiveM project:

```bash
# In merinaa/
pnpm run build
for pkg in core server client ui cli; do
    (cd packages/$pkg && npm pack --pack-destination ../../.tarballs)
done

# In your test project
pnpm install \
    file:../merinaa/.tarballs/merinaa-core-<ver>.tgz \
    file:../merinaa/.tarballs/merinaa-server-<ver>.tgz \
    ...
```

## Commit messages

Use [conventional commits](https://www.conventionalcommits.org/):

```
feat(server): ...
fix(ui): ...
docs(cli): ...
chore: ...
refactor(core): ...
```

## Publishing (maintainers only)

1. Bump all package versions (they move in lockstep).
2. Update `CHANGELOG.md` — move everything under *Unreleased* into a new
   dated section.
3. `pnpm run build && pnpm test`.
4. `pnpm -r publish --access public`.
5. Tag + push: `git tag v$VER && git push --tags`.

## Code style

- Match the surrounding code. We use 4-space indentation across TS/TSX
  files, single quotes, trailing commas, semicolons.
- Don't write redundant comments — we trust readers to read code. Reserve
  comments for non-obvious decisions ("why", not "what").
- Public APIs get a JSDoc block. Internal helpers usually don't.
- Avoid premature abstractions. Duplication is cheaper than the wrong
  shared dependency.

## License

By contributing you agree that your contributions will be licensed under
the MIT license of this project.
