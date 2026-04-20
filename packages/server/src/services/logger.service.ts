import { Injectable } from '@merinaa/core';
import type { ILogger } from '@merinaa/core';

/**
 * Log levels
 */
export enum LogLevel {
    DEBUG = 0,
    VERBOSE = 1,
    LOG = 2,
    WARN = 3,
    ERROR = 4,
}

/**
 * Logger service for application-wide logging
 */
@Injectable()
export class LoggerService implements ILogger {
    private level: LogLevel = LogLevel.LOG;
    private prefix = '[Framework]';

    /**
     * Set the log level
     */
    setLevel(level: LogLevel): void {
        this.level = level;
    }

    /**
     * Set the log prefix
     */
    setPrefix(prefix: string): void {
        this.prefix = prefix;
    }

    /**
     * Log a debug message
     */
    debug(context: string, message: string, ...args: any[]): void {
        if (this.level <= LogLevel.DEBUG) {
            console.log(`${this.prefix} [DEBUG] [${context}] ${message}`, ...args);
        }
    }

    /**
     * Log a verbose message
     */
    verbose(context: string, message: string, ...args: any[]): void {
        if (this.level <= LogLevel.VERBOSE) {
            console.log(`${this.prefix} [VERBOSE] [${context}] ${message}`, ...args);
        }
    }

    /**
     * Log a standard message
     */
    log(context: string, message: string, ...args: any[]): void {
        if (this.level <= LogLevel.LOG) {
            console.log(`${this.prefix} [${context}] ${message}`, ...args);
        }
    }

    /**
     * Log an info message (alias for log)
     */
    info(context: string, message: string, ...args: any[]): void {
        this.log(context, message, ...args);
    }

    /**
     * Log a warning
     */
    warn(context: string, message: string, ...args: any[]): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(`${this.prefix} [WARN] [${context}] ${message}`, ...args);
        }
    }

    /**
     * Log an error
     */
    error(context: string, message: string, ...args: any[]): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(`${this.prefix} [ERROR] [${context}] ${message}`, ...args);
        }
    }

    /**
     * Create a scoped logger for a specific context
     */
    createScoped(context: string): ScopedLogger {
        return new ScopedLogger(this, context);
    }
}

/**
 * Scoped logger with a fixed context
 */
export class ScopedLogger {
    constructor(
        private logger: LoggerService,
        private context: string
    ) {}

    debug(message: string, ...args: any[]): void {
        this.logger.debug(this.context, message, ...args);
    }

    verbose(message: string, ...args: any[]): void {
        this.logger.verbose(this.context, message, ...args);
    }

    log(message: string, ...args: any[]): void {
        this.logger.log(this.context, message, ...args);
    }

    info(message: string, ...args: any[]): void {
        this.logger.info(this.context, message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        this.logger.warn(this.context, message, ...args);
    }

    error(message: string, ...args: any[]): void {
        this.logger.error(this.context, message, ...args);
    }
}
