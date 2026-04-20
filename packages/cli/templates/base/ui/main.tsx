/**
 * NUI entry for Vite.
 *
 * All UI — pages, overlays, framework primitives — is wired up by the
 * generated `modules/.merinaa/ui.ts` file (produced by
 * `scripts/generate-module-registry.js`). This entry only loads the root
 * stylesheet and imports the generated registry, which calls
 * `createUI({ modules }).mount('#root')` itself.
 */
import 'reflect-metadata';
import './styles.css';
import '@modules/.merinaa/ui';
