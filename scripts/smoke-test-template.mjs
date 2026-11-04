#!/usr/bin/env node
/**
 * Smoke-test: scaffold the CLI template into a tmp dir and verify it
 * builds cleanly using locally packed tarballs.
 *
 *   1. Build every package
 *   2. Pack each into .tarballs/
 *   3. Run the CLI init command into a tmp dir
 *   4. Rewrite the tmp project's package.json to use file: tarballs
 *   5. pnpm install + pnpm run generate + pnpm run typecheck
 *
 * Fails with exit code 1 on any problem. Run from the merinaa repo root.
 */
import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tarballsDir = join(rootDir, '.tarballs');
const packages = ['core', 'server', 'client', 'ui', 'cli'];

function run(cmd, opts = {}) {
    console.log(`$ ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: rootDir, ...opts });
}

// 1. Build all packages
run('pnpm -r build');

// 2. Pack each into .tarballs/
mkdirSync(tarballsDir, { recursive: true });
for (const pkg of packages) {
    const res = spawnSync('pnpm', ['pack', '--pack-destination', tarballsDir], {
        cwd: join(rootDir, 'packages', pkg),
        encoding: 'utf8',
        shell: process.platform === 'win32',
    });
    if (res.status !== 0) throw new Error(`pnpm pack failed for ${pkg}: ${res.stderr}`);
}

function latestTarball(pkg) {
    const prefix = `merinaa-${pkg}-`;
    const hits = readdirSync(tarballsDir).filter((f) => f.startsWith(prefix) && f.endsWith('.tgz'));
    if (hits.length === 0) throw new Error(`No tarball for ${pkg}`);
    return hits.sort().at(-1);
}

// 3. Scaffold the template into a tmp dir via direct template copy
const tmpRoot = mkdtempSync(join(tmpdir(), 'merinaa-smoke-'));
const projectDir = join(tmpRoot, 'smoke-test');
const templateDir = join(rootDir, 'packages', 'cli', 'templates', 'base');

function copyTemplate(src, dst) {
    mkdirSync(dst, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        let name = entry.name;
        if (name === '_env.example') name = '.env.example';
        else if (name === '_gitignore') name = '.gitignore';

        const sPath = join(src, entry.name);
        const dPath = join(dst, name);
        if (entry.isDirectory()) copyTemplate(sPath, dPath);
        else cpSync(sPath, dPath);
    }
}

copyTemplate(templateDir, projectDir);

// Placeholder substitution (mirrors CLI copyTemplate)
function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) { walk(p); continue; }
        let c = readFileSync(p, 'utf8');
        const before = c;
        c = c
            .replaceAll('{{PROJECT_NAME}}', 'smoke-test')
            .replaceAll('{{PROJECT_DESCRIPTION}}', 'merinaa smoke test');
        if (c !== before) writeFileSync(p, c);
    }
}

walk(projectDir);

// 4. Rewrite dependencies → file: tarballs (incl. transitive via pnpm.overrides)
const pkgPath = join(projectDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const overrides = {};
for (const name of packages) {
    const key = `@merinaa/${name}`;
    const ref = `file:${resolve(tarballsDir, latestTarball(name))}`;
    pkg.dependencies[key] = ref;
    overrides[key] = ref;
}
pkg.pnpm = { ...(pkg.pnpm ?? {}), overrides: { ...(pkg.pnpm?.overrides ?? {}), ...overrides } };
writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));
writeFileSync(
    join(projectDir, 'pnpm-workspace.yaml'),
    `packages:\n    - .\noverrides:\n${Object.entries(overrides).map(([key, ref]) => `    '${key}': '${ref}'`).join('\n')}\n`,
);

// 5. pnpm install + generate + typecheck
console.log(`\nProject scaffolded at ${projectDir}\n`);
run('pnpm install --ignore-scripts', { cwd: projectDir });
run('npx deepkit-type-install', { cwd: projectDir });
run('node scripts/generate-module-registry.js', { cwd: projectDir });
run('npx tsc -p modules/tsconfig.json --noEmit', { cwd: projectDir });
run('pnpm run build', { cwd: projectDir });
run('pnpm run build:ui', { cwd: projectDir });

console.log('\nSmoke test passed ✓');

// Cleanup
rmSync(tmpRoot, { recursive: true, force: true });
