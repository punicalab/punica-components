// Moves a source tree from @punica/components 1.x to 2.0 as far as a text
// rewrite safely can, and lists the rest for a person.
//
//   node scripts/codemod-2.0.mjs <dir> [--write]
//
// Rewritten: design tokens (--primary-main → --punica-color-primary …) and
// the tags that were renamed one to one. Reported, never rewritten: removed
// tags, 1.x event names, 1.x attribute spellings, the global `Toast` and the
// `build.min.js` script. Without --write nothing is changed.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { transform } from './codemod-rules.mjs';

const [dir, ...flags] = process.argv.slice(2);
if (!dir) {
  console.error('usage: node scripts/codemod-2.0.mjs <dir> [--write]');
  process.exit(2);
}
const write = flags.includes('--write');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.ejs', '.css', '.scss', '.vue', '.svelte', '.md']);
const SKIP = new Set(['node_modules', 'dist', '.git', 'build', 'coverage']);

async function* walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(folder, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(extname(entry.name))) yield full;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let files = 0;
  let total = 0;
  let manual = 0;
  for await (const file of walk(dir)) {
    const before = await readFile(file, 'utf8');
    if (!/punica|--[a-z]/.test(before)) continue;
    const result = transform(before);
    if (!result.changes && !result.notes.length) continue;
    files++;
    total += result.changes;
    manual += result.notes.length;
    const name = relative(dir, file);
    if (result.changes) console.log(`${write ? 'rewrote' : 'would rewrite'} ${name}: ${result.changes} changes`);
    for (const n of result.notes) console.log(`  ${name}:${n.line}  ${n.note}`);
    if (write && result.changes) await writeFile(file, result.text);
  }
  console.log(`${files} files, ${total} rewrites${write ? '' : ' (dry run, pass --write)'}, ${manual} places for a person`);
}
