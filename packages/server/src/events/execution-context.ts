import { EventType } from '@merinaa/core';
import type { ExecutionContext, Type } from '@merinaa/core';

/**
 * Implementation of ExecutionContext
 */
export class ExecutionContextImpl implements ExecutionContext {
    private data = new Map<string, any>();

    constructor(
        public readonly source: number,
        public readonly event: string,
        public readonly type: EventType,
        public readonly args: any[],
        private readonly controllerClass: Type<any>,
        private readonly handlerMethod: string
    ) {}

    getClass(): Type<any> {
        return this.controllerClass;
    }

    getHandler(): string {
        return this.handlerMethod;
    }

    getData<T = any>(key?: string): T {
        if (key) {
            return this.data.get(key);
        }
        return Object.fromEntries(this.data) as T;
    }

    setData<T = any>(key: string, value: T): void {
        this.data.set(key, value);
    }
}

/**
 * Call handler implementation
 */
export class CallHandlerImpl<T = any> {
    constructor(private readonly fn: () => Promise<T>) {}

    async handle(): Promise<T> {
        return this.fn();
    }
}
