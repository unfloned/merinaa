import { Injectable } from '@merinaa/core';
import { LoggerService } from '@merinaa/server';

@Injectable()
export class HelloService {
    constructor(private logger: LoggerService) {}

    greet(name: string): string {
        const message = `Hello, ${name}!`;
        this.logger.info('HelloService', message);
        return message;
    }
}
