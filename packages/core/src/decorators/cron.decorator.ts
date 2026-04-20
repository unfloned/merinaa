import 'reflect-metadata';
import { METADATA_KEYS } from '../constants';
import type { CronOptions, CronHandlerMetadata } from '../interfaces/cron.interface';

/**
 * Marks a method as a scheduled cron job.
 *
 * Accepts either a cron expression string (parsed by cron-parser) or
 * an object with `interval` in milliseconds for simple repeated timers.
 *
 * @example
 * ```typescript
 * @Controller()
 * export class BankController {
 *     @Cron('0 *\/15 * * * *')   // every 15 minutes
 *     async rotateInterest() { ... }
 *
 *     @Cron({ interval: 60_000 }) // every 60 seconds
 *     async tick() { ... }
 * }
 * ```
 */
export function Cron(options: CronOptions): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const existing: CronHandlerMetadata[] =
            Reflect.getMetadata(METADATA_KEYS.CRON_HANDLERS, target.constructor) || [];

        existing.push({
            method: propertyKey as string,
            options,
        });

        Reflect.defineMetadata(METADATA_KEYS.CRON_HANDLERS, existing, target.constructor);

        return descriptor;
    };
}

/**
 * Get all @Cron methods from a class.
 */
export function getCronHandlers(target: Function): CronHandlerMetadata[] {
    return Reflect.getMetadata(METADATA_KEYS.CRON_HANDLERS, target) || [];
}
