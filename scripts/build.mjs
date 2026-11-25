// Builds dist/: per-component ES modules, one global script, tokens.css.
// A component's sibling .css is imported as text and becomes a shared
// constructable stylesheet at runtime.
import { build, context } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { writeBarrel } from './barrel.mjs';

const watch = process.argv.includes('--watch');
const modules = await writeBarrel();

const shared = {
  bundle: true,
  loader: { '.css': 'text' },
  target: 'es2022',
  logLevel: 'info'
};

const esm = {
  ...shared,
  entryPoints: ['src/index.js', 'src/core/element.js', 'src/core/form.js', 'src/core/a11y.js', 'src/core/overlay.js', ...modules.map((m) => `src/${m}`)],
  outdir: 'dist/esm',
  outbase: 'src',
  format: 'esm',
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  minify: false
};

const iife = {
  ...shared,
  entryPoints: ['src/index.js'],
  outfile: 'dist/punica-components.min.js',
  format: 'iife',
  globalName: 'Punica',
  minify: true
};

await rm('dist/esm', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src/tokens/tokens.css', 'dist/tokens.css');
await import('./design-tokens.mjs').then(async ({ designTokens }) => {
  await mkdir('dist/tokens', { recursive: true });
  const files = designTokens(await readFile('src/tokens/tokens.css', 'utf8'));
  for (const [scheme, tree] of Object.entries(files)) await writeFile(`dist/tokens/${scheme}.tokens.json`, JSON.stringify(tree, null, 2) + '\n');
});
// Server-side rendering runs in Node from these files as they are
await cp('src/ssr', 'dist/ssr', { recursive: true });

if (watch) {
  for (const options of [esm, iife]) (await context(options)).watch();
} else {
  await build(esm);
  await build(iife);
  // A page that names no charset reads a script as windows-1252: one non-ASCII
  // byte (a regex range of combining marks did it) and the global script did
  // not parse at all.
  const global = await readFile(iife.outfile);
  const at = global.findIndex((byte) => byte > 0x7e || (byte < 0x20 && byte !== 0x0a && byte !== 0x09 && byte !== 0x0d));
  if (at !== -1) throw new Error(`${iife.outfile} has a non-ASCII byte at ${at}: ${global.subarray(Math.max(0, at - 40), at + 10)}`);
}
