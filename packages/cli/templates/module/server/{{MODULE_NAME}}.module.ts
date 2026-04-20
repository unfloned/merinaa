import { Module } from '@merinaa/core';
import { {{MODULE_PASCAL}}Controller } from './{{MODULE_NAME}}.controller';
import { {{MODULE_PASCAL}}Service } from './{{MODULE_NAME}}.service';

/**
 * {{MODULE_PASCAL}}Module
 *
 * Activated by importing it in `modules/merinaa.config.ts` — see this
 * module's sibling `module.config.ts`.
 */
@Module({
    controllers: [{{MODULE_PASCAL}}Controller],
    providers: [{{MODULE_PASCAL}}Service],
    entities: [],
    config: {
        // Default values — override in framework.config.yaml under `{{MODULE_CAMEL}}.*`
    },
})
export class {{MODULE_PASCAL}}Module {}
