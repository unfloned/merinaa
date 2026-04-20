import { Database, Query } from '@deepkit/orm';
import { BaseEntity, BaseUuidEntity } from '../entities/base.entity';

/**
 * Class type helper
 */
type ClassType<T = any> = new (...args: any[]) => T;

/**
 * Pagination options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Sort options
 */
export interface SortOptions<T> {
    field: keyof T;
    order: 'asc' | 'desc';
}

/**
 * Base repository class
 * Provides common CRUD operations for entities
 */
export abstract class BaseRepository<T extends BaseEntity | BaseUuidEntity> {
    protected readonly entityClass: ClassType<T>;

    constructor(
        protected readonly database: Database,
        entityClass: ClassType<T>
    ) {
        this.entityClass = entityClass;
    }

    /**
     * Get a fresh query builder
     */
    protected query(): Query<T> {
        return this.database.query(this.entityClass);
    }

    /**
     * Find entity by ID
     */
    async findById(id: number | string): Promise<T | undefined> {
        return this.query().filter({ id } as any).findOneOrUndefined();
    }

    /**
     * Find entity by ID or throw error
     */
    async findByIdOrFail(id: number | string): Promise<T> {
        const entity = await this.findById(id);
        if (!entity) {
            throw new Error(`${this.entityClass.name} with id ${id} not found`);
        }
        return entity;
    }

    /**
     * Find all entities
     */
    async findAll(): Promise<T[]> {
        return this.query().find();
    }

    /**
     * Find entities by filter
     */
    async findBy(filter: Partial<T>): Promise<T[]> {
        return this.query().filter(filter as any).find();
    }

    /**
     * Find one entity by filter
     */
    async findOneBy(filter: Partial<T>): Promise<T | undefined> {
        return this.query().filter(filter as any).findOneOrUndefined();
    }

    /**
     * Find one entity by filter or throw error
     */
    async findOneByOrFail(filter: Partial<T>): Promise<T> {
        const entity = await this.findOneBy(filter);
        if (!entity) {
            throw new Error(`${this.entityClass.name} not found`);
        }
        return entity;
    }

    /**
     * Count entities matching filter
     */
    async count(filter?: Partial<T>): Promise<number> {
        let query = this.query();
        if (filter) {
            query = query.filter(filter as any);
        }
        return query.count();
    }

    /**
     * Check if entity exists
     */
    async exists(filter: Partial<T>): Promise<boolean> {
        return (await this.count(filter)) > 0;
    }

    /**
     * Find with pagination
     */
    async findPaginated(
        options: PaginationOptions,
        filter?: Partial<T>,
        sort?: SortOptions<T>
    ): Promise<PaginatedResult<T>> {
        const { page, limit } = options;
        const skip = (page - 1) * limit;

        let query = this.query();

        if (filter) {
            query = query.filter(filter as any);
        }

        if (sort) {
            query = query.orderBy(sort.field as any, sort.order);
        }

        const [data, total] = await Promise.all([
            query.skip(skip).limit(limit).find(),
            this.count(filter),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    /**
     * Create and save new entity
     */
    async create(data: Partial<T>): Promise<T> {
        const entity = Object.assign(new this.entityClass(), data);
        await this.database.persist(entity);
        return entity;
    }

    /**
     * Save entity (insert or update)
     */
    async save(entity: T): Promise<T> {
        entity.updatedAt = new Date();
        await this.database.persist(entity);
        return entity;
    }

    /**
     * Save multiple entities
     */
    async saveMany(entities: T[]): Promise<T[]> {
        const now = new Date();
        for (const entity of entities) {
            entity.updatedAt = now;
        }
        await this.database.persist(...entities);
        return entities;
    }

    /**
     * Update entity by ID
     */
    async update(id: number | string, data: Partial<T>): Promise<T | undefined> {
        const entity = await this.findById(id);
        if (!entity) return undefined;

        Object.assign(entity, data);
        entity.updatedAt = new Date();
        await this.database.persist(entity);
        return entity;
    }

    /**
     * Update entities matching filter
     */
    async updateBy(filter: Partial<T>, data: Partial<T>): Promise<number> {
        const entities = await this.findBy(filter);
        const now = new Date();

        for (const entity of entities) {
            Object.assign(entity, data);
            entity.updatedAt = now;
        }

        await this.database.persist(...entities);
        return entities.length;
    }

    /**
     * Delete entity by ID
     */
    async delete(id: number | string): Promise<boolean> {
        const entity = await this.findById(id);
        if (!entity) return false;

        await this.database.remove(entity);
        return true;
    }

    /**
     * Delete entities matching filter
     */
    async deleteBy(filter: Partial<T>): Promise<number> {
        const entities = await this.findBy(filter);
        await this.database.remove(...entities);
        return entities.length;
    }

    /**
     * Soft delete entity (if supported)
     */
    async softDelete(id: number | string): Promise<boolean> {
        const entity = await this.findById(id) as any;
        if (!entity || !('deletedAt' in entity)) return false;

        entity.deletedAt = new Date();
        await this.database.persist(entity);
        return true;
    }

    /**
     * Restore soft-deleted entity
     */
    async restore(id: number | string): Promise<boolean> {
        const entity = await this.findById(id) as any;
        if (!entity || !('deletedAt' in entity)) return false;

        entity.deletedAt = null;
        await this.database.persist(entity);
        return true;
    }

    /**
     * Execute raw query
     */
    async raw<R = any>(sql: string, params?: any[]): Promise<R[]> {
        return this.database.raw<R>(sql, params).find();
    }

    /**
     * Begin transaction
     */
    async transaction<R>(callback: () => Promise<R>): Promise<R> {
        return this.database.transaction(callback);
    }
}
