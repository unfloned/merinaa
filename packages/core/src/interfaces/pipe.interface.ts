/**
 * Pipe metadata
 */
export interface ArgumentMetadata {
    /**
     * Type of the parameter (body, param, source, etc.)
     */
    type: string;

    /**
     * Metatype of the parameter (class reference if available)
     */
    metatype?: new (...args: any[]) => any;

    /**
     * Name of the parameter (for @Param decorator)
     */
    data?: string;
}

/**
 * Pipe interface - transforms/validates input data
 */
export interface Pipe<T = any, R = any> {
    /**
     * Transforms the input value
     * @param value - The input value to transform
     * @param metadata - Metadata about the argument
     * @returns The transformed value
     */
    transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

/**
 * Validation error structure
 */
export interface ValidationError {
    property: string;
    constraints: Record<string, string>;
    children?: ValidationError[];
}
