#!/usr/bin/env node
/**
 * Pre-build generator for merinaa module registries.
 *
 * Reads:
 *   - modules/merinaa.config.ts — app manifest (AppConfig)
 *   - modules/<name>/module.config.ts — per-module manifests
 *
 * Writes:
 *   - modules/.merinaa/server.ts     esbuild entry for server bundle
 *   - modules/.merinaa/client.ts     esbuild entry for client bundle
 *   - modules/.merinaa/ui.ts         vite entry for UI bundle
 *   - modules/.merinaa/page-ids.ts   typed union of every registered page id
 *
 * Validation:
 *   - Unique module names
 *   - Unique page ids, events, overlay ids
 *   - component paths on disk exist
 *   - dependsOn references resolve + no cycles
 *
 * All generated files reference only their bundler's surface — no React
 * in the server bundle, no Deepkit in the UI bundle.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require('esbuild');

const rootDir = path.resolve(__dirname, '..');
const modulesDir = path.join(rootDir, 'modules');
const outDir = path.join(modulesDir, '.merinaa');

// Stub FiveM globals so the config evaluates at build time
globalThis.GetConvar = (_n, fb) => fb ?? '';
globalThis.GetConvarInt = (_n, fb) => Number(fb ?? 0);
globalThis.GetCurrentResourceName = () => 'merinaa-build';
globalThis.GetResourcePath = () => rootDir;
globalThis.LoadResourceFile = () => null;

// Defer @merinaa/core resolution to a trivial stub so the generator
// doesn't have to link against the real compiled package
const Module = require('module');
const origResolve = Module._resolveFilename;
const stubPath = path.join(__dirname, '.merinaa-core-stub.js');
if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(stubPath, 'module.exports = { defineApp: (c) => c, defineModule: (c) => c };\n');
}
Module._resolveFilename = function patched(req, parent, ...rest) {
    if (req === '@merinaa/core') return stubPath;
    return origResolve.call(this, req, parent, ...rest);
};

async function loadAppConfig() {
    const configPath = path.join(modulesDir, 'merinaa.config.ts');
    if (!fs.existsSync(configPath)) {
        throw new Error(`merinaa.config.ts not found at ${configPath}`);
    }

    const tmpOut = path.join(os.tmpdir(), `merinaa-config-${process.pid}.cjs`);
    await esbuild.build({
        entryPoints: [configPath],
        bundle: true,
        platform: 'node',
        target: 'node18',
        format: 'cjs',
        outfile: tmpOut,
        external: ['@merinaa/*', '@citizenfx/*', '@deepkit/*', 'reflect-metadata'],
        logLevel: 'silent',
        loader: { '.ts': 'ts' },
        plugins: [{
            name: 'modules-alias',
            setup(build) {
                build.onResolve({ filter: /^@modules\// }, (args) => ({
                    path: path.join(modulesDir, args.path.slice('@modules/'.length)),
                }));
            },
        }],
    });

    const mod = require(tmpOut);
    try { fs.unlinkSync(tmpOut); } catch {}
    return mod.default ?? mod;
}

function topoSort(modules) {
    const byName = new Map(modules.map((m) => [m.name, m]));
    const visited = new Set();
    const temp = new Set();
    const result = [];

    function visit(m) {
        if (visited.has(m.name)) return;
        if (temp.has(m.name)) throw new Error(`Circular dependency at '${m.name}'`);
        temp.add(m.name);
        for (const dep of m.dependsOn ?? []) {
            const d = byName.get(dep);
            if (!d) throw new Error(`Module '${m.name}' depends on '${dep}' — not found in merinaa.config.ts`);
            visit(d);
        }
        temp.delete(m.name);
        visited.add(m.name);
        result.push(m);
    }

    for (const m of modules) visit(m);
    return result;
}

function resolveCloseEvent(event, explicit) {
    if (explicit) return explicit;
    if (event.endsWith(':open')) return event.slice(0, -':open'.length) + ':close';
    return event + ':close';
}

function pascalCase(s) {
    return s.replace(/(^\w|-\w)/g, (m) => m.replace('-', '').toUpperCase());
}

function deriveId(p) {
    if (p.id) return p.id;
    if (p.event.endsWith(':open')) return p.event.slice(0, -':open'.length);
    return p.event;
}

function validateComponentFile(moduleName, componentPath, kind) {
    const base = path.join(modulesDir, moduleName, 'ui', componentPath);
    const candidates = [base + '.tsx', base + '.ts', path.join(base, 'index.tsx'), path.join(base, 'index.ts')];
    const hit = candidates.find((p) => fs.existsSync(p));
    if (!hit) {
        throw new Error(
            `[${moduleName}] ${kind} component path '${componentPath}' doesn't resolve to a file. ` +
            `Looked for:\n  ${candidates.map((p) => path.relative(rootDir, p)).join('\n  ')}`,
        );
    }
}

(async () => {
    const appConfig = await loadAppConfig();
    if (!appConfig || !Array.isArray(appConfig.modules)) {
        throw new Error('merinaa.config.ts must default-export an AppConfig with a `modules` array');
    }

    const activeModules = appConfig.modules.filter((m) => m && m.enabled !== false);
    const sorted = topoSort(activeModules);

    // Validation
    const seenNames = new Set();
    const seenPageIds = new Set();
    const seenEvents = new Set();
    const seenOverlayIds = new Set();
    for (const m of sorted) {
        if (seenNames.has(m.name)) throw new Error(`Duplicate module name: '${m.name}'`);
        seenNames.add(m.name);

        for (const p of m.ui?.pages ?? []) {
            const id = deriveId(p);
            if (seenPageIds.has(id)) {
                throw new Error(`Duplicate page id '${id}' (module ${m.name}). ` +
                    `Set an explicit \`id: '...'\` in the page config to disambiguate.`);
            }
            if (seenEvents.has(p.event)) {
                throw new Error(`Duplicate page event '${p.event}' (module ${m.name})`);
            }
            seenPageIds.add(id);
            seenEvents.add(p.event);
            validateComponentFile(m.name, p.component, 'page');
        }
        for (const o of m.ui?.overlays ?? []) {
            if (seenOverlayIds.has(o.id)) throw new Error(`Duplicate overlay id '${o.id}' (module ${m.name})`);
            seenOverlayIds.add(o.id);
            validateComponentFile(m.name, o.component, 'overlay');
        }
    }

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // --- server.ts ---
    {
        const lines = [
            "// AUTO-GENERATED by scripts/generate-module-registry.js — DO NOT EDIT",
            "import 'reflect-metadata';",
            "import { bootstrapServer } from '@merinaa/server';",
        ];
        const refs = [];
        for (const m of sorted) {
            if (m.hasServer === false) continue;
            const serverIndex = path.join(modulesDir, m.name, 'server', 'index.ts');
            if (!fs.existsSync(serverIndex) && !m.hasServer) continue;

            if (m.hasServer === 'side-effect') {
                lines.push(`import '@modules/${m.name}/server';`);
            } else {
                const ref = pascalCase(m.name) + 'Module';
                lines.push(`import ${ref} from '@modules/${m.name}/server';`);
                refs.push(ref);
            }
        }
        lines.push('');
        lines.push("import app from '../merinaa.config';");
        lines.push('');
        lines.push('bootstrapServer({');
        lines.push(`    modules: [${refs.join(', ')}],`);
        lines.push('    app,');
        lines.push('    databaseConfig: app.database as any,');
        lines.push("    yamlConfig: 'framework.config.yaml',");
        lines.push('}).catch((err) => {');
        lines.push("    console.error('[Framework] bootstrapServer failed:', err);");
        lines.push('});');
        fs.writeFileSync(path.join(outDir, 'server.ts'), lines.join('\n') + '\n');
    }

    // --- client.ts ---
    {
        const lines = [
            "// AUTO-GENERATED by scripts/generate-module-registry.js — DO NOT EDIT",
            "import { bootstrapClient } from '@merinaa/client';",
        ];
        for (const m of sorted) {
            if (m.hasClient === false) continue;
            const clientIndex = path.join(modulesDir, m.name, 'client', 'index.ts');
            if (!fs.existsSync(clientIndex) && m.hasClient !== true) continue;
            lines.push(`import '@modules/${m.name}/client';`);
        }
        lines.push('');
        lines.push('bootstrapClient({');
        lines.push('    pageOptions: {');
        for (const m of sorted) {
            for (const p of m.ui?.pages ?? []) {
                const closeEvent = resolveCloseEvent(p.event, p.closeEvent);
                const id = deriveId(p);
                const opts = {
                    id,
                    event: p.event,
                    closeEvent,
                    focus: p.focus ?? true,
                    disableMovement: p.disableMovement ?? false,
                    disableCamera: p.disableCamera ?? false,
                    closeOnEscape: p.closeOnEscape ?? true,
                };
                lines.push(`        '${p.event}': ${JSON.stringify(opts)},`);
            }
        }
        lines.push('    },');
        lines.push('});');
        fs.writeFileSync(path.join(outDir, 'client.ts'), lines.join('\n') + '\n');
    }

    // --- ui.ts ---
    {
        const lines = [
            "// AUTO-GENERATED by scripts/generate-module-registry.js — DO NOT EDIT",
            "import 'reflect-metadata';",
            "import { createUI } from '@merinaa/ui';",
            '',
            'createUI({',
            '    modules: {',
        ];
        for (const m of sorted) {
            const pages = m.ui?.pages ?? [];
            const overlays = m.ui?.overlays ?? [];
            if (pages.length === 0 && overlays.length === 0) continue;

            lines.push(`        '${m.name}': {`);
            if (pages.length > 0) {
                lines.push('            pages: [');
                for (const p of pages) {
                    const closeEvent = resolveCloseEvent(p.event, p.closeEvent);
                    lines.push('                {');
                    lines.push(`                    event: '${p.event}',`);
                    lines.push(`                    load: () => import('@modules/${m.name}/ui/${p.component}'),`);
                    lines.push(`                    closeEvent: '${closeEvent}',`);
                    if (p.focus !== undefined) lines.push(`                    focus: ${p.focus},`);
                    if (p.disableMovement !== undefined) lines.push(`                    disableMovement: ${p.disableMovement},`);
                    if (p.disableCamera !== undefined) lines.push(`                    disableCamera: ${p.disableCamera},`);
                    if (p.closeOnEscape !== undefined) lines.push(`                    closeOnEscape: ${p.closeOnEscape},`);
                    lines.push('                },');
                }
                lines.push('            ],');
            }
            if (overlays.length > 0) {
                lines.push('            overlays: [');
                for (const o of overlays) {
                    lines.push('                {');
                    lines.push(`                    id: '${o.id}',`);
                    lines.push(`                    load: () => import('@modules/${m.name}/ui/${o.component}'),`);
                    if (o.alwaysMounted !== undefined) lines.push(`                    alwaysMounted: ${o.alwaysMounted},`);
                    lines.push('                },');
                }
                lines.push('            ],');
            }
            lines.push('        },');
        }
        lines.push('    },');
        lines.push("}).mount('#root');");
        fs.writeFileSync(path.join(outDir, 'ui.ts'), lines.join('\n') + '\n');
    }

    // --- page-ids.ts (typed union for autocomplete on showPage(...)) ---
    {
        const ids = [...seenPageIds];
        const lines = [
            '// AUTO-GENERATED by scripts/generate-module-registry.js — DO NOT EDIT',
            '',
            '/**',
            ' * Union of every page id registered across all active modules.',
            ' * Import this type if you want compile-time autocomplete on showPage().',
            ' *',
            ' * @example',
            " *   import type { PageId } from '@modules/.merinaa/page-ids';",
            " *   showPage('bank' as PageId, { ... });  // typo-protected",
            ' */',
            ids.length > 0
                ? `export type PageId = ${ids.map((id) => `'${id}'`).join(' | ')};`
                : 'export type PageId = never;',
        ];
        fs.writeFileSync(path.join(outDir, 'page-ids.ts'), lines.join('\n') + '\n');
    }

    console.log(`[merinaa:gen] Generated modules/.merinaa/ for ${sorted.length} module(s):`);
    for (const m of sorted) {
        const bits = [];
        if (m.hasServer !== false) bits.push('server');
        if (m.hasClient !== false) bits.push('client');
        if ((m.ui?.pages?.length ?? 0) > 0 || (m.ui?.overlays?.length ?? 0) > 0) bits.push('ui');
        console.log(`  - ${m.name} (${bits.join(', ')})`);
    }
    console.log(`  Pages: ${seenPageIds.size}, overlays: ${seenOverlayIds.size}`);
})().catch((err) => {
    console.error('[merinaa:gen] Failed:', err.message);
    process.exit(1);
});
