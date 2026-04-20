import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';

/**
 * Parse a YAML string into a plain object.
 * Returns `{}` on empty/invalid input — never throws.
 */
export function parseYamlString(
    content: string,
    options: { substituteEnv?: boolean } = {}
): Record<string, any> {
    let parsed: unknown;
    try {
        parsed = parseYaml(content);
    } catch (err) {
        console.error(`[Config] YAML parse error: ${(err as Error).message}`);
        return {};
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
    }
    const result = parsed as Record<string, any>;
    return options.substituteEnv !== false ? substituteEnvVars(result) : result;
}

/**
 * Load a YAML file from a FiveM resource using `LoadResourceFile`.
 * Used at runtime inside the FiveM server — `LoadResourceFile(resourceName, fileName)`
 * reads from the resource folder (where `build.js` copied `framework.config.yaml`).
 *
 * Falls back to `loadYamlConfig` (plain fs) when `LoadResourceFile` is
 * unavailable (tests, CLI tools).
 */
export function loadYamlFromResource(
    fileName: string,
    options: { substituteEnv?: boolean; resourceName?: string } = {}
): Record<string, any> {
    const loader = (globalThis as any).LoadResourceFile;
    const getCurrentResource = (globalThis as any).GetCurrentResourceName;
    if (typeof loader === 'function') {
        const resource = options.resourceName ?? (typeof getCurrentResource === 'function' ? getCurrentResource() : '');
        const content: string | null = loader(resource, fileName);
        if (!content) return {};
        return parseYamlString(content, options);
    }
    return loadYamlConfig(fileName, options);
}

/**
 * Load a YAML file and return its parsed object.
 * Returns an empty object if the file doesn't exist or fails to parse —
 * callers can always count on getting a merge-safe result.
 *
 * @param path Absolute or CWD-relative path to the YAML file.
 * @param options.substituteEnv Replace `${VAR}` with `process.env.VAR` in string values. Default: true.
 */
export function loadYamlConfig(
    path: string,
    options: { substituteEnv?: boolean } = {}
): Record<string, any> {
    const substituteEnv = options.substituteEnv !== false;

    if (!existsSync(path)) {
        return {};
    }

    let content: string;
    try {
        content = readFileSync(path, 'utf-8');
    } catch (err) {
        console.warn(`[Config] Could not read ${path}: ${(err as Error).message}`);
        return {};
    }

    let parsed: unknown;
    try {
        parsed = parseYaml(content);
    } catch (err) {
        console.error(`[Config] YAML parse error in ${path}: ${(err as Error).message}`);
        return {};
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
    }

    const result = parsed as Record<string, any>;
    return substituteEnv ? substituteEnvVars(result) : result;
}

/**
 * Walk a config object and replace `${VAR}` occurrences in string values with
 * `process.env.VAR`. Missing env vars become empty strings.
 *
 * - Only string values are substituted.
 * - A value of `${SOME_VAR}` (exactly one placeholder) returns `undefined`
 *   when the env is not set, so downstream defaults can kick in instead of
 *   inheriting an empty string.
 * - Nested objects are walked recursively; arrays are preserved but their
 *   string items get the same treatment.
 */
export function substituteEnvVars<T>(value: T): T {
    if (typeof value === 'string') {
        return resolveString(value) as T;
    }
    if (Array.isArray(value)) {
        return value.map((v) => substituteEnvVars(v)) as T;
    }
    // Only recurse into plain objects — leave Dates, RegExps, Maps, etc. alone.
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value as Record<string, any>)) {
            out[k] = substituteEnvVars(v);
        }
        return out as T;
    }
    return value;
}

const SINGLE_PLACEHOLDER = /^\$\{([A-Z0-9_]+)\}$/;
const ANY_PLACEHOLDER = /\$\{([A-Z0-9_]+)\}/g;

function resolveString(value: string): string | undefined {
    // Whole-string placeholder: return undefined if not set so defaults apply.
    const single = value.match(SINGLE_PLACEHOLDER);
    if (single) {
        const envVal = process.env[single[1]];
        return envVal === undefined || envVal === '' ? undefined : envVal;
    }

    // Embedded placeholders: substitute, missing -> empty string.
    return value.replace(ANY_PLACEHOLDER, (_match, name: string) => process.env[name] ?? '');
}
