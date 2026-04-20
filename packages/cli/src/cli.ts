import kleur from 'kleur';
import { initCommand } from './commands/init';
import { moduleCommand } from './commands/module';

const USAGE = `
${kleur.bold('merinaa')} ${kleur.dim('<command>')} ${kleur.dim('[args]')}

${kleur.bold('Commands:')}
  ${kleur.cyan('init')}    ${kleur.dim('<project-name>')}   Scaffold a new FiveM server project
  ${kleur.cyan('module')}  ${kleur.dim('<module-name>')}    Add a new module to the current project
  ${kleur.cyan('help')}                          Show this message

${kleur.bold('Examples:')}
  ${kleur.dim('$')} merinaa init my-server
  ${kleur.dim('$')} npm init merinaa my-server
  ${kleur.dim('$')} merinaa module banking
`.trim();

export async function runCli(argv: string[]): Promise<void> {
    const [command, ...rest] = argv;

    switch (command) {
        case 'init':
            await initCommand(rest);
            break;
        case 'module':
            await moduleCommand(rest);
            break;
        case 'help':
        case '--help':
        case '-h':
        case undefined:
            console.log(USAGE);
            break;
        default:
            console.error(kleur.red(`Unknown command: ${command}`));
            console.log(USAGE);
            process.exit(1);
    }
}
