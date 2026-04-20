// Re-export commonly used types
export * from '../interfaces/player.interface';
export * from '../interfaces/common.interface';

/**
 * FiveM native types (simplified)
 */
export type CitizenSource = number;

/**
 * Event handler function type
 */
export type EventHandler = (...args: any[]) => void | Promise<void>;

/**
 * Callback function type
 */
export type CallbackFn<T = any> = (result: T) => void;

/**
 * Async callback type
 */
export type AsyncCallbackFn<T = any, R = any> = (data: T) => Promise<R> | R;

/**
 * Config value types
 */
export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray;
export type ConfigObject = { [key: string]: ConfigValue };
export type ConfigArray = ConfigValue[];

/**
 * Database ID type
 */
export type DatabaseId = string;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Maybe type helper (value can be undefined)
 */
export type Maybe<T> = T | undefined;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific keys optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Constructor type
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Function type
 */
export type Func<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => TReturn;

/**
 * Async function type
 */
export type AsyncFunc<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;
