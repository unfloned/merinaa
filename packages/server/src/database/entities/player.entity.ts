import { entity, PrimaryKey, AutoIncrement, MaxLength } from '@deepkit/type';
import { BaseUuidEntity } from './base.entity';

/**
 * Player money embedded type
 */
export class PlayerMoney {
    cash: number = 500;
    bank: number = 5000;
    crypto: number = 0;
}

/**
 * Job grade embedded type
 */
export class PlayerJobGrade {
    name: string = 'Unemployed';
    level: number = 0;
    payment: number = 0;
    isBoss: boolean = false;
}

/**
 * Player job embedded type
 */
export class PlayerJob {
    name: string = 'unemployed';
    label: string = 'Unemployed';
    gradeName: string = 'Unemployed';
    gradeLevel: number = 0;
    gradePayment: number = 0;
    onDuty: boolean = false;
    type?: string;
}

/**
 * Player gang embedded type
 */
export class PlayerGang {
    name: string = 'none';
    label: string = 'No Gang';
    gradeName: string = 'None';
    gradeLevel: number = 0;
    isBoss: boolean = false;
}

/**
 * Character info embedded type
 */
export class PlayerCharacterInfo {
    firstName: string = 'John';
    lastName: string = 'Doe';
    birthDate: string = '1990-01-01';
    gender: number = 0;
    nationality: string = 'American';
    phone: string = '';
    account: string = '';
}

/**
 * Player licenses embedded type
 */
export class PlayerLicenses {
    driver: boolean = false;
    weapon: boolean = false;
    business: boolean = false;
    hunting: boolean = false;
    fishing: boolean = false;
    pilot: boolean = false;
}

/**
 * Player metadata embedded type
 */
export class PlayerMetadataInfo {
    hunger: number = 100;
    thirst: number = 100;
    stress: number = 0;
    armor: number = 0;
    isDead: boolean = false;
    isHandcuffed: boolean = false;
    inJail: number = 0;
    licenseDriver: boolean = false;
    licenseWeapon: boolean = false;
    licenseBusiness: boolean = false;
    callsign?: string;
    fingerprint?: string;
}

/**
 * Player position embedded type
 */
export class PlayerPosition {
    x: number = 215.76;
    y: number = -810.12;
    z: number = 30.73;
    heading: number = 90.0;
}

/**
 * Player entity
 * Stores all persistent player data
 */
@entity.name('players')
export class Player extends BaseUuidEntity {
    /**
     * FiveM license identifier
     */
    license: string & MaxLength<255> = '';

    /**
     * Player display name
     */
    name: string & MaxLength<100> = '';

    /**
     * Active character slot (for multi-character support)
     */
    characterSlot: number = 0;

    // Money
    moneyCash: number = 500;
    moneyBank: number = 5000;
    moneyCrypto: number = 0;

    // Job
    jobName: string & MaxLength<50> = 'unemployed';
    jobLabel: string & MaxLength<100> = 'Unemployed';
    jobGradeName: string & MaxLength<100> = 'Unemployed';
    jobGradeLevel: number = 0;
    jobGradePayment: number = 0;
    jobOnDuty: boolean = false;
    jobType?: string & MaxLength<50>;

    // Gang
    gangName: string & MaxLength<50> = 'none';
    gangLabel: string & MaxLength<100> = 'No Gang';
    gangGradeName: string & MaxLength<100> = 'None';
    gangGradeLevel: number = 0;
    gangIsBoss: boolean = false;

    // Character Info
    charFirstName: string & MaxLength<50> = 'John';
    charLastName: string & MaxLength<50> = 'Doe';
    charBirthDate: string & MaxLength<10> = '1990-01-01';
    charGender: number = 0;
    charNationality: string & MaxLength<50> = 'American';
    charPhone: string & MaxLength<20> = '';
    charAccount: string & MaxLength<50> = '';

    // Metadata
    metaHunger: number = 100;
    metaThirst: number = 100;
    metaStress: number = 0;
    metaArmor: number = 0;
    metaIsDead: boolean = false;
    metaIsHandcuffed: boolean = false;
    metaInJail: number = 0;
    metaLicenseDriver: boolean = false;
    metaLicenseWeapon: boolean = false;
    metaLicenseBusiness: boolean = false;
    metaCallsign?: string & MaxLength<20>;
    metaFingerprint?: string & MaxLength<100>;

    // Position
    posX: number = 215.76;
    posY: number = -810.12;
    posZ: number = 30.73;
    posHeading: number = 90.0;

    /**
     * Last time player was online
     */
    lastSeen: Date = new Date();

    /**
     * Is player banned
     */
    isBanned: boolean = false;

    /**
     * Ban reason (if banned)
     */
    banReason?: string & MaxLength<500>;

    /**
     * Ban expiry date (null = permanent)
     */
    banExpiry?: Date;

    /**
     * Total playtime in seconds
     */
    playtime: number = 0;

    /**
     * Create a new player with license and name
     */
    static create(license: string, name: string): Player {
        const player = new Player();
        player.license = license;
        player.name = name;
        player.charFirstName = name.split(' ')[0] || 'John';
        player.charLastName = name.split(' ')[1] || 'Doe';
        return player;
    }

    /**
     * Get full character name
     */
    getFullName(): string {
        return `${this.charFirstName} ${this.charLastName}`;
    }

    /**
     * Check if player is banned (considering expiry)
     */
    checkBanned(): boolean {
        if (!this.isBanned) return false;
        if (this.banExpiry && this.banExpiry < new Date()) {
            this.isBanned = false;
            this.banReason = undefined;
            this.banExpiry = undefined;
            return false;
        }
        return true;
    }

    /**
     * Get money object
     */
    get money(): PlayerMoney {
        return {
            cash: this.moneyCash,
            bank: this.moneyBank,
            crypto: this.moneyCrypto,
        };
    }

    /**
     * Get job object
     */
    get job(): PlayerJob {
        return {
            name: this.jobName,
            label: this.jobLabel,
            gradeName: this.jobGradeName,
            gradeLevel: this.jobGradeLevel,
            gradePayment: this.jobGradePayment,
            onDuty: this.jobOnDuty,
            type: this.jobType,
        };
    }

    /**
     * Get gang object
     */
    get gang(): PlayerGang {
        return {
            name: this.gangName,
            label: this.gangLabel,
            gradeName: this.gangGradeName,
            gradeLevel: this.gangGradeLevel,
            isBoss: this.gangIsBoss,
        };
    }

    /**
     * Get character info object
     */
    get charInfo(): PlayerCharacterInfo {
        return {
            firstName: this.charFirstName,
            lastName: this.charLastName,
            birthDate: this.charBirthDate,
            gender: this.charGender,
            nationality: this.charNationality,
            phone: this.charPhone,
            account: this.charAccount,
        };
    }

    /**
     * Get metadata object
     */
    get metadata(): PlayerMetadataInfo {
        return {
            hunger: this.metaHunger,
            thirst: this.metaThirst,
            stress: this.metaStress,
            armor: this.metaArmor,
            isDead: this.metaIsDead,
            isHandcuffed: this.metaIsHandcuffed,
            inJail: this.metaInJail,
            licenseDriver: this.metaLicenseDriver,
            licenseWeapon: this.metaLicenseWeapon,
            licenseBusiness: this.metaLicenseBusiness,
            callsign: this.metaCallsign,
            fingerprint: this.metaFingerprint,
        };
    }

    /**
     * Get position object
     */
    get position(): PlayerPosition {
        return {
            x: this.posX,
            y: this.posY,
            z: this.posZ,
            heading: this.posHeading,
        };
    }

    /**
     * Add money to account
     */
    addMoney(type: keyof PlayerMoney, amount: number): boolean {
        if (amount < 0) return false;
        switch (type) {
            case 'cash':
                this.moneyCash += amount;
                break;
            case 'bank':
                this.moneyBank += amount;
                break;
            case 'crypto':
                this.moneyCrypto += amount;
                break;
        }
        this.touch();
        return true;
    }

    /**
     * Remove money from account
     */
    removeMoney(type: keyof PlayerMoney, amount: number): boolean {
        if (amount < 0) return false;
        const current = this.money[type];
        if (current < amount) return false;

        switch (type) {
            case 'cash':
                this.moneyCash -= amount;
                break;
            case 'bank':
                this.moneyBank -= amount;
                break;
            case 'crypto':
                this.moneyCrypto -= amount;
                break;
        }
        this.touch();
        return true;
    }

    /**
     * Transfer money between accounts
     */
    transferMoney(from: keyof PlayerMoney, to: keyof PlayerMoney, amount: number): boolean {
        if (!this.removeMoney(from, amount)) return false;
        this.addMoney(to, amount);
        return true;
    }
}
