import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadYamlConfig, parseYamlString, substituteEnvVars } from './yaml-loader';

describe('yaml-loader', () => {
    describe('parseYamlString', () => {
        it('parses simple YAML', () => {
            const out = parseYamlString('foo: bar\nnested:\n  x: 1');
            expect(out).toEqual({ foo: 'bar', nested: { x: 1 } });
        });

        it('returns {} on invalid YAML', () => {
            expect(parseYamlString(': : :')).toEqual({});
        });

        it('returns {} on empty input', () => {
            expect(parseYamlString('')).toEqual({});
        });

        it('returns {} on top-level array (we only accept objects)', () => {
            expect(parseYamlString('- a\n- b')).toEqual({});
        });

        it('substitutes env vars by default', () => {
            process.env.__TEST_WEBHOOK = 'https://example.com';
            const out = parseYamlString('webhook: ${__TEST_WEBHOOK}');
            expect(out.webhook).toBe('https://example.com');
            delete process.env.__TEST_WEBHOOK;
        });

        it('can disable env substitution', () => {
            const out = parseYamlString('webhook: ${UNSET_VAR}', { substituteEnv: false });
            expect(out.webhook).toBe('${UNSET_VAR}');
        });
    });

    describe('substituteEnvVars', () => {
        afterEach(() => {
            delete process.env.__TEST_X;
            delete process.env.__TEST_Y;
        });

        it('whole-string placeholder returns undefined when unset', () => {
            expect(substituteEnvVars({ x: '${UNSET_VAR}' })).toEqual({ x: undefined });
        });

        it('whole-string placeholder returns env value when set', () => {
            process.env.__TEST_X = 'hello';
            expect(substituteEnvVars({ x: '${__TEST_X}' })).toEqual({ x: 'hello' });
        });

        it('embedded placeholder substitutes inline', () => {
            process.env.__TEST_X = 'abc';
            expect(substituteEnvVars({ url: 'https://${__TEST_X}.example.com' }))
                .toEqual({ url: 'https://abc.example.com' });
        });

        it('embedded placeholder with missing var becomes empty string', () => {
            expect(substituteEnvVars({ url: 'https://${UNSET_VAR}.example.com' }))
                .toEqual({ url: 'https://.example.com' });
        });

        it('walks nested objects', () => {
            process.env.__TEST_X = '42';
            const out = substituteEnvVars({ a: { b: { c: '${__TEST_X}' } } });
            expect(out).toEqual({ a: { b: { c: '42' } } });
        });

        it('walks arrays', () => {
            process.env.__TEST_X = 'v';
            const out = substituteEnvVars({ list: ['${__TEST_X}', 'static'] });
            expect(out).toEqual({ list: ['v', 'static'] });
        });

        it('leaves non-strings alone', () => {
            const out = substituteEnvVars({ n: 42, b: true, nul: null, d: new Date(0) });
            expect(out.n).toBe(42);
            expect(out.b).toBe(true);
            expect(out.nul).toBeNull();
            expect(out.d).toBeInstanceOf(Date);
        });
    });

    describe('loadYamlConfig (filesystem)', () => {
        let tmpDir: string;
        let tmpFile: string;

        beforeEach(() => {
            tmpDir = mkdtempSync(join(tmpdir(), 'yamlcfg-'));
            tmpFile = join(tmpDir, 'cfg.yaml');
        });

        afterEach(() => {
            try { unlinkSync(tmpFile); } catch {}
            try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        });

        it('reads a YAML file from disk', () => {
            writeFileSync(tmpFile, 'framework:\n  debug: true\n');
            expect(loadYamlConfig(tmpFile)).toEqual({ framework: { debug: true } });
        });

        it('returns {} for a missing file', () => {
            expect(loadYamlConfig(join(tmpDir, 'does-not-exist.yaml'))).toEqual({});
        });
    });
});
