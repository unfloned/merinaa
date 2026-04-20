/**
 * Production build script.
 *
 *  1. Run the merinaa generator → modules/.merinaa/{server,client,ui}.ts
 *  2. Compile TypeScript with Deepkit reflection (via tspc, a tsc wrapper
 *     that injects @deepkit/type-compiler for runtime type info).
 *  3. Bundle server + client with esbuild from the compiled dist.
 *  4. Copy framework.config.yaml to resource/ so LoadResourceFile can read it.
 *  5. Emit resource/version.json.
 *
 * Pass `--watch` to keep tsc + esbuild + the generator in watch mode.
 */
const esbuild = require('esbuild');
const { resolve } = require('path');
const { mkdirSync, existsSync, writeFileSync, readFileSync, rmSync } = require('fs');
const { execSync, spawn, spawnSync } = require('child_process');

const isWatch = process.argv.includes('--watch');
const rootDir = resolve(__dirname, '..');
const resourceDir = resolve(rootDir, 'resource');
const modulesDir = resolve(rootDir, 'modules');

for (const sub of ['server', 'client']) {
    const dir = resolve(resourceDir, sub);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function runGenerator() {
    const res = spawnSync('node', [resolve(__dirname, 'generate-module-registry.js')], {
        cwd: rootDir,
        stdio: 'inherit',
    });
    if (res.status !== 0) throw new Error('Module registry generation failed');
}

function runTsc() {
    console.log('[Build] Compiling TypeScript with Deepkit reflection...');
    try {
        execSync('npx deepkit-type-install', { cwd: rootDir, stdio: 'pipe' });
    } catch {}

    const serverRes = spawnSync('npx', ['tspc', '-p', 'modules/tsconfig.json'], {
        cwd: rootDir, stdio: 'inherit', shell: true,
    });
    if (serverRes.status !== 0) {
        console.warn(`[Build] tsc (server) exited with ${serverRes.status} — continuing, emit is on.`);
    }
    const clientRes = spawnSync('npx', ['tspc', '-p', 'modules/tsconfig.client.json'], {
        cwd: rootDir, stdio: 'inherit', shell: true,
    });
    if (clientRes.status !== 0) {
        console.warn(`[Build] tsc (client) exited with ${clientRes.status} — continuing, emit is on.`);
    }
}

function copyConfig() {
    const src = resolve(rootDir, 'framework.config.yaml');
    if (existsSync(src)) {
        writeFileSync(resolve(resourceDir, 'framework.config.yaml'), readFileSync(src, 'utf-8'));
    }
}

function writeVersion() {
    const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
    writeFileSync(
        resolve(resourceDir, 'version.json'),
        JSON.stringify({
            version: pkg.version,
            environment: isWatch ? 'development' : 'production',
            buildDate: new Date().toISOString().split('T')[0],
        }, null, 4),
    );
}

// Alias plugin: resolves @modules/* to the compiled dist, with directory-index fallback.
const aliasPlugin = {
    name: 'alias',
    setup(build) {
        build.onResolve({ filter: /^@modules\// }, (args) => {
            const rel = args.path.replace('@modules/', '');
            const asFile = resolve(modulesDir, `dist/${rel}.js`);
            const asIndex = resolve(modulesDir, `dist/${rel}/index.js`);
            if (existsSync(asFile)) return { path: asFile };
            if (existsSync(asIndex)) return { path: asIndex };
            return { path: asFile };
        });
        build.onResolve({ filter: /^reflect-metadata$/ }, () => ({
            path: require.resolve('reflect-metadata', { paths: [rootDir] }),
        }));
    },
};

const common = {
    bundle: true,
    sourcemap: isWatch ? 'inline' : false,
    minify: !isWatch,
    keepNames: true,
    logLevel: 'info',
};

const serverBuild = {
    ...common,
    // deepkit reflection breaks under esbuild minifyIdentifiers — turn off for server
    minify: false,
    entryPoints: [resolve(modulesDir, 'dist/.merinaa/server.js')],
    outfile: resolve(resourceDir, 'server/server.js'),
    platform: 'node',
    target: 'node22',
    format: 'iife',
    external: ['@citizenfx/server'],
    plugins: [aliasPlugin],
    banner: { js: '/// <reference types="@citizenfx/server" />' },
};

const clientBuild = {
    ...common,
    entryPoints: [resolve(modulesDir, 'dist/.merinaa/client.js')],
    outfile: resolve(resourceDir, 'client/client.js'),
    platform: 'browser',
    target: 'es2020',
    format: 'iife',
    globalName: 'Framework',
    external: ['@citizenfx/client'],
    plugins: [aliasPlugin],
    banner: { js: '/// <reference types="@citizenfx/client" />' },
};

async function main() {
    try {
        runGenerator();

        if (existsSync(resolve(modulesDir, 'dist'))) {
            rmSync(resolve(modulesDir, 'dist'), { recursive: true, force: true });
        }
        runTsc();
        writeVersion();
        copyConfig();

        console.log('[Build] Bundling with esbuild...');
        if (isWatch) {
            // Watch the merinaa configs and re-run the generator on change
            try {
                const chokidar = require('chokidar');
                chokidar
                    .watch([
                        resolve(modulesDir, 'merinaa.config.ts'),
                        resolve(modulesDir, '*/module.config.ts'),
                    ], { ignoreInitial: true })
                    .on('all', (event, path) => {
                        console.log(`[Build] ${event} ${path} — regenerating...`);
                        try { runGenerator(); } catch (err) { console.error(err.message); }
                    });
            } catch {
                console.warn('[Build] chokidar not installed — config files won\'t re-trigger the generator');
            }

            const [srv, cli] = await Promise.all([
                esbuild.context(serverBuild),
                esbuild.context(clientBuild),
            ]);
            await srv.watch();
            await cli.watch();
            console.log('[Build] Watching for changes...');
            const tscWatch = spawn('npx', ['tspc', '-p', 'modules/tsconfig.json', '--watch'], {
                cwd: rootDir, stdio: 'inherit', shell: true,
            });
            process.on('SIGINT', () => { tscWatch.kill(); process.exit(); });
        } else {
            await Promise.all([esbuild.build(serverBuild), esbuild.build(clientBuild)]);
            console.log('[Build] Build complete.');
        }
    } catch (err) {
        console.error('[Build] Failed:', err);
        process.exit(1);
    }
}

main();
