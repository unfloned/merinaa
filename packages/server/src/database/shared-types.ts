/**
 * Shared types used across multiple modules.
 * These live in the framework because they're domain-neutral.
 */

/**
 * 3D coordinates
 */
export interface Coordinates {
    x: number;
    y: number;
    z: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
