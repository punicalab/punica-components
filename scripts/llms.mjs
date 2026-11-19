// Writes what tools and models read, from custom-elements.json and
// src/ai/guide.md (run after `npm run manifest`):
//
//   dist/ai/index.mjs, dist/ai/node.mjs   the API and validator (`@punica/components/ai`)
//   dist/llms.txt                         the guide and one line per element
//   dist/llms-full.txt                    the guide and every element's whole API
import { build } from 'esbuild';
import { copyFile, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createKnowledge } from '../src/ai/knowledge.mjs';

await mkdir('dist/ai', { recursive: true });
await build({
  entryPoints: ['src/ai/index.mjs', 'src/ai/node.mjs'],
  outdir: 'dist/ai',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  logLevel: 'warning'
});

for (const f of ['index.d.ts', 'node.d.ts']) await copyFile(`src/ai/${f}`, `dist/ai/${f}`);

const manifest = JSON.parse(await readFile('custom-elements.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const knowledge = createKnowledge(manifest);
const guide = (await readFile('src/ai/guide.md', 'utf8')).trim();
const header = `<!-- @punica/components ${pkg.version}: ${knowledge.tags.length} elements. Generated from custom-elements.json; https://components.punicalab.com -->`;

const index = [header, '', guide, '', '## Elements', '', 'Every element by tag; `npx punica-components info <tag>` or `llms-full.txt` has its whole API.', '', ...knowledge.list().map((e) => `- \`${e.tag}\`: ${e.description}`)].join('\n');
await writeFile('dist/llms.txt', index + '\n');

const full = [header, '', guide, '', '# Elements', '', ...knowledge.tags.map((tag) => knowledge.formatMarkdown(tag) + '\n')].join('\n');
await writeFile('dist/llms-full.txt', full);
console.log(`dist/llms.txt ${Math.round(index.length / 1024)} KB, dist/llms-full.txt ${Math.round(full.length / 1024)} KB, dist/ai`);
