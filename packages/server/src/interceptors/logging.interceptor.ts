import { Injectable } from '@merinaa/core';
import type { Interceptor, ExecutionContext, CallHandler } from '@merinaa/core';
import { LoggerService } from '../services/logger.service';

/**
 * Interceptor that logs all event handlers
 */
@Injectable()
export class LoggingInterceptor implements Interceptor {
    constructor(private logger: LoggerService) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
        const start = Date.now();
        const event = context.event;
        const source = context.source;
        const handler = context.getHandler();

        this.logger.debug(
            'Interceptor',
            `[${source}] → ${event} (${handler})`
        );

        try {
            const result = await next.handle();
            const duration = Date.now() - start;

            this.logger.debug(
                'Interceptor',
                `[${source}] ← ${event} (${duration}ms)`
            );

            return result;
        } catch (error) {
            const duration = Date.now() - start;

            this.logger.error(
                'Interceptor',
                `[${source}] ✗ ${event} (${duration}ms)`,
                error
            );

            throw error;
        }
    }
}

/**
 * Interceptor that measures execution time
 */
@Injectable()
export class TimingInterceptor implements Interceptor {
    private thresholdMs: number;

    constructor(thresholdMs: number = 100) {
        this.thresholdMs = thresholdMs;
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
        const start = Date.now();

        const result = await next.handle();

        const duration = Date.now() - start;
        if (duration > this.thresholdMs) {
            console.warn(
                `[Timing] Slow handler: ${context.event} took ${duration}ms (threshold: ${this.thresholdMs}ms)`
            );
        }

        return result;
    }
}

/**
 * Interceptor that transforms response
 */
@Injectable()
export class TransformInterceptor<T = any> implements Interceptor<T, { data: T; timestamp: number }> {
    async intercept(
        context: ExecutionContext,
        next: CallHandler<T>
    ): Promise<{ data: T; timestamp: number }> {
        const data = await next.handle();

        return {
            data,
            timestamp: Date.now(),
        };
    }
}

/**
 * Interceptor that caches results
 */
@Injectable()
export class CacheInterceptor implements Interceptor {
    private cache = new Map<string, { data: any; expiry: number }>();
    private ttlMs: number;

    constructor(ttlMs: number = 5000) {
        this.ttlMs = ttlMs;
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
        const key = `${context.event}:${JSON.stringify(context.args)}`;
        const cached = this.cache.get(key);

        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }

        const result = await next.handle();

        this.cache.set(key, {
            data: result,
            expiry: Date.now() + this.ttlMs,
        });

        return result;
    }

    /**
     * Clear the cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Remove expired entries
     */
    prune(): void {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (value.expiry <= now) {
                this.cache.delete(key);
            }
        }
    }
}
