import { Injectable } from '@merinaa/core';
import { LoggerService } from './logger.service';
import { EventBus } from '../events/event-bus';

/**
 * A role with a set of permission strings.
 */
export interface Role {
    name: string;
    permissions: Set<string>;
    priority: number;
}

/**
 * PermissionService manages roles, permissions, and player→role assignments.
 *
 * Roles are hierarchical by priority (higher = more powerful). Each role
 * carries a set of permission strings like `'admin.kick'`, `'bank.transfer'`.
 *
 * The service checks permissions in this order:
 * 1. Player's assigned roles (in-memory, populated from DB by consumer)
 * 2. FiveM ACE permissions (fallback, always checked)
 *
 * Consumers are responsible for persisting role assignments — the service
 * emits events (`permission:role:assigned`, `permission:role:revoked`) that
 * can be listened to for DB persistence.
 */
@Injectable()
export class PermissionService {
    private roles = new Map<string, Role>();
    private playerRoles = new Map<number, Set<string>>();

    constructor(
        private logger: LoggerService,
        private eventBus: EventBus
    ) {}

    // ─── Role Management ───────────────────────────────────────

    /**
     * Define a new role. If the role already exists, it is updated.
     */
    defineRole(name: string, permissions: string[], priority = 0): void {
        this.roles.set(name, {
            name,
            permissions: new Set(permissions),
            priority,
        });
        this.logger.debug('PermissionService', `Defined role "${name}" with ${permissions.length} permissions (priority ${priority})`);
    }

    /**
     * Remove a role definition and unassign it from all players.
     */
    removeRole(name: string): boolean {
        if (!this.roles.delete(name)) return false;

        for (const [source, roles] of this.playerRoles) {
            roles.delete(name);
        }

        this.logger.debug('PermissionService', `Removed role "${name}"`);
        return true;
    }

    /**
     * Get a role by name.
     */
    getRole(name: string): Role | undefined {
        return this.roles.get(name);
    }

    /**
     * Get all defined roles.
     */
    getRoles(): Role[] {
        return Array.from(this.roles.values());
    }

    /**
     * Add permissions to an existing role.
     */
    addPermissionsToRole(roleName: string, permissions: string[]): boolean {
        const role = this.roles.get(roleName);
        if (!role) return false;

        for (const perm of permissions) {
            role.permissions.add(perm);
        }
        return true;
    }

    /**
     * Remove permissions from an existing role.
     */
    removePermissionsFromRole(roleName: string, permissions: string[]): boolean {
        const role = this.roles.get(roleName);
        if (!role) return false;

        for (const perm of permissions) {
            role.permissions.delete(perm);
        }
        return true;
    }

    // ─── Player Role Assignment ────────────────────────────────

    /**
     * Assign a role to a player (by source ID).
     * Emits `permission:role:assigned` for consumer DB persistence.
     */
    assignRole(source: number, roleName: string): boolean {
        if (!this.roles.has(roleName)) {
            this.logger.warn('PermissionService', `Cannot assign unknown role "${roleName}" to player ${source}`);
            return false;
        }

        let playerSet = this.playerRoles.get(source);
        if (!playerSet) {
            playerSet = new Set();
            this.playerRoles.set(source, playerSet);
        }

        playerSet.add(roleName);
        this.logger.debug('PermissionService', `Assigned role "${roleName}" to player ${source}`);

        this.eventBus.emit('permission:role:assigned', { source, role: roleName });
        return true;
    }

    /**
     * Revoke a role from a player.
     * Emits `permission:role:revoked` for consumer DB persistence.
     */
    revokeRole(source: number, roleName: string): boolean {
        const playerSet = this.playerRoles.get(source);
        if (!playerSet || !playerSet.delete(roleName)) return false;

        if (playerSet.size === 0) {
            this.playerRoles.delete(source);
        }

        this.logger.debug('PermissionService', `Revoked role "${roleName}" from player ${source}`);
        this.eventBus.emit('permission:role:revoked', { source, role: roleName });
        return true;
    }

    /**
     * Get all roles assigned to a player.
     */
    getPlayerRoles(source: number): string[] {
        const playerSet = this.playerRoles.get(source);
        return playerSet ? Array.from(playerSet) : [];
    }

    /**
     * Set all roles for a player at once (e.g. when loading from DB).
     */
    setPlayerRoles(source: number, roleNames: string[]): void {
        this.playerRoles.set(source, new Set(roleNames));
    }

    /**
     * Clear all roles for a player (e.g. on disconnect).
     */
    clearPlayer(source: number): void {
        this.playerRoles.delete(source);
    }

    // ─── Permission Checks ─────────────────────────────────────

    /**
     * Check if a player has a specific permission.
     *
     * Checks role-based permissions first, then falls back to FiveM ACE.
     * Supports wildcard matching: `'admin.*'` grants all `admin.xxx` permissions.
     */
    hasPermission(source: number, permission: string): boolean {
        // Server-side calls always pass
        if (source === -1) return true;

        // Check role-based permissions
        const playerSet = this.playerRoles.get(source);
        if (playerSet) {
            for (const roleName of playerSet) {
                const role = this.roles.get(roleName);
                if (!role) continue;

                if (role.permissions.has('*')) return true;
                if (role.permissions.has(permission)) return true;

                // Wildcard: 'admin.*' matches 'admin.kick'
                for (const perm of role.permissions) {
                    if (perm.endsWith('.*')) {
                        const prefix = perm.slice(0, -1); // 'admin.'
                        if (permission.startsWith(prefix)) return true;
                    }
                }
            }
        }

        // Fallback: FiveM ACE permission system
        if (typeof IsPlayerAceAllowed === 'function') {
            return IsPlayerAceAllowed(source.toString(), permission) as unknown as boolean;
        }

        return false;
    }

    /**
     * Check if a player has ALL of the given permissions.
     */
    hasAllPermissions(source: number, permissions: string[]): boolean {
        return permissions.every(p => this.hasPermission(source, p));
    }

    /**
     * Check if a player has ANY of the given permissions.
     */
    hasAnyPermission(source: number, permissions: string[]): boolean {
        return permissions.some(p => this.hasPermission(source, p));
    }

    /**
     * Get the highest-priority role for a player.
     */
    getHighestRole(source: number): Role | undefined {
        const playerSet = this.playerRoles.get(source);
        if (!playerSet) return undefined;

        let highest: Role | undefined;
        for (const roleName of playerSet) {
            const role = this.roles.get(roleName);
            if (role && (!highest || role.priority > highest.priority)) {
                highest = role;
            }
        }
        return highest;
    }

    /**
     * Get all effective permissions for a player (union of all role permissions).
     */
    getEffectivePermissions(source: number): string[] {
        const result = new Set<string>();
        const playerSet = this.playerRoles.get(source);
        if (!playerSet) return [];

        for (const roleName of playerSet) {
            const role = this.roles.get(roleName);
            if (!role) continue;
            for (const perm of role.permissions) {
                result.add(perm);
            }
        }

        return Array.from(result);
    }
}
