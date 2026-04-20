import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';

/**
 * Copy a template directory recursively, substituting `{{VAR}}` placeholders
 * in file contents and in file/folder names.
 *
 * Placeholder format: `{{NAME}}` or `{{name.nested}}` — simple string replace,
 * no Mustache semantics. Unknown placeholders are left in place.
 *
 * Files with a leading underscore (`_gitignore`) are renamed to dotfiles
 * (`.gitignore`) — this sidesteps npm's habit of stripping dotfiles from
 * published packages.
 */
export interface CopyOptions {
    /** Overwrite existing files. Default: false (throws if target exists). */
    overwrite?: boolean;
    /** Skip paths matching any of these segments. */
    exclude?: string[];
}

export function copyTemplate(
    sourceDir: string,
    targetDir: string,
    variables: Record<string, string>,
    options: CopyOptions = {}
): void {
    if (!existsSync(sourceDir)) {
        throw new Error(`Template directory not found: ${sourceDir}`);
    }

    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    walk(sourceDir, targetDir, sourceDir, variables, options);
}

function walk(
    current: string,
    targetRoot: string,
    sourceRoot: string,
    variables: Record<string, string>,
    options: CopyOptions
): void {
    for (const entry of readdirSync(current)) {
        if (options.exclude?.some((ex) => entry.includes(ex))) continue;

        const srcPath = join(current, entry);
        const rel = relative(sourceRoot, srcPath);
        const destRel = transformPath(rel, variables);
        const destPath = join(targetRoot, destRel);

        const stat = statSync(srcPath);
        if (stat.isDirectory()) {
            if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
            walk(srcPath, targetRoot, sourceRoot, variables, options);
        } else {
            if (existsSync(destPath) && !options.overwrite) {
                throw new Error(`File already exists: ${destPath}`);
            }
            const content = readFileSync(srcPath, 'utf-8');
            const transformed = substitute(content, variables);
            const destDir = dirname(destPath);
            if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
            writeFileSync(destPath, transformed, 'utf-8');
        }
    }
}

/**
 * Rename `_gitignore` → `.gitignore`, `_npmrc` → `.npmrc`, etc.
 * Also substitute `{{VAR}}` in path segments.
 */
function transformPath(path: string, variables: Record<string, string>): string {
    return substitute(path, variables)
        .split(/[\\/]/)
        .map((seg) => (seg.startsWith('_') ? '.' + seg.slice(1) : seg))
        .join('/');
}

function substitute(str: string, variables: Record<string, string>): string {
    return str.replace(/\{\{([\w.]+)\}\}/g, (match, key: string) => {
        return variables[key] ?? match;
    });
}
