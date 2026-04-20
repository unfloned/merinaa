import { showPage, hidePage } from '@merinaa/client';

/**
 * /hello command — opens the hello page.
 * The framework handles SetNuiFocus + movement/camera lock based on the
 * page declaration in module.config.ts.
 */
RegisterCommand('hello', () => {
    showPage('hello', { payload: { name: GetPlayerName(PlayerId()) } });
}, false);

/**
 * /hellobye command — closes any active page (including hello).
 */
RegisterCommand('hellobye', () => {
    hidePage();
}, false);
