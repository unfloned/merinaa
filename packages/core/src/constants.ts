// Metadata Keys
export const METADATA_KEYS = {
    // Module
    MODULE_OPTIONS: 'framework:module:options',
    MODULE_IMPORTS: 'framework:module:imports',
    MODULE_CONTROLLERS: 'framework:module:controllers',
    MODULE_PROVIDERS: 'framework:module:providers',
    MODULE_EXPORTS: 'framework:module:exports',
    MODULE_ENTITIES: 'framework:module:entities',
    MODULE_REPOSITORIES: 'framework:module:repositories',
    MODULE_CONFIG: 'framework:module:config',
    MODULE_CONFIG_NAMESPACE: 'framework:module:configNamespace',

    // Controller
    CONTROLLER: 'framework:controller',
    CONTROLLER_PREFIX: 'framework:controller:prefix',

    // Events
    EVENT_HANDLERS: 'framework:event:handlers',
    EVENT_TYPE: 'framework:event:type',

    // RPC
    RPC_CONTROLLER: 'framework:rpc:controller',
    RPC_ACTIONS: 'framework:rpc:actions',

    // Guards
    GUARDS: 'framework:guards',

    // Interceptors
    INTERCEPTORS: 'framework:interceptors',

    // Pipes
    PIPES: 'framework:pipes',

    // Parameters
    PARAM_TYPES: 'design:paramtypes',
    PARAMS: 'framework:params',

    // Injectable
    INJECTABLE: 'framework:injectable',
    SCOPE: 'framework:scope',

    // Lifecycle
    ON_READY: 'framework:lifecycle:onready',

    // Cron
    CRON_HANDLERS: 'framework:cron:handlers',
} as const;

// Event Types
export enum EventType {
    CLIENT = 'client',      // From client to server (onNet)
    SERVER = 'server',      // From server to client
    INTERNAL = 'internal',  // Same environment (on)
    NATIVE = 'native',      // FiveM native events
}

// Scopes
export enum Scope {
    SINGLETON = 'singleton',
    TRANSIENT = 'transient',
    REQUEST = 'request',
}

// Parameter Types
export enum ParamType {
    SOURCE = 'source',
    BODY = 'body',
    PARAM = 'param',
    PLAYER = 'player',
    CONTEXT = 'context',
}
