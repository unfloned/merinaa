import { Injectable } from '@merinaa/core';
import type { Guard, ExecutionContext } from '@merinaa/core';
import { RateLimitService } from '../services/rate-limit.service';

/**
 * Global guard that throttles `@OnClient` events via {@link RateLimitService}.
 *
 * Registered automatically by `bootstrapServer()` when the resolved
 * framework config contains any `rateLimit.*` keys. Sources that exceed
 * their bucket get a false return — the handler doesn't run, no error
 * propagates back to the client.
 */
@Injectable()
export class RateLimitGuard implements Guard {
    constructor(private rateLimit: RateLimitService) {}

    canActivate(context: ExecutionContext): boolean {
        return this.rateLimit.check(context.event, context.source);
    }
}
