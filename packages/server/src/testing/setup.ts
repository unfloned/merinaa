/**
 * Vitest setup entry point.
 *
 * Import path: `@merinaa/server/testing/setup`
 *
 * Usage in a consumer project's `vitest.config.ts`:
 * ```ts
 * export default defineConfig({
 *   test: {
 *     setupFiles: ['@merinaa/server/testing/setup'],
 *   },
 * });
 * ```
 *
 * Side effect: installs FiveM mock globals (`GetConvar`, `emit`, `onNet`, …)
 * once per test file so framework code can import/run under plain Node.
 */
import { installFivemMocks } from './fivem-mocks';

installFivemMocks();
