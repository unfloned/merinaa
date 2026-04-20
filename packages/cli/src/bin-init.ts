#!/usr/bin/env node
/**
 * `create-merinaa` shim — shortcut for `npm init merinaa`.
 * Invokes the `init` command with the remaining argv.
 */
import { runCli } from './cli';

runCli(['init', ...process.argv.slice(2)]).catch((err) => {
    console.error(err);
    process.exit(1);
});
