import { resolve } from 'path';
import { existsSync } from 'fs';
import kleur from 'kleur';
import { copyTemplate } from '../utils/templates';
import { resolveTemplatesDir } from '../utils/paths';

/**
 * `merinaa module <module-name>`
 *
 * Scaffolds a new module under `modules/<module-name>/` in the current
 * project. Creates:
 *   - `module.config.ts`      manifest consumed by the generator
 *   - `server/` (module, controller, service, index with default export)
 *   - `client/` (index + controller)
 *   - `shared/` (types)
 *   - `ui/pages/<Pascal>Page.tsx` example page
 *
 * Run this from the root of a project previously created with `merinaa init`.
 */
export async function moduleCommand(args: string[]): Promise<void> {
    const moduleName = args[0];
    if (!moduleName) {
        console.error(kleur.red('Missing module name.'));
        console.log(`Usage: ${kleur.cyan('merinaa module <module-name>')}`);
        process.exit(1);
    }

    if (!/^[a-z][a-z0-9-]*$/.test(moduleName)) {
        console.error(kleur.red(`Invalid module name: ${moduleName}`));
        console.log(kleur.dim('Use lowercase letters, digits, hyphens. Must start with a letter.'));
        process.exit(1);
    }

    // Verify we're inside a project by looking for src/modules/ or package.json.
    const cwd = process.cwd();
    if (!existsSync(resolve(cwd, 'package.json'))) {
        console.error(kleur.red('No package.json in the current directory.'));
        console.log(kleur.dim('Run this command from the root of a merinaa project.'));
        process.exit(1);
    }

    const targetDir = resolve(cwd, 'modules', moduleName);
    if (existsSync(targetDir)) {
        console.error(kleur.red(`Module ${moduleName} already exists at ${targetDir}`));
        process.exit(1);
    }

    const templatesDir = resolveTemplatesDir();
    const moduleTemplate = resolve(templatesDir, 'module');

    const pascal = toPascalCase(moduleName);
    const camel = toCamelCase(moduleName);

    console.log(kleur.cyan(`\n→ Creating module ${kleur.bold(moduleName)} at ${targetDir}\n`));

    copyTemplate(moduleTemplate, targetDir, {
        MODULE_NAME: moduleName,
        MODULE_PASCAL: pascal,
        MODULE_CAMEL: camel,
    });

    console.log(kleur.green(`✓ Module ${moduleName} created.\n`));
    console.log(kleur.bold('Next steps:'));
    console.log(`  ${kleur.dim('1.')} Import it in ${kleur.cyan('modules/merinaa.config.ts')}:`);
    console.log(`     ${kleur.dim(`import ${camel} from './${moduleName}/module.config';`)}`);
    console.log(`  ${kleur.dim('2.')} Add ${kleur.cyan(camel)} to the ${kleur.cyan('modules')} array.`);
    console.log(`  ${kleur.dim('3.')} Rebuild: ${kleur.cyan('pnpm run build')}`);
    console.log(`     ${kleur.dim('(The generator picks up the new module.config.ts automatically.)')}\n`);
}

function toPascalCase(s: string): string {
    return s
        .split(/[-_]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');
}

function toCamelCase(s: string): string {
    const pascal = toPascalCase(s);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
