import { listen } from '../events/listeners';

/**
 * Simple spawn handler for development
 * Handles the character:spawn event from server
 *
 * Includes a queue system that waits for UI to be ready before
 * forwarding character:showSelection events.
 */

interface SpawnData {
    x?: number;
    y?: number;
    z?: number;
    heading?: number;
    model?: string;
    // Alternative format from character system
    position?: {
        x: number;
        y: number;
        z: number;
        heading: number;
    };
    characterData?: any;
}

let pendingSpawn: SpawnData | null = null;
let isClientReady = false;
let hasSpawned = false; // Prevent double spawning

// ============================================================================
// UI READY QUEUE SYSTEM
// Queues events until UI (React/NUI) is ready to receive them
// ============================================================================

interface QueuedEvent {
    event: string;
    data: any;
}

let isUIReady = false;
const eventQueue: QueuedEvent[] = [];

/**
 * Process all queued events - send them to their original handlers
 */
function processEventQueue(): void {
    console.log(`[Spawn] Processing ${eventQueue.length} queued events...`);

    while (eventQueue.length > 0) {
        const item = eventQueue.shift()!;
        console.log(`[Spawn] Dispatching queued event: ${item.event}`);
        emit(item.event, item.data);
    }
}

/**
 * Queue an event to be processed when UI is ready
 */
function queueEvent(event: string, data: any): void {
    console.log(`[Spawn] Queueing event: ${event}`);
    eventQueue.push({ event, data });
}

// Register NUI callback for ui:ready IMMEDIATELY at module load
RegisterNuiCallbackType('ui:ready');
on('__cfx_nui:ui:ready', (_data: any, cb: Function) => {
    console.log('[Spawn] UI ready callback received!');
    isUIReady = true;

    // Process all queued events now that UI is ready
    processEventQueue();

    cb({ ok: true });
});

// Intercept character:showSelection from server - queue if UI not ready
onNet('character:showSelection', (data: any) => {
    if (isUIReady) {
        // UI is ready, forward immediately to CharacterClient
        console.log('[Spawn] UI ready, forwarding character:showSelection');
        emit('character:showSelection:ready', data);
    } else {
        // UI not ready yet, queue the event
        console.log('[Spawn] UI not ready, queueing character:showSelection');
        queueEvent('character:showSelection:ready', data);
    }
});

/**
 * Wait for player to be fully loaded
 */
async function waitForPlayerReady(): Promise<void> {
    console.log('[Spawn] Waiting for player to be ready...');

    // Wait until player is active in network
    while (!NetworkIsPlayerActive(PlayerId())) {
        await new Promise<void>(resolve => setTimeout(resolve, 100, undefined));
    }

    console.log('[Spawn] Player is network active');

    // Hide player immediately and keep black screen
    const ped = PlayerPedId();
    DoScreenFadeOut(0);
    FreezeEntityPosition(ped, true);
    SetEntityVisible(ped, false, false);
    SetEntityInvincible(ped, true);
    SetEntityCollision(ped, false, false);

    // Small additional delay to ensure everything is initialized
    await new Promise<void>(resolve => setTimeout(resolve, 500, undefined));

    // Shutdown loading screen but keep black fade
    ShutdownLoadingScreen();
    ShutdownLoadingScreenNui();

    console.log('[Spawn] Player ready (hidden, waiting for character selection)');
}

/**
 * Load a player model
 */
async function loadModel(modelName: string): Promise<void> {
    const model = GetHashKey(modelName);

    RequestModel(model);

    // Wait for model to load (max 10 seconds)
    let attempts = 0;
    while (!HasModelLoaded(model) && attempts < 100) {
        await new Promise<void>(resolve => setTimeout(resolve, 100, undefined));
        attempts++;
    }

    if (!HasModelLoaded(model)) {
        console.error(`[Spawn] Failed to load model: ${modelName}`);
        return;
    }

    SetPlayerModel(PlayerId(), model);
    SetModelAsNoLongerNeeded(model);

    // CRITICAL: Freemode models (mp_m_freemode_01, mp_f_freemode_01) need extra setup
    // Without this, the character will be invisible!
    const ped = PlayerPedId();
    const isFreemode = modelName === 'mp_m_freemode_01' || modelName === 'mp_f_freemode_01';

    if (isFreemode) {
        console.log('[Spawn] Applying freemode model defaults...');

        // Set head blend data - REQUIRED to make face visible
        // SetPedHeadBlendData(ped, shapeFirst, shapeSecond, shapeThird, skinFirst, skinSecond, skinThird, shapeMix, skinMix, thirdMix, isParent)
        SetPedHeadBlendData(ped, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.0, false);

        // Set default clothing components so body is visible
        // Component IDs: 1=mask, 3=torso, 4=legs, 5=bags, 6=shoes, 7=accessories, 8=undershirt, 11=jacket
        SetPedComponentVariation(ped, 1, 0, 0, 0);    // Mask
        SetPedComponentVariation(ped, 3, 15, 0, 0);   // Torso/Arms
        SetPedComponentVariation(ped, 4, 61, 0, 0);   // Legs
        SetPedComponentVariation(ped, 6, 34, 0, 0);   // Shoes
        SetPedComponentVariation(ped, 7, 0, 0, 0);    // Accessories
        SetPedComponentVariation(ped, 8, 15, 0, 0);   // Undershirt
        SetPedComponentVariation(ped, 11, 15, 0, 0);  // Jacket/Torso2

        // Set default hair
        SetPedComponentVariation(ped, 2, 0, 0, 0);    // Hair

        console.log('[Spawn] Freemode defaults applied');
    }
}

/**
 * Spawn player at position
 * NOTE: This is now handled by character.client.ts handleSpawn()
 * This function is kept as a fallback but should not make player visible
 */
async function spawnPlayer(data: SpawnData): Promise<void> {
    // The character.client.ts now handles all spawning
    // This function only logs for debugging
    console.log('[Spawn] Spawn event received - handled by CharacterClient');
    console.log('[Spawn] Data:', JSON.stringify(data));

    // Don't do anything here - let character.client.ts handle it
    // The hasSpawned flag prevents this from interfering
}

/**
 * Process pending spawn if any
 */
async function processPendingSpawn(): Promise<void> {
    if (pendingSpawn && isClientReady) {
        const data = pendingSpawn;
        pendingSpawn = null;
        await spawnPlayer(data);
    }
}

/**
 * Initialize spawn handler
 */
let spawnHandlerStarted = false;

export function initSpawnHandler(): void {
    if (spawnHandlerStarted) return;
    spawnHandlerStarted = true;
    console.log('[Spawn] Initializing spawn handler...');

    // Listen for spawn event from server
    listen('net', 'character:spawn', async (data: SpawnData) => {
        console.log('[Spawn] Received spawn event:', JSON.stringify(data));

        if (isClientReady) {
            // Client is ready, spawn immediately
            await spawnPlayer(data);
        } else {
            // Client not ready yet, queue the spawn
            console.log('[Spawn] Client not ready, queuing spawn...');
            pendingSpawn = data;
        }
    });

    // Start the ready check
    (async () => {
        // Wait for player network and world to be ready
        await waitForPlayerReady();

        isClientReady = true;

        console.log('[Spawn] Client is ready, notifying server...');

        // Notify server that client is ready
        // Note: character:showSelection will be queued by the queue system above
        // until UI sends ui:ready callback
        emitNet('character:clientReady');

        // Process any pending spawn
        await processPendingSpawn();
    })();

    console.log('[Spawn] Spawn handler initialized');
}
