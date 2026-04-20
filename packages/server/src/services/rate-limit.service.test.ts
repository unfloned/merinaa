import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimitService } from './rate-limit.service';
import { LoggerService } from './logger.service';
import { ConfigService } from './config.service';

function makeService(config: Record<string, any> = {}): RateLimitService {
    const cfg = new ConfigService();
    cfg.load(config);
    const logger = new LoggerService();
    return new RateLimitService(logger, cfg);
}

describe('RateLimitService', () => {
    let rl: RateLimitService;

    beforeEach(() => {
        rl = makeService({ rateLimit: { windowMs: 1000, max: 3 } });
    });

    it('allows calls under the default limit', () => {
        expect(rl.check('event', 1)).toBe(true);
        expect(rl.check('event', 1)).toBe(true);
        expect(rl.check('event', 1)).toBe(true);
    });

    it('rejects calls above the limit', () => {
        rl.check('event', 1);
        rl.check('event', 1);
        rl.check('event', 1);
        expect(rl.check('event', 1)).toBe(false);
    });

    it('tracks each source independently', () => {
        rl.check('event', 1);
        rl.check('event', 1);
        rl.check('event', 1);

        expect(rl.check('event', 2)).toBe(true); // fresh bucket for source 2
    });

    it('honours per-event overrides', () => {
        const svc = makeService({
            rateLimit: {
                windowMs: 1000,
                max: 10,
                events: {
                    'bank:deposit': { windowMs: 1000, max: 1 },
                },
            },
        });

        expect(svc.check('bank:deposit', 1)).toBe(true);
        expect(svc.check('bank:deposit', 1)).toBe(false);
        expect(svc.check('bank:withdraw', 1)).toBe(true); // uses default max:10
    });

    it('has no effect when no rateLimit config is provided', () => {
        const svc = makeService({});
        // Default config still applies (20 per 1000ms), so 5 calls all pass.
        for (let i = 0; i < 5; i++) {
            expect(svc.check('anything', 1)).toBe(true);
        }
    });

    it('reset() clears all buckets', () => {
        rl.check('event', 1);
        rl.check('event', 1);
        rl.check('event', 1);
        rl.reset();
        expect(rl.check('event', 1)).toBe(true);
    });
});
