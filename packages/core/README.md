# @merinaa/core

Core types, decorators, and interfaces for the Merinaa framework.

Ships the primitives every other Merinaa package depends on:
`@Module`, `@Controller`, `@Injectable`, `@OnClient`, `@OnServer`, `@On`,
`@OnReady`, `@Guard`, `@Interceptor`, `@Pipe`, parameter decorators
(`@Source`, `@Body`, `@Param`), RPC decorators, metadata keys, and
lifecycle interfaces.

## Install

```bash
npm install @merinaa/core reflect-metadata
```

`reflect-metadata` is a peer dependency — your app must import it once at
the top of its entrypoint.

## Usage

```ts
import 'reflect-metadata';
import { Module, Controller, OnClient, Source } from '@merinaa/core';

@Controller()
export class PlayerController {
    @OnClient('player:ping')
    pong(@Source() src: number) {
        return `pong to ${src}`;
    }
}

@Module({
    controllers: [PlayerController],
})
export class PlayerModule {}
```

You almost never install this package directly — depend on
[`@merinaa/server`](../server) or [`@merinaa/client`](../client) which
re-export everything you need.

## License

MIT
