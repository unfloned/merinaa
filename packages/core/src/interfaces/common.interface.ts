/**
 * Generic class type
 */
export interface Type<T = any> extends Function {
    new (...args: any[]): T;
}

/**
 * Abstract class type
 */
export interface Abstract<T = any> extends Function {
    prototype: T;
}

/**
 * Logger interface
 */
export interface ILogger {
    log(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    verbose(message: string, ...args: any[]): void;
}

/**
 * Configuration interface
 */
export interface IConfig {
    get<T = any>(key: string): T | undefined;
    get<T = any>(key: string, defaultValue: T): T;
    has(key: string): boolean;
    set(key: string, value: any): void;
}

/**
 * Event emitter interface
 */
export interface IEventEmitter {
    on(event: string, handler: (...args: any[]) => void): void;
    once(event: string, handler: (...args: any[]) => void): void;
    off(event: string, handler: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    removeAllListeners(event?: string): void;
}

/**
 * Async function type
 */
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

/**
 * Class decorator type
 */
export type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;

/**
 * Method decorator type
 */
export type MethodDecorator = <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

/**
 * Parameter decorator type
 */
export type ParameterDecorator = (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
) => void;

/**
 * Property decorator type
 */
export type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
