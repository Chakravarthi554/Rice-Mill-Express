// Script to find which installed package imports { use } from 'react'
const fs = require('fs');
const path = require('path');

const nodeModulesDir = path.join(__dirname, 'node_modules');
let count = 0;
const results = [];

function searchDir(dir, depth) {
    if (depth > 6) return;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === '.cache' || entry.name === '.git') continue;
                searchDir(fullPath, depth + 1);
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.cjs')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    // Check for: import { use } from 'react' or import { ..., use, ... } from 'react'
                    if (/import\s*\{[^}]*\buse\b[^}]*\}\s*from\s*['"]react['"]/.test(content)) {
                        const relPath = path.relative(nodeModulesDir, fullPath);
                        const pkg = relPath.startsWith('@') ? relPath.split(path.sep).slice(0, 2).join('/') : relPath.split(path.sep)[0];
                        results.push({ file: relPath, package: pkg });
                        console.log('FOUND:', relPath);
                    }
                    // Also check for require-style or re-exports
                    if (/\buse\b.*=.*require\s*\(\s*['"]react['"]\s*\)/.test(content)) {
                        const relPath = path.relative(nodeModulesDir, fullPath);
                        console.log('FOUND (require):', relPath);
                    }
                } catch (e) { /* skip unreadable */ }
            }
        }
    } catch (e) { /* skip */ }
}

console.log('Searching node_modules for packages that import { use } from react...');
console.log('This may take a moment...\n');
searchDir(nodeModulesDir, 0);

console.log('\n--- SUMMARY ---');
if (results.length === 0) {
    console.log('No direct ESM imports of { use } from react found in node_modules.');
    console.log('The import might be coming from compiled/bundled code or conditional imports.');
} else {
    const packages = [...new Set(results.map(r => r.package))];
    console.log('Packages importing { use } from react:', packages.join(', '));
    console.log('\nFull file list:');
    results.forEach(r => console.log('  ', r.file));
}
