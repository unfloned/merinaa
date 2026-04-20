import { Controller, OnReady } from '@merinaa/core';
import { {{MODULE_PASCAL}}Service } from './{{MODULE_NAME}}.service';

@Controller()
export class {{MODULE_PASCAL}}Controller {
    constructor(private readonly service: {{MODULE_PASCAL}}Service) {}

    @OnReady()
    async onReady(): Promise<void> {
        console.log('[{{MODULE_PASCAL}}] ready');
    }
}
