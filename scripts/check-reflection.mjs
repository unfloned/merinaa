import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const packages = ['core', 'server', 'client'];

function countReflected(dir) {
    let count = 0;
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) count += countReflected(path);
        else if (path.endsWith('.js') && readFileSync(path, 'utf8').includes('__type')) count += 1;
    }
    return count;
}

const missing = packages.filter((name) => countReflected(join('packages', name, 'dist')) === 0);
if (missing.length > 0) {
    console.error(`Deepkit reflection missing in: ${missing.join(', ')}. Run "npx deepkit-type-install" before building.`);
    process.exit(1);
}
console.log('Deepkit reflection present in all packages ✓');
