import { defineModule } from '@merinaa/core';

export default defineModule({
    name: 'hello',
    hasServer: true,
    hasClient: true,
    ui: {
        pages: [
            {
                id: 'hello',
                event: 'hello:open',
                component: 'pages/HelloPage',
                closeEvent: 'hello:close',
                focus: true,
                disableMovement: true,
                disableCamera: true,
                closeOnEscape: true,
            },
        ],
    },
});
