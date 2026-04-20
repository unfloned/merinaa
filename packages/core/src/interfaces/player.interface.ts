/**
 * Money structure
 */
export interface Money {
    cash: number;
    bank: number;
    crypto: number;
}

/**
 * Job grade structure
 */
export interface JobGrade {
    name: string;
    level: number;
    payment: number;
    isBoss?: boolean;
}

/**
 * Job structure
 */
export interface Job {
    name: string;
    label: string;
    grade: JobGrade;
    onDuty: boolean;
    type?: string;
}

/**
 * Gang structure
 */
export interface Gang {
    name: string;
    label: string;
    grade: {
        name: string;
        level: number;
    };
    isBoss?: boolean;
}

/**
 * Character info
 */
export interface CharacterInfo {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: number;
    nationality: string;
    phone: string;
    account: string;
}

/**
 * Player licenses
 */
export interface Licenses {
    driver: boolean;
    weapon: boolean;
    business: boolean;
    hunting?: boolean;
    fishing?: boolean;
    pilot?: boolean;
}

/**
 * Player metadata
 */
export interface PlayerMetadata {
    hunger: number;
    thirst: number;
    stress: number;
    armor: number;
    isDead: boolean;
    isHandcuffed: boolean;
    inJail: number;
    licenses: Licenses;
    callsign?: string;
    fingerprint?: string;
    [key: string]: any;
}

/**
 * Position with heading
 */
export interface Vector4 {
    x: number;
    y: number;
    z: number;
    heading: number;
}

/**
 * Position without heading
 */
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Complete player data structure
 */
export interface PlayerData {
    id: string;
    visually: string;
    visually2?: string;
    license: string;
    name: string;
    money: Money;
    job: Job;
    gang: Gang;
    charInfo: CharacterInfo;
    metadata: PlayerMetadata;
    position: Vector4;
    inventory?: InventoryItem[];
    createdAt?: Date;
    updatedAt?: Date;
    lastSeen?: Date;
}

/**
 * Inventory item
 */
export interface InventoryItem {
    name: string;
    label: string;
    amount: number;
    slot: number;
    weight: number;
    info?: Record<string, any>;
    unique?: boolean;
    useable?: boolean;
}

/**
 * Player state (runtime)
 */
export interface IPlayerState {
    readonly source: number;
    readonly data: PlayerData;

    // Money
    getMoney(type: keyof Money): number;
    addMoney(type: keyof Money, amount: number, reason?: string): boolean;
    removeMoney(type: keyof Money, amount: number, reason?: string): boolean;
    setMoney(type: keyof Money, amount: number): void;

    // Job
    getJob(): Job;
    setJob(name: string, grade: number): Promise<void>;
    isJobType(type: string): boolean;

    // Gang
    getGang(): Gang;
    setGang(name: string, grade: number): Promise<void>;

    // Metadata
    getMetadata<K extends keyof PlayerMetadata>(key: K): PlayerMetadata[K];
    setMetadata<K extends keyof PlayerMetadata>(key: K, value: PlayerMetadata[K]): void;

    // Position
    getPosition(): Vector4;
    setPosition(pos: Vector3 | Vector4): void;
    teleport(pos: Vector3 | Vector4): void;

    // State
    save(): Promise<void>;
    kick(reason: string): void;
    notify(message: string, type?: 'success' | 'error' | 'info' | 'warning'): void;

    // Sync
    syncToClient(key?: string): void;
}
