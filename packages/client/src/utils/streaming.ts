/**
 * Streaming utilities for loading game assets
 */

/**
 * Request and wait for a model to load
 */
export async function requestModel(model: string | number): Promise<boolean> {
    const hash = typeof model === 'string' ? GetHashKey(model) : model;

    if (!IsModelValid(hash)) {
        console.warn(`[Streaming] Invalid model: ${model}`);
        return false;
    }

    if (HasModelLoaded(hash)) {
        return true;
    }

    RequestModel(hash);

    const timeout = GetGameTimer() + 10000; // 10 second timeout

    while (!HasModelLoaded(hash)) {
        if (GetGameTimer() > timeout) {
            console.error(`[Streaming] Timeout loading model: ${model}`);
            return false;
        }
        await wait(0);
    }

    return true;
}

/**
 * Request and wait for an animation dictionary
 */
export async function requestAnimDict(dict: string): Promise<boolean> {
    if (HasAnimDictLoaded(dict)) {
        return true;
    }

    RequestAnimDict(dict);

    const timeout = GetGameTimer() + 10000;

    while (!HasAnimDictLoaded(dict)) {
        if (GetGameTimer() > timeout) {
            console.error(`[Streaming] Timeout loading anim dict: ${dict}`);
            return false;
        }
        await wait(0);
    }

    return true;
}

/**
 * Request and wait for an animation set
 */
export async function requestAnimSet(set: string): Promise<boolean> {
    if (HasAnimSetLoaded(set)) {
        return true;
    }

    RequestAnimSet(set);

    const timeout = GetGameTimer() + 10000;

    while (!HasAnimSetLoaded(set)) {
        if (GetGameTimer() > timeout) {
            console.error(`[Streaming] Timeout loading anim set: ${set}`);
            return false;
        }
        await wait(0);
    }

    return true;
}

/**
 * Request and wait for a texture dictionary
 */
export async function requestStreamedTextureDict(dict: string): Promise<boolean> {
    if (HasStreamedTextureDictLoaded(dict)) {
        return true;
    }

    RequestStreamedTextureDict(dict, true);

    const timeout = GetGameTimer() + 10000;

    while (!HasStreamedTextureDictLoaded(dict)) {
        if (GetGameTimer() > timeout) {
            console.error(`[Streaming] Timeout loading texture dict: ${dict}`);
            return false;
        }
        await wait(0);
    }

    return true;
}

/**
 * Request and wait for a clip set
 */
export async function requestClipSet(clipSet: string): Promise<boolean> {
    if (HasClipSetLoaded(clipSet)) {
        return true;
    }

    RequestClipSet(clipSet);

    const timeout = GetGameTimer() + 10000;

    while (!HasClipSetLoaded(clipSet)) {
        if (GetGameTimer() > timeout) {
            console.error(`[Streaming] Timeout loading clip set: ${clipSet}`);
            return false;
        }
        await wait(0);
    }

    return true;
}

/**
 * Play animation on ped
 */
export async function playAnim(
    ped: number,
    dict: string,
    anim: string,
    blendIn: number = 8.0,
    blendOut: number = -8.0,
    duration: number = -1,
    flag: number = 0,
    playbackRate: number = 0.0
): Promise<void> {
    await requestAnimDict(dict);

    TaskPlayAnim(ped, dict, anim, blendIn, blendOut, duration, flag, playbackRate, false, false, false);
}

/**
 * Load weapon asset
 */
export async function requestWeaponAsset(
    weaponHash: number,
    timeout: number = 5000
): Promise<boolean> {
    if (HasWeaponAssetLoaded(weaponHash)) {
        return true;
    }

    RequestWeaponAsset(weaponHash, 31, 0);

    const endTime = GetGameTimer() + timeout;

    while (!HasWeaponAssetLoaded(weaponHash)) {
        if (GetGameTimer() > endTime) {
            return false;
        }
        await wait(0);
    }

    return true;
}

/**
 * Wait helper
 */
function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean up loaded assets
 */
export function cleanupAssets(assets: {
    models?: (string | number)[];
    animDicts?: string[];
    textureDicts?: string[];
}): void {
    if (assets.models) {
        for (const model of assets.models) {
            const hash = typeof model === 'string' ? GetHashKey(model) : model;
            SetModelAsNoLongerNeeded(hash);
        }
    }

    if (assets.animDicts) {
        for (const dict of assets.animDicts) {
            RemoveAnimDict(dict);
        }
    }

    if (assets.textureDicts) {
        for (const dict of assets.textureDicts) {
            SetStreamedTextureDictAsNoLongerNeeded(dict);
        }
    }
}
