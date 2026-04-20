import { Injectable } from '@merinaa/core';
import type { IConfig } from '@merinaa/core';

/**
 * Configuration service for application settings.
 *
 * Flat dot-path store (e.g. `"testing.discord.enabled"` → `true`).
 * Sources, precedence (later wins):
 *   1. Framework defaults (server.*, framework.*, database.* from Convars)
 *   2. Module defaults (via `@Module({ config })` — merged on module load)
 *   3. Root `framework.config.ts` (team-shared defaults)
 *   4. `app.configure({...})` at bootstrap (explicit overrides)
 */
@Injectable()
export class ConfigService implements IConfig {
    private config = new Map<string, any>();

    constructor() {
        this.loadDefaults();
    }

    /**
     * Load framework-core defaults from FiveM Convars.
     * Called once in the constructor. Idempotent — can be re-called if Convars change.
     */
    loadDefaults(): void {
        // Server defaults
        this.set('server.name', GetConvar('sv_hostname', 'FiveM Server'));
        this.set('server.maxPlayers', GetConvarInt('sv_maxclients', 32));

        // Framework defaults
        this.set('framework.debug', GetConvar('framework_debug', 'false') === 'true');
        this.set('framework.locale', GetConvar('framework_locale', 'en'));
        this.set('framework.env', GetConvar('framework_env', 'development'));

        // Database defaults
        this.set('database.connectionString', GetConvar('mysql_connection_string', ''));
    }

    /**
     * Get a configuration value
     */
    get<T = any>(key: string): T | undefined;
    get<T = any>(key: string, defaultValue: T): T;
    get<T = any>(key: string, defaultValue?: T): T | undefined {
        const value = this.config.get(key);
        if (value === undefined) {
            return defaultValue;
        }
        return value as T;
    }

    /**
     * Check if a configuration key exists
     */
    has(key: string): boolean {
        return this.config.has(key);
    }

    /**
     * Set a configuration value (overwrites existing)
     */
    set(key: string, value: any): void {
        this.config.set(key, value);
    }

    /**
     * Get all configuration as a nested object
     */
    getAll(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, value] of this.config) {
            this.setNestedValue(result, key, value);
        }
        return result;
    }

    /**
     * Get a specific namespace as a typed object.
     * Returns `undefined` if nothing is set under that prefix.
     *
     * @example
     * const bank = config.getSection<{ interestRate: number }>('bank');
     */
    getSection<T = Record<string, any>>(namespace: string): T | undefined {
        const prefix = namespace + '.';
        const result: Record<string, any> = {};
        let found = false;
        for (const [key, value] of this.config) {
            if (key === namespace) {
                // Exact key set — return value directly
                return value as T;
            }
            if (key.startsWith(prefix)) {
                found = true;
                this.setNestedValue(result, key.slice(prefix.length), value);
            }
        }
        return found ? (result as T) : undefined;
    }

    /**
     * Load configuration from a nested object. Flattens to dot-paths.
     *
     * **Overwrite semantics.** Existing keys ARE replaced. Use `merge()` if you
     * want existing values to win (module defaults merged with root overrides).
     */
    load(config: Record<string, any>, prefix = ''): void {
        for (const [key, value] of Object.entries(config)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (this.isPlainObject(value)) {
                this.load(value, fullKey);
            } else {
                this.set(fullKey, value);
            }
        }
    }

    /**
     * Merge a nested config object. Existing keys are kept, only missing keys
     * get the default. Used by ModuleLoader so root `framework.config.ts`
     * overrides module defaults.
     */
    merge(config: Record<string, any>, prefix = ''): void {
        for (const [key, value] of Object.entries(config)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (this.isPlainObject(value)) {
                this.merge(value, fullKey);
            } else if (!this.config.has(fullKey)) {
                this.set(fullKey, value);
            }
        }
    }

    /**
     * Set nested value in an object (for `getAll`/`getSection`).
     */
    private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || !this.isPlainObject(current[key])) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    private isPlainObject(v: any): v is Record<string, any> {
        return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date);
    }

    /**
     * Get environment variable (FiveM Convar) with fallback.
     * FiveM-runtime only — in tests/node this falls back to defaultValue.
     */
    getEnv(name: string, defaultValue?: string): string | undefined {
        if (typeof (globalThis as any).GetConvar !== 'function') return defaultValue;
        return GetConvar(name, defaultValue || '') || defaultValue;
    }

    /**
     * Get environment variable as integer (FiveM Convar).
     */
    getEnvInt(name: string, defaultValue: number = 0): number {
        if (typeof (globalThis as any).GetConvarInt !== 'function') return defaultValue;
        return GetConvarInt(name, defaultValue);
    }

    /**
     * Get environment variable as boolean (FiveM Convar).
     */
    getEnvBool(name: string, defaultValue: boolean = false): boolean {
        if (typeof (globalThis as any).GetConvar !== 'function') return defaultValue;
        const value = GetConvar(name, '');
        if (!value) return defaultValue;
        return value.toLowerCase() === 'true' || value === '1';
    }
}
