import { resolve } from 'path';
import { existsSync, readdirSync } from 'fs';
import kleur from 'kleur';
import { copyTemplate } from '../utils/templates';
import { resolveTemplatesDir } from '../utils/paths';

/**
 * `merinaa init <project-name>`
 *
 * Creates a new FiveM server project at `./<project-name>` with:
 *  - package.json (framework deps, build/dev scripts, docker scripts)
 *  - modules/merinaa.config.ts (app manifest — pre-wired with hello module)
 *  - modules/config.ts (getDatabaseConfig / getEnvironment helpers)
 *  - modules/tsconfig.{json,client.json}
 *  - modules/hello/ (example module with module.config.ts + server + client + ui page)
 *  - scripts/build.js (runs generator → tsc → esbuild; supports --watch)
 *  - scripts/generate-module-registry.js (pre-build manifest → entry generator)
 *  - ui/ (tiny Vite entry that imports the generated registry)
 *  - vite.config.mts, postcss.config.mjs
 *  - resource/fxmanifest.lua, framework.config.yaml, vitest.config.ts
 *  - docker/ (MySQL + FiveM + Adminer compose stack)
 *  - .env.example, .gitignore
 *
 * No hand-written server/client/ui entry points — the generator produces
 * `modules/.merinaa/{server,client,ui}.ts` from the manifests on each build.
 */
export async function initCommand(args: string[]): Promise<void> {
    const projectName = args[0];
    if (!projectName) {
        console.error(kleur.red('Missing project name.'));
        console.log(`Usage: ${kleur.cyan('merinaa init <project-name>')}`);
        process.exit(1);
    }

    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(projectName)) {
        console.error(kleur.red(`Invalid project name: ${projectName}`));
        console.log(kleur.dim('Use lowercase letters, digits, hyphens, or underscores.'));
        process.exit(1);
    }

    const targetDir = resolve(process.cwd(), projectName);
    if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
        console.error(kleur.red(`Directory ${targetDir} already exists and is not empty.`));
        process.exit(1);
    }

    const templatesDir = resolveTemplatesDir();
    const baseTemplate = resolve(templatesDir, 'base');

    console.log(kleur.cyan(`\n→ Creating ${kleur.bold(projectName)} at ${targetDir}\n`));

    copyTemplate(baseTemplate, targetDir, {
        PROJECT_NAME: projectName,
        PROJECT_DESCRIPTION: `FiveM server built on @merinaa`,
    });

    console.log(kleur.green('✓ Project created.\n'));
    console.log(kleur.bold('Next steps:'));
    console.log(`  ${kleur.dim('$')} cd ${projectName}`);
    console.log(`  ${kleur.dim('$')} pnpm install         ${kleur.dim('# or npm install / yarn')}`);
    console.log(`  ${kleur.dim('$')} cp .env.example .env ${kleur.dim('# fill in MySQL + Discord secrets')}`);
    console.log(`  ${kleur.dim('$')} pnpm run build       ${kleur.dim('# compiles server + client + UI')}`);
    console.log(`  ${kleur.dim('$')} pnpm run docker:up   ${kleur.dim('# MySQL + FiveM + Adminer on localhost:30120')}`);
    console.log(`  ${kleur.dim('$')} pnpm run docker:logs\n`);
}
