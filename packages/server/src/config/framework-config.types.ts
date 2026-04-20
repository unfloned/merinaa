/**
 * Framework-wide configuration schema.
 *
 * The runtime `ConfigService` stores flat dot-paths (e.g. `"testing.discord.enabled"`),
 * but at bootstrap you can pass a nested `FrameworkConfig` object via
 * `builder.loadConfig(config)`. TypeScript checks the shape.
 *
 * Modules extend this via module-augmentation in their own types file if they
 * want strong typing for `config.getSection<FooConfig>('foo')`.
 */
export interface FrameworkConfig {
    framework?: FrameworkCoreConfig;
    server?: ServerConfig;
    database?: DatabaseRuntimeConfig;
    logging?: LoggingConfig;
    testing?: TestingConfig;
    discord?: DiscordConfig;

    /**
     * Arbitrary module-scoped config, merged under `<moduleName>.*`.
     * Modules declare their own defaults via `@Module({ config: {...} })`.
     * Root config overrides those defaults.
     */
    [moduleNamespace: string]: any;
}

export interface FrameworkCoreConfig {
    /** Print verbose logs, enable dev-only assertions. */
    debug?: boolean;
    /** `'development' | 'production'`. Derived from `framework_env` Convar. */
    env?: 'development' | 'production';
    /** Default user locale (e.g. `'de'`, `'en'`). */
    locale?: string;
}

export interface ServerConfig {
    name?: string;
    maxPlayers?: number;
}

export interface DatabaseRuntimeConfig {
    /** Full MySQL connection string (usually from Convar, not config file). */
    connectionString?: string;
}

export interface LoggingConfig {
    /** `'error' | 'warn' | 'info' | 'debug'` */
    level?: 'error' | 'warn' | 'info' | 'debug';
    /** Forward warn+error to Discord webhook (if configured). */
    forwardToDiscord?: boolean;
}

export interface TestingConfig {
    /** Report to Discord during vitest runs. */
    discord?: TestingDiscordConfig;
    /** Skip heavy integration tests when true (CI flag). */
    skipIntegration?: boolean;
}

export interface TestingDiscordConfig {
    enabled?: boolean;
    /** Webhook URL (can also live in ENV `DISCORD_TESTING_WEBHOOK`). */
    webhook?: string;
    /** Role ID to mention on failure, e.g. `"1234567890"`. */
    mentionOnFail?: string;
    /** Color for success embed (hex decimal). Default green. */
    successColor?: number;
    /** Color for failure embed. Default red. */
    failureColor?: number;
    /** Min ms between Discord edits (rate-limit safety). Default 1500. */
    throttleMs?: number;
}

export interface DiscordConfig {
    /** Default webhook URL for general framework alerts (start/stop/errors). */
    webhook?: string;
    /** Bot username shown next to the embed. */
    username?: string;
    /** Avatar URL shown next to the embed. */
    avatarUrl?: string;
}
