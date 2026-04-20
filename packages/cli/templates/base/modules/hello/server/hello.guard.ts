import { Injectable } from '@merinaa/core';
import type { Guard, ExecutionContext } from '@merinaa/core';
import { LoggerService } from '@merinaa/server';

/**
 * Example guard — demonstrates how to gate a @OnClient handler behind a
 * condition (here: source must be an active player).
 *
 * Attach via `@UseGuards(HelloGuard)` on the handler or on the controller
 * to apply to every handler in it.
 */
@Injectable()
export class HelloGuard implements Guard {
    constructor(private logger: LoggerService) {}

    canActivate(context: ExecutionContext): boolean {
        const source = context.source;

        // Reject if the source isn't a real player (source 0 = console).
        if (!source || source <= 0) {
            this.logger.warn('HelloGuard', `Rejecting call from invalid source ${source}`);
            return false;
        }

        return true;
    }
}
