/**
 * Native function wrappers and utilities
 */

/**
 * Draw 3D text in the world
 */
export function draw3DText(
    x: number,
    y: number,
    z: number,
    text: string,
    scale: number = 0.35,
    font: number = 4
): void {
    const [onScreen, screenX, screenY] = World3dToScreen2d(x, y, z);

    if (!onScreen) return;

    SetTextScale(scale, scale);
    SetTextFont(font);
    SetTextColour(255, 255, 255, 215);
    SetTextEntry('STRING');
    SetTextCentre(true);
    AddTextComponentString(text);
    DrawText(screenX, screenY);
}

/**
 * Draw text on screen
 */
export function drawText(
    x: number,
    y: number,
    text: string,
    scale: number = 0.35,
    font: number = 4,
    color: [number, number, number, number] = [255, 255, 255, 255]
): void {
    SetTextFont(font);
    SetTextScale(scale, scale);
    SetTextColour(color[0], color[1], color[2], color[3]);
    SetTextEntry('STRING');
    AddTextComponentString(text);
    DrawText(x, y);
}

/**
 * Draw rectangle on screen
 */
export function drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: [number, number, number, number] = [0, 0, 0, 150]
): void {
    DrawRect(x, y, width, height, color[0], color[1], color[2], color[3]);
}

/**
 * Get closest entity of type
 */
export function getClosestEntity<T extends 'vehicle' | 'ped' | 'object'>(
    type: T,
    coords?: { x: number; y: number; z: number },
    maxDistance: number = 10.0
): number | null {
    const ped = PlayerPedId();
    const pos = coords || (() => {
        const [x, y, z] = GetEntityCoords(ped, true);
        return { x, y, z };
    })();

    let closestEntity: number | null = null;
    let closestDistance = maxDistance;

    let handle: number;
    let entity: number;

    // FiveM natives return [handle, entity] tuple
    // The natives need a dummy variable to store the entity reference
    let dummyEntity = 0;
    switch (type) {
        case 'vehicle':
            [handle, entity] = FindFirstVehicle(dummyEntity) as unknown as [number, number];
            break;
        case 'ped':
            [handle, entity] = FindFirstPed(dummyEntity) as unknown as [number, number];
            break;
        case 'object':
            [handle, entity] = FindFirstObject(dummyEntity) as unknown as [number, number];
            break;
        default:
            return null;
    }

    do {
        if (entity && DoesEntityExist(entity)) {
            const [ex, ey, ez] = GetEntityCoords(entity, true);
            const distance = Math.sqrt(
                Math.pow(pos.x - ex, 2) +
                Math.pow(pos.y - ey, 2) +
                Math.pow(pos.z - ez, 2)
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestEntity = entity;
            }
        }

        let found: boolean;
        switch (type) {
            case 'vehicle':
                [found, entity] = FindNextVehicle(handle) as [boolean, number];
                break;
            case 'ped':
                [found, entity] = FindNextPed(handle) as [boolean, number];
                break;
            case 'object':
                [found, entity] = FindNextObject(handle) as [boolean, number];
                break;
            default:
                found = false;
        }

        if (!found) break;
    } while (true);

    EndFindVehicle(handle);

    return closestEntity;
}

/**
 * Get all players in range
 */
export function getPlayersInRange(
    coords: { x: number; y: number; z: number },
    range: number
): number[] {
    const players: number[] = [];
    const activePlayers = GetActivePlayers();

    for (const playerId of activePlayers) {
        const ped = GetPlayerPed(playerId);
        const [px, py, pz] = GetEntityCoords(ped, true);

        const distance = Math.sqrt(
            Math.pow(coords.x - px, 2) +
            Math.pow(coords.y - py, 2) +
            Math.pow(coords.z - pz, 2)
        );

        if (distance <= range) {
            players.push(playerId);
        }
    }

    return players;
}

/**
 * Raycast from camera
 */
export function raycastFromCamera(
    maxDistance: number = 100.0,
    flags: number = -1
): { hit: boolean; coords: { x: number; y: number; z: number }; entity: number } | null {
    const camCoords = GetGameplayCamCoord();
    const camRot = GetGameplayCamRot(2);

    const direction = rotationToDirection(camRot[0], camRot[1], camRot[2]);

    const endCoords = {
        x: camCoords[0] + direction.x * maxDistance,
        y: camCoords[1] + direction.y * maxDistance,
        z: camCoords[2] + direction.z * maxDistance,
    };

    const ray = StartShapeTestRay(
        camCoords[0], camCoords[1], camCoords[2],
        endCoords.x, endCoords.y, endCoords.z,
        flags,
        PlayerPedId(),
        0
    );

    const [, hit, hitCoords, , entity] = GetShapeTestResult(ray);

    if (hit) {
        return {
            hit: true,
            coords: { x: hitCoords[0], y: hitCoords[1], z: hitCoords[2] },
            entity,
        };
    }

    return null;
}

/**
 * Convert rotation to direction vector
 */
function rotationToDirection(pitch: number, roll: number, yaw: number): { x: number; y: number; z: number } {
    const rPitch = pitch * (Math.PI / 180);
    const rYaw = yaw * (Math.PI / 180);

    return {
        x: -Math.sin(rYaw) * Math.abs(Math.cos(rPitch)),
        y: Math.cos(rYaw) * Math.abs(Math.cos(rPitch)),
        z: Math.sin(rPitch),
    };
}
