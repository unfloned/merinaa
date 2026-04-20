import { Injectable } from '@merinaa/core';
import { ConfigService } from '@merinaa/server';

@Injectable()
export class {{MODULE_PASCAL}}Service {
    constructor(private readonly config: ConfigService) {}
}
