import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionService } from './permission.service';
import { LoggerService } from './logger.service';
import { EventBus } from '../events/event-bus';

describe('PermissionService', () => {
    let permService: PermissionService;
    let logger: LoggerService;
    let eventBus: EventBus;

    beforeEach(() => {
        logger = new LoggerService();
        eventBus = new EventBus();
        permService = new PermissionService(logger, eventBus);
    });

    describe('role management', () => {
        it('defines and retrieves a role', () => {
            permService.defineRole('admin', ['admin.kick', 'admin.ban'], 100);

            const role = permService.getRole('admin');
            expect(role).toBeDefined();
            expect(role!.name).toBe('admin');
            expect(role!.priority).toBe(100);
            expect(role!.permissions.has('admin.kick')).toBe(true);
            expect(role!.permissions.has('admin.ban')).toBe(true);
        });

        it('updates an existing role on re-define', () => {
            permService.defineRole('mod', ['mod.warn']);
            permService.defineRole('mod', ['mod.warn', 'mod.kick'], 50);

            const role = permService.getRole('mod');
            expect(role!.permissions.has('mod.kick')).toBe(true);
            expect(role!.priority).toBe(50);
        });

        it('removes a role and unassigns from players', () => {
            permService.defineRole('temp', ['temp.x']);
            permService.assignRole(1, 'temp');

            expect(permService.removeRole('temp')).toBe(true);
            expect(permService.getRole('temp')).toBeUndefined();
            expect(permService.getPlayerRoles(1)).toEqual([]);
        });

        it('returns false removing non-existent role', () => {
            expect(permService.removeRole('nope')).toBe(false);
        });

        it('lists all roles', () => {
            permService.defineRole('a', []);
            permService.defineRole('b', []);

            const roles = permService.getRoles();
            expect(roles).toHaveLength(2);
        });

        it('adds permissions to a role', () => {
            permService.defineRole('mod', ['mod.warn']);
            permService.addPermissionsToRole('mod', ['mod.kick']);

            expect(permService.getRole('mod')!.permissions.has('mod.kick')).toBe(true);
        });

        it('removes permissions from a role', () => {
            permService.defineRole('mod', ['mod.warn', 'mod.kick']);
            permService.removePermissionsFromRole('mod', ['mod.kick']);

            expect(permService.getRole('mod')!.permissions.has('mod.kick')).toBe(false);
            expect(permService.getRole('mod')!.permissions.has('mod.warn')).toBe(true);
        });
    });

    describe('player role assignment', () => {
        beforeEach(() => {
            permService.defineRole('admin', ['admin.*'], 100);
            permService.defineRole('mod', ['mod.warn', 'mod.kick'], 50);
            permService.defineRole('user', ['user.chat'], 0);
        });

        it('assigns a role to a player', () => {
            expect(permService.assignRole(1, 'admin')).toBe(true);
            expect(permService.getPlayerRoles(1)).toEqual(['admin']);
        });

        it('returns false assigning unknown role', () => {
            expect(permService.assignRole(1, 'nonexistent')).toBe(false);
        });

        it('revokes a role from a player', () => {
            permService.assignRole(1, 'admin');
            permService.assignRole(1, 'mod');

            expect(permService.revokeRole(1, 'admin')).toBe(true);
            expect(permService.getPlayerRoles(1)).toEqual(['mod']);
        });

        it('returns false revoking unassigned role', () => {
            expect(permService.revokeRole(1, 'admin')).toBe(false);
        });

        it('setPlayerRoles replaces all roles', () => {
            permService.assignRole(1, 'admin');
            permService.setPlayerRoles(1, ['mod', 'user']);

            expect(permService.getPlayerRoles(1)).toEqual(expect.arrayContaining(['mod', 'user']));
            expect(permService.getPlayerRoles(1)).not.toContain('admin');
        });

        it('clearPlayer removes all roles for player', () => {
            permService.assignRole(1, 'admin');
            permService.clearPlayer(1);

            expect(permService.getPlayerRoles(1)).toEqual([]);
        });

        it('emits events on assign and revoke', () => {
            const assignSpy = vi.fn();
            const revokeSpy = vi.fn();

            eventBus.on('permission:role:assigned', assignSpy);
            eventBus.on('permission:role:revoked', revokeSpy);

            permService.assignRole(1, 'admin');
            expect(assignSpy).toHaveBeenCalledWith({ source: 1, role: 'admin' });

            permService.revokeRole(1, 'admin');
            expect(revokeSpy).toHaveBeenCalledWith({ source: 1, role: 'admin' });
        });
    });

    describe('permission checks', () => {
        beforeEach(() => {
            permService.defineRole('admin', ['admin.*'], 100);
            permService.defineRole('mod', ['mod.warn', 'mod.kick', 'user.chat'], 50);
            permService.defineRole('user', ['user.chat'], 0);
            permService.defineRole('superadmin', ['*'], 999);
        });

        it('source -1 always passes', () => {
            expect(permService.hasPermission(-1, 'admin.kick')).toBe(true);
        });

        it('checks exact permission match', () => {
            permService.assignRole(1, 'mod');

            expect(permService.hasPermission(1, 'mod.warn')).toBe(true);
            expect(permService.hasPermission(1, 'mod.kick')).toBe(true);
            expect(permService.hasPermission(1, 'admin.kick')).toBe(false);
        });

        it('checks wildcard permission (admin.*)', () => {
            permService.assignRole(1, 'admin');

            expect(permService.hasPermission(1, 'admin.kick')).toBe(true);
            expect(permService.hasPermission(1, 'admin.ban')).toBe(true);
            expect(permService.hasPermission(1, 'admin.anything.deep')).toBe(true);
            expect(permService.hasPermission(1, 'mod.kick')).toBe(false);
        });

        it('checks global wildcard (*)', () => {
            permService.assignRole(1, 'superadmin');

            expect(permService.hasPermission(1, 'admin.kick')).toBe(true);
            expect(permService.hasPermission(1, 'anything.at.all')).toBe(true);
        });

        it('hasAllPermissions checks all', () => {
            permService.assignRole(1, 'mod');

            expect(permService.hasAllPermissions(1, ['mod.warn', 'mod.kick'])).toBe(true);
            expect(permService.hasAllPermissions(1, ['mod.warn', 'admin.ban'])).toBe(false);
        });

        it('hasAnyPermission checks any', () => {
            permService.assignRole(1, 'user');

            expect(permService.hasAnyPermission(1, ['admin.kick', 'user.chat'])).toBe(true);
            expect(permService.hasAnyPermission(1, ['admin.kick', 'admin.ban'])).toBe(false);
        });

        it('player without roles has no permissions', () => {
            expect(permService.hasPermission(99, 'user.chat')).toBe(false);
        });
    });

    describe('utility methods', () => {
        beforeEach(() => {
            permService.defineRole('admin', ['admin.kick', 'admin.ban'], 100);
            permService.defineRole('mod', ['mod.warn'], 50);
        });

        it('getHighestRole returns highest priority role', () => {
            permService.assignRole(1, 'admin');
            permService.assignRole(1, 'mod');

            const highest = permService.getHighestRole(1);
            expect(highest!.name).toBe('admin');
            expect(highest!.priority).toBe(100);
        });

        it('getHighestRole returns undefined for player without roles', () => {
            expect(permService.getHighestRole(99)).toBeUndefined();
        });

        it('getEffectivePermissions returns union of all permissions', () => {
            permService.assignRole(1, 'admin');
            permService.assignRole(1, 'mod');

            const perms = permService.getEffectivePermissions(1);
            expect(perms).toContain('admin.kick');
            expect(perms).toContain('admin.ban');
            expect(perms).toContain('mod.warn');
        });

        it('getEffectivePermissions returns empty for player without roles', () => {
            expect(permService.getEffectivePermissions(99)).toEqual([]);
        });
    });
});
