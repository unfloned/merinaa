import { Injectable } from '@merinaa/core';
import type { Guard, ExecutionContext } from '@merinaa/core';
import { Container } from '../container/container';
import { PermissionService } from '../services/permission.service';

/**
 * Guard that checks if a player is authenticated
 * This is a basic example - extend with your own logic
 */
@Injectable()
export class AuthGuard implements Guard {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const source = context.source;

        // Source -1 means server-side call, allow
        if (source === -1) {
            return true;
        }

        // Check if player exists
        const playerName = GetPlayerName(source.toString());
        if (!playerName) {
            console.warn(`[AuthGuard] Rejected: Player ${source} does not exist`);
            return false;
        }

        // Get player state from context if available
        const player = context.getData('player');
        if (!player) {
            // Player not loaded yet - you might want to handle this differently
            // depending on the event
            console.warn(`[AuthGuard] Warning: Player ${source} not loaded`);
        }

        return true;
    }
}

/**
 * Guard that checks for admin permissions
 */
@Injectable()
export class AdminGuard implements Guard {
    // List of admin identifiers (should be loaded from config/database)
    private adminIdentifiers: string[] = [];

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const source = context.source;

        if (source === -1) return true;

        // Get player identifiers
        const numIdentifiers = GetNumPlayerIdentifiers(source.toString());
        for (let i = 0; i < numIdentifiers; i++) {
            const identifier = GetPlayerIdentifier(source.toString(), i);
            if (this.adminIdentifiers.includes(identifier)) {
                return true;
            }
        }

        // Check ACE permission
        if (IsPlayerAceAllowed(source.toString(), 'framework.admin')) {
            return true;
        }

        console.warn(`[AdminGuard] Rejected: Player ${source} is not an admin`);
        return false;
    }

    /**
     * Add an admin identifier
     */
    addAdmin(identifier: string): void {
        if (!this.adminIdentifiers.includes(identifier)) {
            this.adminIdentifiers.push(identifier);
        }
    }

    /**
     * Remove an admin identifier
     */
    removeAdmin(identifier: string): void {
        const index = this.adminIdentifiers.indexOf(identifier);
        if (index !== -1) {
            this.adminIdentifiers.splice(index, 1);
        }
    }
}

/**
 * Factory function for creating permission guards.
 *
 * Uses PermissionService (role-based + wildcard) with ACE fallback.
 *
 * @example
 * ```typescript
 * @OnClient('admin:kick')
 * @UseGuards(RequirePermission('admin.kick'))
 * async kick(@Source() src: number) { ... }
 * ```
 */
export function RequirePermission(...permissions: string[]): new () => Guard {
    @Injectable()
    class PermissionGuard implements Guard {
        async canActivate(context: ExecutionContext): Promise<boolean> {
            const source = context.source;
            if (source === -1) return true;

            // Try PermissionService first (role-based + ACE fallback built-in)
            const container = Container.getInstance();
            if (container.has(PermissionService)) {
                const permService = container.get(PermissionService);
                if (!permService.hasAllPermissions(source, permissions)) {
                    console.warn(
                        `[PermissionGuard] Rejected: Player ${source} missing permission(s): ${permissions.join(', ')}`
                    );
                    return false;
                }
                return true;
            }

            // Fallback: direct ACE check (no PermissionService registered)
            for (const permission of permissions) {
                if (typeof IsPlayerAceAllowed === 'function' &&
                    !IsPlayerAceAllowed(source.toString(), permission)) {
                    console.warn(
                        `[PermissionGuard] Rejected: Player ${source} missing ACE permission: ${permission}`
                    );
                    return false;
                }
            }

            return true;
        }
    }

    return PermissionGuard;
}

/**
 * Rate limit guard factory
 */
export function RateLimit(options: { windowMs: number; max: number }): new () => Guard {
    const requests = new Map<string, number[]>();

    @Injectable()
    class RateLimitGuard implements Guard {
        canActivate(context: ExecutionContext): boolean {
            const source = context.source;
            if (source === -1) return true;

            const key = `${source}:${context.event}`;
            const now = Date.now();
            const windowStart = now - options.windowMs;

            let timestamps = requests.get(key) || [];
            timestamps = timestamps.filter((t) => t > windowStart);

            if (timestamps.length >= options.max) {
                console.warn(`[RateLimitGuard] Rate limit exceeded for player ${source}`);
                return false;
            }

            timestamps.push(now);
            requests.set(key, timestamps);

            return true;
        }
    }

    return RateLimitGuard;
}
