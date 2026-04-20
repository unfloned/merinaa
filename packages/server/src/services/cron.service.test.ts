import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CronService } from './cron.service';
import { LoggerService } from './logger.service';

describe('CronService', () => {
    let cronService: CronService;
    let logger: LoggerService;

    beforeEach(() => {
        vi.useFakeTimers();
        logger = new LoggerService();
        cronService = new CronService(logger);
    });

    afterEach(() => {
        cronService.destroyAll();
        vi.useRealTimers();
    });

    describe('interval jobs', () => {
        it('registers and executes an interval job', async () => {
            const callback = vi.fn();
            cronService.register('test-job', { interval: 1000 }, callback);

            expect(cronService.hasJob('test-job')).toBe(true);
            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1000);
            await vi.advanceTimersByTimeAsync(0); // flush microtasks
            expect(callback).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(1000);
            await vi.advanceTimersByTimeAsync(0);
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('prevents duplicate job registration', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();

            cronService.register('dup', { interval: 1000 }, cb1);
            cronService.register('dup', { interval: 1000 }, cb2);

            vi.advanceTimersByTime(1000);
            expect(cb1).toHaveBeenCalledTimes(1);
            expect(cb2).not.toHaveBeenCalled();
        });

        it('stops a specific job', () => {
            const callback = vi.fn();
            cronService.register('stoppable', { interval: 500 }, callback);

            vi.advanceTimersByTime(500);
            expect(callback).toHaveBeenCalledTimes(1);

            expect(cronService.stop('stoppable')).toBe(true);
            vi.advanceTimersByTime(2000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('returns false when stopping non-existent job', () => {
            expect(cronService.stop('nope')).toBe(false);
        });

        it('prevents overlapping executions', async () => {
            vi.useRealTimers();

            const realLogger = new LoggerService();
            const realCron = new CronService(realLogger);

            let running = 0;
            let maxConcurrent = 0;

            const callback = vi.fn(async () => {
                running++;
                maxConcurrent = Math.max(maxConcurrent, running);
                await new Promise(r => setTimeout(r, 50));
                running--;
            });

            realCron.register('overlap-test', { interval: 10 }, callback);

            await new Promise(r => setTimeout(r, 150));
            realCron.destroyAll();

            expect(maxConcurrent).toBe(1);
        });

        it('getJobNames returns all registered jobs', () => {
            cronService.register('a', { interval: 1000 }, () => {});
            cronService.register('b', { interval: 2000 }, () => {});

            const names = cronService.getJobNames();
            expect(names).toContain('a');
            expect(names).toContain('b');
            expect(names).toHaveLength(2);
        });

        it('destroyAll clears all jobs', () => {
            cronService.register('x', { interval: 1000 }, () => {});
            cronService.register('y', { interval: 2000 }, () => {});

            cronService.destroyAll();
            expect(cronService.getJobNames()).toHaveLength(0);
        });
    });

    describe('simple cron expression fallback', () => {
        it('parses */N seconds pattern (6-part)', async () => {
            const callback = vi.fn();
            cronService.register('every-5s', '*/5 * * * * *', callback);

            expect(cronService.hasJob('every-5s')).toBe(true);

            vi.advanceTimersByTime(5000);
            await vi.advanceTimersByTimeAsync(0);
            expect(callback).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(5000);
            await vi.advanceTimersByTimeAsync(0);
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('parses 0 */N * * * * minutes pattern (6-part)', () => {
            const callback = vi.fn();
            cronService.register('every-15m', '0 */15 * * * *', callback);

            expect(cronService.hasJob('every-15m')).toBe(true);

            vi.advanceTimersByTime(15 * 60_000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('parses */N * * * * minutes pattern (5-part)', () => {
            const callback = vi.fn();
            cronService.register('every-10m', '*/10 * * * *', callback);

            expect(cronService.hasJob('every-10m')).toBe(true);

            vi.advanceTimersByTime(10 * 60_000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('logs error for unsupported cron expression without cron-parser', () => {
            const errorSpy = vi.spyOn(logger, 'error');
            const callback = vi.fn();

            cronService.register('complex', '0 0 12 * * MON-FRI', callback);

            expect(cronService.hasJob('complex')).toBe(false);
            expect(errorSpy).toHaveBeenCalled();
        });
    });
});
