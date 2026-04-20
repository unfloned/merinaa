import { Module } from '@merinaa/core';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';
import { HelloGuard } from './hello.guard';

/**
 * Hello — example module.
 *
 * Registered in merinaa.config.ts via its sibling `module.config.ts`.
 * The generator picks up the default export from `server/index.ts` and
 * hands it to Deepkit DI.
 */
@Module({
    providers: [HelloService, HelloController, HelloGuard],
    exports: [HelloService],
})
export class HelloModule {}
