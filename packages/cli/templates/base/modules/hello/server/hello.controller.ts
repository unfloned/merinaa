import { Controller, OnClient, UseGuards } from '@merinaa/core';
import { HelloService } from './hello.service';
import { HelloGuard } from './hello.guard';

/**
 * Hello — example controller.
 *
 * `@UseGuards(HelloGuard)` on the class means every `@OnClient` handler
 * below goes through the guard before running. Use this pattern on
 * privileged endpoints (admin commands, money transfers, etc.) to keep
 * their permission checks out of the handler body.
 */
@Controller()
@UseGuards(HelloGuard)
export class HelloController {
    constructor(private hello: HelloService) {}

    @OnClient('hello:greet')
    greet(src: number, name: string): string {
        return this.hello.greet(name);
    }
}
