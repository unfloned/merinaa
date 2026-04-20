/**
 * Options for the @Cron decorator.
 *
 * Either a cron expression string or an object with `interval` (ms).
 */
export type CronOptions = string | { interval: number };

/**
 * Metadata stored per @Cron-decorated method.
 */
export interface CronHandlerMetadata {
    method: string;
    options: CronOptions;
}
