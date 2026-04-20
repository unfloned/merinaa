import type { Vector3, Vector4, PlayerData } from '@merinaa/core';

/**
 * Local player service for client-side player management
 */
export class LocalPlayerService {
    private static instance: LocalPlayerService;
    private playerData: PlayerData | null = null;

    private constructor() {
        // Listen for player data updates
        onNet('framework:player:data', (data: PlayerData) => {
            this.playerData = data;
            emit('framework:player:updated', data);
        });

        onNet('framework:player:update', (key: string, value: any) => {
            if (this.playerData) {
                this.setNestedValue(this.playerData, key, value);
                emit('framework:player:updated', this.playerData);
            }
        });
    }

    /**
     * Get the service instance
     */
    static getInstance(): LocalPlayerService {
        if (!LocalPlayerService.instance) {
            LocalPlayerService.instance = new LocalPlayerService();
        }
        return LocalPlayerService.instance;
    }

    /**
     * Get player data
     */
    getData(): PlayerData | null {
        return this.playerData;
    }

    /**
     * Check if player is loaded
     */
    isLoaded(): boolean {
        return this.playerData !== null;
    }

    /**
     * Get player ped
     */
    getPed(): number {
        return PlayerPedId();
    }

    /**
     * Get player ID
     */
    getPlayerId(): number {
        return PlayerId();
    }

    /**
     * Get player server ID
     */
    getServerId(): number {
        return GetPlayerServerId(this.getPlayerId());
    }

    /**
     * Get player position
     */
    getPosition(): Vector3 {
        const ped = this.getPed();
        const [x, y, z] = GetEntityCoords(ped, true);
        return { x, y, z };
    }

    /**
     * Get player position with heading
     */
    getPositionWithHeading(): Vector4 {
        const ped = this.getPed();
        const [x, y, z] = GetEntityCoords(ped, true);
        const heading = GetEntityHeading(ped);
        return { x, y, z, heading };
    }

    /**
     * Get player heading
     */
    getHeading(): number {
        return GetEntityHeading(this.getPed());
    }

    /**
     * Set player position
     */
    setPosition(pos: Vector3 | Vector4): void {
        const ped = this.getPed();
        SetEntityCoords(ped, pos.x, pos.y, pos.z, false, false, false, false);

        if ('heading' in pos) {
            SetEntityHeading(ped, pos.heading);
        }
    }

    /**
     * Get player health
     */
    getHealth(): number {
        return GetEntityHealth(this.getPed());
    }

    /**
     * Set player health
     */
    setHealth(health: number): void {
        SetEntityHealth(this.getPed(), health);
    }

    /**
     * Get player armor
     */
    getArmor(): number {
        return GetPedArmour(this.getPed());
    }

    /**
     * Set player armor
     */
    setArmor(armor: number): void {
        SetPedArmour(this.getPed(), armor);
    }

    /**
     * Check if player is in vehicle
     */
    isInVehicle(): boolean {
        return IsPedInAnyVehicle(this.getPed(), false);
    }

    /**
     * Get current vehicle
     */
    getCurrentVehicle(): number | null {
        const ped = this.getPed();
        if (!IsPedInAnyVehicle(ped, false)) return null;
        return GetVehiclePedIsIn(ped, false);
    }

    /**
     * Check if player is dead
     */
    isDead(): boolean {
        return IsEntityDead(this.getPed());
    }

    /**
     * Freeze player
     */
    freeze(frozen: boolean): void {
        FreezeEntityPosition(this.getPed(), frozen);
    }

    /**
     * Set player visibility
     */
    setVisible(visible: boolean): void {
        SetEntityVisible(this.getPed(), visible, false);
    }

    /**
     * Set player invincibility
     */
    setInvincible(invincible: boolean): void {
        SetEntityInvincible(this.getPed(), invincible);
    }

    /**
     * Helper to set nested value
     */
    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
    }
}

// Export singleton getter
export function getLocalPlayer(): LocalPlayerService {
    return LocalPlayerService.getInstance();
}
