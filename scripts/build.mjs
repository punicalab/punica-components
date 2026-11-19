// Builds dist/: per-component ES modules, one global script, tokens.css.
// A component's sibling .css is imported as text and becomes a shared
// constructable stylesheet at runtime.
import { build, context } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
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

if (watch) {
  for (const options of [esm, iife]) (await context(options)).watch();
} else {
  await build(esm);
  await build(iife);
}
