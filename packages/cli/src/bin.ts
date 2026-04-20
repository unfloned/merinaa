#!/usr/bin/env node
/**
 * Main CLI entrypoint: `fivem-framework <command> [args]`
 */
import { runCli } from './cli';

runCli(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
});
