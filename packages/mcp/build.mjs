// dist/server.mjs (the server with src/ai bundled in), and beside it the
// library's custom-elements.json and guide as the fallback for a project
// that has not installed @punica/components. Run the library's build first.
import { build } from 'esbuild';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const library = new URL('../../', import.meta.url);
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/main.mjs'],
  outfile: 'dist/server.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  packages: 'external',
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'warning'
});
await copyFile(new URL('custom-elements.json', library), 'dist/custom-elements.json');
await copyFile(new URL('src/ai/guide.md', library), 'dist/guide.md');
await copyFile(new URL('LICENSE', library), 'LICENSE');
const { version } = JSON.parse(await readFile(new URL('package.json', library), 'utf8'));
await writeFile('dist/bundled.json', JSON.stringify({ version }) + '\n');
console.log(`dist/server.mjs, bundled @punica/components ${version}`);
