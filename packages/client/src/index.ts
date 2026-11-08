import 'reflect-metadata';

// Core re-exports
export * from '@merinaa/core';

// Client app
export * from './app/client-application';
export * from './app/create-client';
export * from './app/bootstrap-client';

// NUI Bridge
export * from './nui/nui-bridge';
export * from './nui/nui-callbacks';

// Page/Overlay manager (openPage, closePage, showOverlay, hideOverlay)
export * from './ui/page-manager';

// Services
export * from './services/player-local.service';
export * from './services/notification.service';

// Initialize NotificationService (registers event handlers)
import { getNotificationService } from './services/notification.service';
getNotificationService();

// Utils
export * from './utils/natives';
export * from './utils/streaming';
export { onNui, onNuiBatch } from './utils/nui-callbacks';
export { listen, listenerCount } from './events/listeners';

// RPC
export * from './rpc';

// Spawn handler (auto-init for development)
import { initSpawnHandler } from './spawn/spawn-handler';
initSpawnHandler();
