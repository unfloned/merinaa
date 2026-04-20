import { Injectable } from '@merinaa/core';
import type { CronOptions } from '@merinaa/core';
import { LoggerService } from './logger.service';

interface CronJob {
    name: string;
    options: CronOptions;
    timer: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;
    running: boolean;
}

/**
 * Manages scheduled cron jobs registered via the @Cron decorator.
 *
 * Supports two modes:
 * - Simple interval: `{ interval: 60_000 }` → setInterval
 * - Cron expression: `'0 *​/15 * * * *'` → parsed with cron-parser, next-tick scheduling
 */
@Injectable()
export class CronService {
    private jobs = new Map<string, CronJob>();
    private destroyed = false;

    constructor(private logger: LoggerService) {}

    /**
     * Register and start a cron job.
     */
    register(name: string, options: CronOptions, callback: () => void | Promise<void>): void {
        if (this.jobs.has(name)) {
            this.logger.warn('CronService', `Job "${name}" already registered, skipping`);
            return;
        }

        if (typeof options === 'object' && 'interval' in options) {
            this.registerInterval(name, options.interval, callback);
        } else if (typeof options === 'string') {
            this.registerCronExpression(name, options, callback);
        }
    }

    /**
     * Simple interval-based job.
     */
    private registerInterval(name: string, intervalMs: number, callback: () => void | Promise<void>): void {
        const wrappedCallback = async () => {
            const job = this.jobs.get(name);
            if (!job || job.running) return;

            job.running = true;
            try {
                await callback();
            } catch (error) {
                this.logger.error('CronService', `Job "${name}" failed:`, error);
            } finally {
                job.running = false;
            }
        };

        const timer = setInterval(wrappedCallback, intervalMs);

        this.jobs.set(name, { name, options: { interval: intervalMs }, timer, running: false });
        this.logger.log('CronService', `Registered interval job "${name}" (every ${intervalMs}ms)`);
    }

    /**
     * Cron-expression-based job. Uses cron-parser if available,
     * otherwise falls back to parsing simple patterns.
     */
    private registerCronExpression(name: string, expression: string, callback: () => void | Promise<void>): void {
        let parseCron: ((expr: string) => { next: () => { toDate: () => Date } }) | undefined;

        try {
            // cron-parser is an optional peer dependency
            parseCron = require('cron-parser').parseExpression;
        } catch {
            // Fallback: try to interpret as a simple interval pattern
            const intervalMs = this.parseSimpleCron(expression);
            if (intervalMs) {
                this.registerInterval(name, intervalMs, callback);
                return;
            }
            this.logger.error('CronService',
                `Cannot parse cron expression "${expression}" for job "${name}". ` +
                `Install "cron-parser" for full cron support.`
            );
            return;
        }

        const scheduleNext = () => {
            if (this.destroyed) return;

            try {
                const interval = parseCron!(expression);
                const nextDate = interval.next().toDate();
                const delay = nextDate.getTime() - Date.now();

                const timer = setTimeout(async () => {
                    const job = this.jobs.get(name);
                    if (!job || job.running) {
                        scheduleNext();
                        return;
                    }

                    job.running = true;
                    try {
                        await callback();
                    } catch (error) {
                        this.logger.error('CronService', `Job "${name}" failed:`, error);
                    } finally {
                        job.running = false;
                        scheduleNext();
                    }
                }, Math.max(delay, 0));

                const job = this.jobs.get(name);
                if (job) {
                    job.timer = timer;
                }
            } catch (error) {
                this.logger.error('CronService', `Failed to schedule next tick for "${name}":`, error);
            }
        };

        // Create job entry first, then start scheduling
        this.jobs.set(name, {
            name,
            options: expression,
            timer: setTimeout(() => {}, 0), // placeholder, replaced by scheduleNext
            running: false,
        });

        scheduleNext();
        this.logger.log('CronService', `Registered cron job "${name}" (${expression})`);
    }

    /**
     * Parse common simple cron shorthand patterns to interval milliseconds.
     * Only covers the most common cases as a fallback when cron-parser is not installed.
     */
    private parseSimpleCron(expression: string): number | null {
        const parts = expression.trim().split(/\s+/);

        // 6-part (with seconds): "0 */N * * * *" or "*/N * * * * *"
        // 5-part (standard): "*/N * * * *"
        if (parts.length === 6) {
            // Seconds field with */N
            const secMatch = parts[0].match(/^\*\/(\d+)$/);
            if (secMatch && parts.slice(1).every(p => p === '*')) {
                return parseInt(secMatch[1], 10) * 1000;
            }
            // Minutes field with */N, seconds = 0
            const minMatch = parts[1].match(/^\*\/(\d+)$/);
            if (parts[0] === '0' && minMatch && parts.slice(2).every(p => p === '*')) {
                return parseInt(minMatch[1], 10) * 60_000;
            }
        }

        if (parts.length === 5) {
            const minMatch = parts[0].match(/^\*\/(\d+)$/);
            if (minMatch && parts.slice(1).every(p => p === '*')) {
                return parseInt(minMatch[1], 10) * 60_000;
            }
        }

        return null;
    }

    /**
     * Stop a specific job by name.
     */
    stop(name: string): boolean {
        const job = this.jobs.get(name);
        if (!job) return false;

        clearInterval(job.timer as any);
        clearTimeout(job.timer as any);
        this.jobs.delete(name);
        this.logger.log('CronService', `Stopped job "${name}"`);
        return true;
    }

    /**
     * Stop all jobs. Called on application shutdown.
     */
    destroyAll(): void {
        this.destroyed = true;
        for (const [name, job] of this.jobs) {
            clearInterval(job.timer as any);
            clearTimeout(job.timer as any);
        }
        const count = this.jobs.size;
        this.jobs.clear();
        if (count > 0) {
            this.logger.log('CronService', `Stopped ${count} jobs`);
        }
    }

    /**
     * Get names of all registered jobs.
     */
    getJobNames(): string[] {
        return Array.from(this.jobs.keys());
    }

    /**
     * Check if a specific job is currently registered.
     */
    hasJob(name: string): boolean {
        return this.jobs.has(name);
    }
}
