import { Injectable } from '@merinaa/core';
import type { Pipe, ArgumentMetadata, ValidationError } from '@merinaa/core';
import { isNil, isObject } from '@merinaa/core';

/**
 * Simple validation pipe
 * For production, consider integrating with a validation library
 */
@Injectable()
export class ValidationPipe implements Pipe {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        if (isNil(value)) {
            throw new ValidationException([
                {
                    property: metadata.data || 'value',
                    constraints: { isNotEmpty: 'Value should not be empty' },
                },
            ]);
        }

        return value;
    }
}

/**
 * Pipe that transforms values to the expected type
 */
@Injectable()
export class TransformPipe implements Pipe {
    transform(value: any, metadata: ArgumentMetadata): any {
        const { metatype } = metadata;

        if (!metatype || !this.shouldTransform(metatype)) {
            return value;
        }

        return this.transformToType(value, metatype);
    }

    private shouldTransform(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }

    private transformToType(value: any, metatype: any): any {
        if (metatype === Number) {
            return Number(value);
        }
        if (metatype === String) {
            return String(value);
        }
        if (metatype === Boolean) {
            if (value === 'true' || value === '1' || value === true) return true;
            if (value === 'false' || value === '0' || value === false) return false;
            return Boolean(value);
        }
        return value;
    }
}

/**
 * Pipe that validates required fields
 */
@Injectable()
export class RequiredFieldsPipe implements Pipe {
    constructor(private fields: string[]) {}

    transform(value: any, metadata: ArgumentMetadata): any {
        if (!isObject(value)) {
            throw new ValidationException([
                {
                    property: 'body',
                    constraints: { isObject: 'Value must be an object' },
                },
            ]);
        }

        const errors: ValidationError[] = [];

        for (const field of this.fields) {
            if (isNil((value as any)[field])) {
                errors.push({
                    property: field,
                    constraints: { isRequired: `${field} is required` },
                });
            }
        }

        if (errors.length > 0) {
            throw new ValidationException(errors);
        }

        return value;
    }
}

/**
 * Validation exception
 */
export class ValidationException extends Error {
    constructor(public readonly errors: ValidationError[]) {
        super('Validation failed');
        this.name = 'ValidationException';
    }

    /**
     * Get formatted error messages
     */
    getMessages(): string[] {
        const messages: string[] = [];

        for (const error of this.errors) {
            for (const constraint of Object.values(error.constraints)) {
                messages.push(`${error.property}: ${constraint}`);
            }
        }

        return messages;
    }
}

/**
 * Factory for creating a required fields pipe
 */
export function RequireFields(...fields: string[]): new () => Pipe {
    return class extends RequiredFieldsPipe {
        constructor() {
            super(fields);
        }
    };
}
