import { defineApp } from '@merinaa/core';
import { getDatabaseConfig } from './config';

import hello from './hello/module.config';

/**
 * App manifest — consumed by `scripts/generate-module-registry.js` at build
 * time to produce `modules/.merinaa/{server,client,ui}.ts` entry points.
 *
 * Add a module:
 *   1. Run `merinaa module <name>` (scaffolds modules/<name>/)
 *   2. Import its `module.config` here and put it in the `modules` array
 */
export default defineApp({
    name: '{{PROJECT_NAME}}',
    database: getDatabaseConfig() as any,
    modules: [
        hello,
    ],
});
