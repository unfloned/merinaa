/**
 * RPC Request structure sent from client to server
 */
export interface RpcRequest {
    /** Unique request ID for response matching */
    id: string;
    /** Controller name */
    controller: string;
    /** Action/method name */
    action: string;
    /** Arguments to pass to the action */
    args: any[];
    /** Timestamp of request */
    timestamp: number;
}

/**
 * RPC Response structure sent from server to client
 */
export interface RpcResponse {
    /** Request ID this response is for */
    id: string;
    /** Whether the call was successful */
    success: boolean;
    /** Result data (if successful) */
    data?: any;
    /** Error information (if failed) */
    error?: RpcError;
    /** Timestamp of response */
    timestamp: number;
}

/**
 * RPC Error structure
 */
export interface RpcError {
    /** Error code */
    code: string;
    /** Human-readable message */
    message: string;
    /** Additional details */
    details?: any;
    /** Stack trace (only in development) */
    stack?: string;
}

/**
 * RPC Error codes
 */
export enum RpcErrorCode {
    /** Controller not found */
    CONTROLLER_NOT_FOUND = 'RPC_CONTROLLER_NOT_FOUND',
    /** Action not found on controller */
    ACTION_NOT_FOUND = 'RPC_ACTION_NOT_FOUND',
    /** Request timed out */
    TIMEOUT = 'RPC_TIMEOUT',
    /** Validation failed */
    VALIDATION_ERROR = 'RPC_VALIDATION_ERROR',
    /** Rate limit exceeded */
    RATE_LIMITED = 'RPC_RATE_LIMITED',
    /** Unauthorized access */
    UNAUTHORIZED = 'RPC_UNAUTHORIZED',
    /** Internal server error */
    INTERNAL_ERROR = 'RPC_INTERNAL_ERROR',
    /** Player not found/loaded */
    PLAYER_NOT_FOUND = 'RPC_PLAYER_NOT_FOUND',
}

/**
 * RPC Call context passed to handlers
 */
export interface RpcContext {
    /** Player source ID */
    source: number;
    /** Request ID */
    requestId: string;
    /** Controller name */
    controller: string;
    /** Action name */
    action: string;
    /** Original request timestamp */
    timestamp: number;
}

/**
 * RPC Handler function type
 */
export type RpcHandler = (context: RpcContext, ...args: any[]) => Promise<any>;

/**
 * Registered RPC action info
 */
export interface RegisteredRpcAction {
    controller: string;
    action: string;
    handler: RpcHandler;
    options: {
        timeout: number;
        validate: boolean;
        rateLimit: number;
    };
}

/**
 * RPC Client options
 */
export interface RpcClientOptions {
    /** Default timeout for all calls (ms) */
    defaultTimeout?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Retry failed calls */
    retryOnError?: boolean;
    /** Number of retry attempts */
    maxRetries?: number;
}

/**
 * Pending RPC call tracker
 */
export interface PendingRpcCall {
    id: string;
    controller: string;
    action: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: ReturnType<typeof setTimeout>;
    startTime: number;
}
