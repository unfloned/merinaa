/**
 * Database configuration interface
 */
export interface DatabaseConfig {
    /**
     * Database type: 'mysql' | 'postgres' | 'sqlite'
     */
    type: 'mysql' | 'postgres' | 'sqlite';

    /**
     * Database host
     */
    host: string;

    /**
     * Database port
     */
    port: number;

    /**
     * Database name
     */
    database: string;

    /**
     * Database user
     */
    user: string;

    /**
     * Database password
     */
    password: string;

    /**
     * Connection pool size
     * @default 10
     */
    poolSize?: number;

    /**
     * Enable query logging
     * @default false
     */
    logging?: boolean;

    /**
     * Auto run migrations on startup
     * @default false
     */
    autoMigrate?: boolean;

    /**
     * SSL configuration
     */
    ssl?: {
        enabled: boolean;
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
    };
}

/**
 * Default database configuration
 */
export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'fivem_framework',
    user: 'root',
    password: '',
    poolSize: 10,
    logging: false,
    autoMigrate: false,
};

/**
 * Database configuration token for DI
 */
export const DATABASE_CONFIG_TOKEN = Symbol('DATABASE_CONFIG');
