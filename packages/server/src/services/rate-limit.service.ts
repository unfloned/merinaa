import { Injectable } from '@merinaa/core';
import { LoggerService } from './logger.service';
import { ConfigService } from './config.service';

export interface RateLimitConfig {
    /** Default window in milliseconds */
    windowMs: number;
    /** Default max calls per window per source */
    max: number;
    /** Per-event overrides */
    events?: Record<string, { windowMs: number; max: number }>;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 1000,
    max: 20,
};

interface Bucket {
    count: number;
    resetAt: number;
}

/**
 * Simple token-bucket rate limiter for `@OnClient` events.
 *
 * Config is read from `framework.config.yaml` under the `rateLimit.*` key,
 * or `app.framework.rateLimit` in `merinaa.config.ts`. Callers that exceed
 * the limit for a given event are rejected before the handler runs.
 *
 * ```yaml
 * # framework.config.yaml
 * rateLimit:
 *     windowMs: 1000       # default window
 *     max: 20              # default max calls per window per source
 *     events:
 *         bank:deposit:
 *             windowMs: 5000
 *             max: 3       # tighter limit for money-moving events
 *         admin:kick:
 *             windowMs: 1000
 *             max: 1
 * ```
 */
@Injectable()
export class RateLimitService {
    private buckets = new Map<string, Bucket>();
    private config: RateLimitConfig;

    constructor(private logger: LoggerService, configService: ConfigService) {
        const raw = configService.getSection('rateLimit') as Partial<RateLimitConfig> | null;
        this.config = {
            windowMs: raw?.windowMs ?? DEFAULT_CONFIG.windowMs,
            max: raw?.max ?? DEFAULT_CONFIG.max,
            events: raw?.events ?? {},
        };

        if (raw) {
            this.logger.info('RateLimit', `Enabled — default ${this.config.max} calls per ${this.config.windowMs}ms`);
        }
    }

    /**
     * Returns true if the call is allowed, false if the source is throttled.
     * Increments the bucket on a successful check.
     */
    check(event: string, source: number | string): boolean {
        const now = Date.now();
        const key = `${event}:${source}`;
        const opts = this.config.events?.[event] ?? { windowMs: this.config.windowMs, max: this.config.max };

        let bucket = this.buckets.get(key);
        if (!bucket || now >= bucket.resetAt) {
            bucket = { count: 0, resetAt: now + opts.windowMs };
            this.buckets.set(key, bucket);
        }

        if (bucket.count >= opts.max) {
            this.logger.warn('RateLimit', `'${event}' from '${source}' throttled (${bucket.count}/${opts.max} in ${opts.windowMs}ms)`);
            return false;
        }

        bucket.count++;
        return true;
    }

    /** Clear all buckets (for tests). */
    reset(): void {
        this.buckets.clear();
    }

    /** Periodic cleanup — drops expired buckets to cap memory. */
    gc(): void {
        const now = Date.now();
        for (const [key, bucket] of this.buckets) {
            if (now >= bucket.resetAt) this.buckets.delete(key);
        }
    }
}
