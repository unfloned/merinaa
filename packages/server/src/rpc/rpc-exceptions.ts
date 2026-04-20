import { RpcErrorCode } from '@merinaa/core';

/**
 * Base RPC Exception
 */
export class RpcException extends Error {
    public readonly code: string;
    public readonly details?: any;

    constructor(code: string, message: string, details?: any) {
        super(message);
        this.name = 'RpcException';
        this.code = code;
        this.details = details;
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }
}

/**
 * Thrown when an RPC controller is not found
 */
export class RpcControllerNotFoundException extends RpcException {
    constructor(controllerName: string) {
        super(
            RpcErrorCode.CONTROLLER_NOT_FOUND,
            `RPC controller '${controllerName}' not found`
        );
        this.name = 'RpcControllerNotFoundException';
    }
}

/**
 * Thrown when an RPC action is not found
 */
export class RpcActionNotFoundException extends RpcException {
    constructor(controllerName: string, actionName: string) {
        super(
            RpcErrorCode.ACTION_NOT_FOUND,
            `RPC action '${actionName}' not found on controller '${controllerName}'`
        );
        this.name = 'RpcActionNotFoundException';
    }
}

/**
 * Thrown when an RPC call times out
 */
export class RpcTimeoutException extends RpcException {
    constructor(timeout: number) {
        super(RpcErrorCode.TIMEOUT, `RPC call timed out after ${timeout}ms`);
        this.name = 'RpcTimeoutException';
    }
}

/**
 * Thrown when validation fails
 */
export class RpcValidationException extends RpcException {
    constructor(errors: any[]) {
        super(RpcErrorCode.VALIDATION_ERROR, 'Validation failed', { errors });
        this.name = 'RpcValidationException';
    }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RpcRateLimitException extends RpcException {
    constructor() {
        super(RpcErrorCode.RATE_LIMITED, 'Rate limit exceeded. Please try again later.');
        this.name = 'RpcRateLimitException';
    }
}

/**
 * Thrown when user is unauthorized
 */
export class RpcUnauthorizedException extends RpcException {
    constructor(reason?: string) {
        super(
            RpcErrorCode.UNAUTHORIZED,
            reason || 'You are not authorized to perform this action'
        );
        this.name = 'RpcUnauthorizedException';
    }
}

/**
 * Thrown when player is not found
 */
export class RpcPlayerNotFoundException extends RpcException {
    constructor(identifier?: string) {
        super(
            RpcErrorCode.PLAYER_NOT_FOUND,
            identifier ? `Player '${identifier}' not found` : 'Player not found or not loaded'
        );
        this.name = 'RpcPlayerNotFoundException';
    }
}

/**
 * Generic internal error
 */
export class RpcInternalException extends RpcException {
    constructor(message: string, details?: any) {
        super(RpcErrorCode.INTERNAL_ERROR, message, details);
        this.name = 'RpcInternalException';
    }
}
