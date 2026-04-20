---
title: Plugins & overrides
order: 60
---

# Plugins & overrides

## Reusable modules ("plugins")

A plugin is just a module packaged as an npm package. Conventions:

- Name: `@merinaa-plugin/<name>` (community) or `@merinaa/<name>`
  (official)
- The package ships `module.config.ts` + server/client/ui folders, same
  layout as an in-tree module
- Consumer installs and imports it in `merinaa.config.ts`

```ts
// merinaa.config.ts
import jobs from '@merinaa-plugin/jobs/module.config';

export default defineApp({
    name: 'my-server',
    modules: [jobs /* ... */],
});
```

For this to work, the plugin needs to ship as TypeScript source (not
compiled) so the consumer's `tspc` picks up Deepkit reflection. Mark the
package as "TypeScript-only" in its README and set `"main": "src/index.ts"`
in the plugin's `package.json`.

## Overriding a service

Deepkit DI supports provider substitution via `useClass`. If a plugin
ships `JobService` and you want to replace it in your project, write a
subclass and register it in a module that imports the plugin:

```ts
// modules/my-jobs/jobs-override.service.ts
import { Injectable } from '@merinaa/core';
import { JobService as PluginJobService } from '@merinaa-plugin/jobs';

@Injectable()
export class MyJobService extends PluginJobService {
    createJob(name: string): string {
        // custom behaviour
        return super.createJob(name.toUpperCase());
    }
}

// modules/my-jobs/my-jobs.module.ts
@Module({
    providers: [
        { provide: PluginJobService, useClass: MyJobService },
    ],
    exports: [PluginJobService],
})
export class MyJobsModule {}
```

List both modules in `merinaa.config.ts`, with your override module
**after** the plugin so Deepkit resolves your `useClass` last.

## Publishing a plugin

1. Init an npm package with `"main": "src/index.ts"` and `"types":
   "src/index.ts"`
2. Set `"peerDependencies": { "@merinaa/core": "^0.3.0", "@merinaa/server":
   "^0.3.0" }`
3. Export a `module.config.ts` alongside your source
4. Publish under the `@merinaa-plugin` scope if you want discovery via
   the npm registry
