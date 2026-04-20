import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
    let config: ConfigService;

    beforeEach(() => {
        config = new ConfigService();
    });

    describe('get / set / has', () => {
        it('returns undefined for unknown keys', () => {
            expect(config.get('missing.key')).toBeUndefined();
        });

        it('returns default when key is missing', () => {
            expect(config.get('missing.key', 42)).toBe(42);
        });

        it('returns stored value over default', () => {
            config.set('my.key', 'value');
            expect(config.get('my.key', 'default')).toBe('value');
        });

        it('has() reflects presence', () => {
            expect(config.has('x')).toBe(false);
            config.set('x', 1);
            expect(config.has('x')).toBe(true);
        });
    });

    describe('load() — overwrite semantics', () => {
        it('flattens nested objects to dot paths', () => {
            config.load({ testing: { discord: { enabled: true } } });
            expect(config.get('testing.discord.enabled')).toBe(true);
        });

        it('overwrites existing values', () => {
            config.set('framework.debug', false);
            config.load({ framework: { debug: true } });
            expect(config.get('framework.debug')).toBe(true);
        });

        it('preserves arrays as values (does not recurse into them)', () => {
            config.load({ list: [1, 2, 3] });
            expect(config.get('list')).toEqual([1, 2, 3]);
        });
    });

    describe('merge() — defaults-only semantics', () => {
        it('fills in missing keys', () => {
            config.merge({ bank: { rate: 0.05 } });
            expect(config.get('bank.rate')).toBe(0.05);
        });

        it('does NOT overwrite existing keys', () => {
            config.set('bank.rate', 0.1);
            config.merge({ bank: { rate: 0.05 } });
            expect(config.get('bank.rate')).toBe(0.1);
        });

        it('adds new keys while keeping existing', () => {
            config.set('bank.rate', 0.1);
            config.merge({ bank: { rate: 0.05, interval: 60 } });
            expect(config.get('bank.rate')).toBe(0.1);
            expect(config.get('bank.interval')).toBe(60);
        });
    });

    describe('getSection', () => {
        it('returns undefined when namespace has no keys', () => {
            expect(config.getSection('nonexistent')).toBeUndefined();
        });

        it('returns nested object for namespace', () => {
            config.load({ discord: { webhook: 'https://...', username: 'Bot' } });
            expect(config.getSection('discord')).toEqual({
                webhook: 'https://...',
                username: 'Bot',
            });
        });

        it('returns direct value if exact key is set', () => {
            config.set('server.name', 'My Server');
            config.set('server.maxPlayers', 32);
            const section = config.getSection<{ name: string; maxPlayers: number }>('server');
            expect(section?.name).toBe('My Server');
            expect(section?.maxPlayers).toBe(32);
        });
    });

    describe('getAll', () => {
        it('reconstructs nested structure', () => {
            config.set('a.b.c', 1);
            config.set('a.b.d', 2);
            config.set('a.e', 3);
            expect(config.getAll()).toMatchObject({
                a: { b: { c: 1, d: 2 }, e: 3 },
            });
        });
    });

    describe('precedence — real-world scenario', () => {
        it('builder.loadConfig() overrides module defaults (merge-then-load order)', () => {
            // Simulate the production flow:
            // 1. ModuleLoader merges module default
            config.merge({ bank: { interestRate: 0.05 } });
            // 2. Bootstrap loads root framework.config.ts
            config.load({ bank: { interestRate: 0.02 } });
            // Root wins.
            expect(config.get('bank.interestRate')).toBe(0.02);
        });

        it('module default fills in what root config omits', () => {
            config.merge({ bank: { interestRate: 0.05, rotationMs: 60000 } });
            config.load({ bank: { interestRate: 0.02 } });
            expect(config.get('bank.interestRate')).toBe(0.02);
            expect(config.get('bank.rotationMs')).toBe(60000);
        });
    });
});
