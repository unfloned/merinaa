import { installFivemMocks } from './fivem-mocks';

/**
 * Runs once per test file before any tests.
 * Installs FiveM runtime globals so framework code can import/run.
 */
installFivemMocks();
