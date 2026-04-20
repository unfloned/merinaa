import type { DatabaseConfig } from '@merinaa/server';

/**
 * Database config — reads MySQL connection params from FiveM convars
 * (injected from .env via the docker setup).
 */
export function getDatabaseConfig(): DatabaseConfig {
    return {
        type: 'mysql',
        host: GetConvar('mysql_host', 'mysql'),
        port: parseInt(GetConvar('mysql_port', '3306'), 10),
        user: GetConvar('mysql_user', 'fivem'),
        password: GetConvar('mysql_password', 'fivem123'),
        database: GetConvar('mysql_database', 'fivem_framework'),
    };
}

export function getEnvironment(): 'production' | 'development' {
    return GetConvar('framework_env', 'development') === 'production'
        ? 'production'
        : 'development';
}
