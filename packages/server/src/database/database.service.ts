import { Database } from '@deepkit/orm';
import { MySQLDatabaseAdapter } from '@deepkit/mysql';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { Injectable } from '@merinaa/core';
import { LoggerService } from '../services/logger.service';
import { DatabaseConfig, DEFAULT_DATABASE_CONFIG } from './config/database.config';
import { Player } from './entities/player.entity';

/**
 * Framework-level entities. All other entities are registered via @Module({ entities: [...] })
 */
const LEGACY_ENTITIES = [
    Player,
];

/**
 * Database service
 * Manages database connections and provides the Deepkit Database instance
 */
@Injectable()
export class DatabaseService {
    private database: Database | null = null;
    private config: DatabaseConfig;
    private connected: boolean = false;
    private logger: LoggerService;

    constructor() {
        this.config = DEFAULT_DATABASE_CONFIG;
        // Create logger directly since esbuild doesn't support emitDecoratorMetadata
        this.logger = new LoggerService();
    }

    /**
     * Configure the database connection
     */
    configure(config: Partial<DatabaseConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Connect to the database
     * @param additionalEntities - Entities collected from modules via @Module({ entities: [...] })
     */
    async connect(additionalEntities: any[] = []): Promise<void> {
        if (this.connected) {
            this.logger.warn('DatabaseService', 'Already connected to database');
            return;
        }

        try {
            // Merge legacy entities with module-provided entities, deduplicate
            const allEntities = [...LEGACY_ENTITIES];
            for (const entity of additionalEntities) {
                if (!allEntities.includes(entity)) {
                    allEntities.push(entity);
                }
            }

            if (additionalEntities.length > 0) {
                this.logger.log('DatabaseService',
                    `Registering ${LEGACY_ENTITIES.length} legacy + ${additionalEntities.length} module entities (${allEntities.length} total)`
                );
            }

            const adapter = this.createAdapter();
            this.database = new Database(adapter, allEntities);

            // Note: Skipping raw query test - Deepkit raw queries have compatibility issues in FiveM
            // Connection will be tested on first actual query
            this.connected = true;
            this.logger.log(
                'DatabaseService',
                `Connected to ${this.config.type}://${this.config.host}:${this.config.port}/${this.config.database}`
            );

            // NOTE: Migration is now handled in DatabaseModule.onModuleInit()
            // This ensures migrations run before any other module starts
        } catch (error) {
            console.error('[Framework] [ERROR] [DatabaseService] Failed to connect:', error);
            throw error;
        }
    }

    /**
     * Disconnect from the database
     */
    async disconnect(): Promise<void> {
        if (this.database) {
            await this.database.disconnect();
            this.database = null;
            this.connected = false;
            this.logger.log('DatabaseService', 'Disconnected from database');
        }
    }

    /**
     * Get the Deepkit Database instance
     */
    getDatabase(): Database {
        if (!this.database) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.database;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Run database migrations
     */
    async migrate(): Promise<void> {
        if (!this.database) {
            throw new Error('Database not connected');
        }

        this.logger.log('DatabaseService', 'Running migrations...');

        try {
            // Log entity count for debugging
            const entityCount = this.database ? (this.database as any).entities?.length ?? '?' : '?';
            this.logger.log('DatabaseService', `Migrating ${entityCount} entities...`);

            // Sync schema with timeout protection
            const migrationPromise = this.database.migrate();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Migration timeout after 60s')), 60000)
            );

            await Promise.race([migrationPromise, timeoutPromise]);

            this.logger.log('DatabaseService', 'Migrations completed successfully');
        } catch (error) {
            this.logger.error('DatabaseService', `Migration failed: ${error}`);
            // Log full error stack
            if (error instanceof Error) {
                console.error('[DatabaseService] Migration error stack:', error.stack);
            }
            throw error;
        }
    }

    /**
     * Create database adapter based on config
     */
    private createAdapter(): MySQLDatabaseAdapter | PostgresDatabaseAdapter {
        const { type, host, port, database, user, password, poolSize, ssl } = this.config;

        switch (type) {
            case 'mysql':
                return new MySQLDatabaseAdapter({
                    host,
                    port,
                    database,
                    user,
                    password,
                    connectionLimit: poolSize,
                    ssl: ssl?.enabled
                        ? {
                              rejectUnauthorized: ssl.rejectUnauthorized,
                              ca: ssl.ca,
                              cert: ssl.cert,
                              key: ssl.key,
                          }
                        : undefined,
                });

            case 'postgres':
                return new PostgresDatabaseAdapter({
                    host,
                    port,
                    database,
                    user,
                    password,
                    max: poolSize,
                    ssl: ssl?.enabled
                        ? {
                              rejectUnauthorized: ssl.rejectUnauthorized,
                              ca: ssl.ca,
                              cert: ssl.cert,
                              key: ssl.key,
                          }
                        : undefined,
                });

            case 'sqlite':
                throw new Error('SQLite adapter not implemented. Use mysql or postgres.');

            default:
                throw new Error(`Unknown database type: ${type}`);
        }
    }

    /**
     * Execute a raw SQL query
     */
    async raw<T = any>(sql: string, params?: any[]): Promise<T[]> {
        if (!this.database) {
            throw new Error('Database not connected');
        }
        return this.database.raw<T>(sql, params).find();
    }

    /**
     * Begin a transaction
     */
    async transaction<T>(callback: () => Promise<T>): Promise<T> {
        if (!this.database) {
            throw new Error('Database not connected');
        }
        return this.database.transaction(callback);
    }

    /**
     * Get database statistics
     */
    async getStats(): Promise<{ poolSize: number; activeConnections: number }> {
        // This would depend on the adapter implementation
        return {
            poolSize: this.config.poolSize || 10,
            activeConnections: 0, // Would need adapter-specific implementation
        };
    }
}
