import 'reflect-metadata';

// Core re-exports
export * from '@merinaa/core';

// Deepkit re-exports (for modules that need ORM types).
// Type re-exports plus the matching `__Ω*` runtime symbols — the deepkit
// type-compiler in consumer packages needs the runtime symbols to emit
// `() => __ΩPrimaryKey` refs in their class `__type` arrays. Without the
// runtime side forwarded, consumers fall back to string names and the ORM
// can't detect primary keys across package boundaries.
export {
    entity, PrimaryKey, AutoIncrement, Index, MaxLength, DatabaseField, UUID, Unique,
} from '@deepkit/type';
export { uuid } from '@deepkit/type';
export {
    __ΩPrimaryKey, __ΩAutoIncrement, __ΩIndex, __ΩMaxLength, __ΩDatabaseField, __ΩUUID, __ΩUnique,
} from '@deepkit/type';
export { Database } from '@deepkit/orm';

// Application
export * from './app/application';
export * from './app/application-builder';
export * from './app/create-server';
export * from './app/bootstrap-server';

// Container
export * from './container/container';
export * from './container/module-loader';

// Events
export * from './events/event-bus';
export * from './events/event-registry';
export * from './events/execution-context';

// Services
export * from './services/registry';
export * from './services/logger.service';
export * from './services/config.service';
export * from './services/discord-webhook.service';
export * from './services/cron.service';
export * from './services/permission.service';
export * from './services/rate-limit.service';

// Config
export * from './config';

// Guards
export * from './guards/auth.guard';
export * from './guards/rate-limit.guard';

// Interceptors
export * from './interceptors/logging.interceptor';

// Pipes
export * from './pipes/validation.pipe';

// Shared types (Coordinates, PaginationOptions, etc.)
export * from './database/shared-types';

// Database framework infrastructure (not entities/repositories — those live in modules)
export {
    DatabaseModule,
    DatabaseService,
    DatabaseConfig,
    DEFAULT_DATABASE_CONFIG,
    DATABASE_CONFIG_TOKEN,
    BaseEntity,
    BaseUuidEntity,
    BaseStringPKEntity,
    BaseRepository,
    // Player stays in framework (core concept)
    PlayerRepository,
    Player as PlayerEntity,
    PlayerMoney,
    PlayerJob,
    PlayerGang,
    PlayerCharacterInfo,
    PlayerMetadataInfo,
    PlayerPosition,
    PlayerJobGrade,
    PlayerLicenses,
} from './database';

// RPC
export * from './rpc';
