import { describe, it, expect } from 'vitest';
import { Module, Injectable } from '@merinaa/core';
import { TestBed } from './test-bed';
import { ConfigService } from '../services/config.service';

@Injectable()
class GreeterService {
    greet(name: string) {
        return `Hello, ${name}!`;
    }
}

@Module({
    providers: [GreeterService],
    exports: [GreeterService],
    config: { rate: 42 },
})
class TrivialModule {}

@Module({
    providers: [GreeterService],
    exports: [GreeterService],
    config: { rate: 42 },
    configNamespace: 'custom',
})
class NamespacedModule {}

describe('TestBed', () => {
    it('boots a minimal module and resolves providers', async () => {
        const bed = await TestBed.create({ rootModule: TrivialModule });
        const greeter = bed.get(GreeterService);
        expect(greeter.greet('world')).toBe('Hello, world!');
    });

    it('merges module-scoped config under derived namespace', async () => {
        const bed = await TestBed.create({ rootModule: TrivialModule });
        // `TrivialModule` → namespace `trivial`
        expect(bed.getConfig().get('trivial.rate')).toBe(42);
    });

    it('honors explicit configNamespace override', async () => {
        const bed = await TestBed.create({ rootModule: NamespacedModule });
        expect(bed.getConfig().get('custom.rate')).toBe(42);
        expect(bed.getConfig().get('namespaced.rate')).toBeUndefined();
    });

    it('test-provided config overrides module defaults', async () => {
        const bed = await TestBed.create({
            rootModule: TrivialModule,
            config: { trivial: { rate: 99 } },
        });
        expect(bed.getConfig().get('trivial.rate')).toBe(99);
    });

    it('accepts provider overrides', async () => {
        const fake = { greet: () => 'fake' };
        const bed = await TestBed.create({
            rootModule: TrivialModule,
            providers: [{ provide: GreeterService, useValue: fake }],
        });
        expect(bed.get(GreeterService).greet('x')).toBe('fake');
    });

    it('can run without any module', async () => {
        const bed = await TestBed.create();
        // Core services are always available.
        expect(bed.get(ConfigService)).toBeDefined();
    });
});
