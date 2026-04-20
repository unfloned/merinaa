import { defineModule } from '@merinaa/core';

/**
 * {{MODULE_PASCAL}} module manifest.
 *
 * After scaffolding:
 *   1. Import this in `modules/merinaa.config.ts`:
 *        import {{MODULE_CAMEL}} from './{{MODULE_NAME}}/module.config';
 *   2. Add `{{MODULE_CAMEL}}` to the `modules` array.
 *   3. Run `pnpm run build` — the generator picks it up automatically.
 */
export default defineModule({
    name: '{{MODULE_NAME}}',
    hasServer: true,
    hasClient: true,
    ui: {
        pages: [
            {
                id: '{{MODULE_CAMEL}}',
                event: '{{MODULE_CAMEL}}:open',
                component: 'pages/{{MODULE_PASCAL}}Page',
                closeEvent: '{{MODULE_CAMEL}}:close',
                focus: true,
                disableMovement: true,
                disableCamera: true,
                closeOnEscape: true,
            },
        ],
    },
});
