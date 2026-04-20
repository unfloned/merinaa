import { Controller } from '@merinaa/core';
import { showPage, hidePage } from '@merinaa/client';

@Controller()
export class {{MODULE_PASCAL}}ClientController {
    // Example — open the page from server:
    // @OnServer('{{MODULE_CAMEL}}:openUI')
    // onOpen(data: unknown): void {
    //     showPage('{{MODULE_CAMEL}}', data);
    // }

    // Example — close from a NUI event:
    // @OnServer('{{MODULE_CAMEL}}:closeUI')
    // onClose(): void {
    //     hidePage('{{MODULE_CAMEL}}');
    // }
}
