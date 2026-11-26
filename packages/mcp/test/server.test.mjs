import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPunicaServer } from '../src/create.mjs';
import { parseTokens } from '../../../src/ai/tokens.mjs';

const manifest = JSON.parse(readFileSync(new URL('../../../custom-elements.json', import.meta.url), 'utf8'));
const guide = readFileSync(new URL('../../../src/ai/guide.md', import.meta.url), 'utf8');
const tokens = parseTokens(readFileSync(new URL('../../../src/tokens/tokens.css', import.meta.url), 'utf8'));

// The documentation site, as the server fetches it.
const site = {
  'https://docs.test/llms.txt': '# Docs\n\n- [Select](https://docs.test/docs/components/forms/select.md): A list to pick from. Elements: punica-select, punica-option\n',
  'https://docs.test/docs/components/forms/select.md': '# Select\n\n```html\n<punica-select label="Plan"></punica-select>\n```\n',
  'https://docs.test/docs/theme.md': '# Theme\n'
};
const fakeFetch = async (url) => (site[url] ? { ok: true, status: 200, text: async () => site[url] } : { ok: false, status: 404, text: async () => '' });

async function connect(fetchFn = fakeFetch) {
  const server = createPunicaServer({ manifest, guide, tokens, version: '2.0.0', source: 'test', fetch: fetchFn, docsUrl: 'https://docs.test' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const call = async (name, args) => (await client.callTool({ name, arguments: args })).content[0].text;
  return { client, call };
}

test('lists the tools and says to look things up', async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ['get_component', 'get_examples', 'get_guide', 'get_tokens', 'search_components', 'validate_markup']);
  assert.match(client.getInstructions(), /never write a punica tag/);
});

test('search_components and get_component', async () => {
  const { call } = await connect();
  assert.match(await call('search_components', { query: 'modal' }), /punica-dialog/);
  // The functions of an element's module are named in the search, before get_component
  const confirm = await call('search_components', { query: 'confirm dialog', limit: 3 });
  // with its signature: runs that only searched grepped the .d.ts for it
  assert.match(confirm, /punica-alert-dialog: [^\n]* Script: `import \{ confirm \} from '@punica\/components'`; `confirm\(options\?: \{ heading\?: string, [^`]*\}\): Promise<boolean>`\./);
  assert.match(await call('search_components', { query: 'toast notification', limit: 3 }), /Script: `import \{ toast \} from '@punica\/components'`; `toast\(message: string, /);
  assert.doesNotMatch(confirm, /punica-dialog-header: [^\n]*Script/);
  const api = await call('get_component', { tags: ['select', 'punica-modal'] });
  assert.match(api, /## <punica-select>/);
  assert.match(api, /punica-modal is the 1.x name/);
  assert.match(api, /### CSS parts/);

  // Brief: what markup needs, without what only styling needs
  const brief = await call('get_component', { tags: ['select'], brief: true });
  assert.match(brief, /## <punica-select>/);
  assert.match(brief, /`punica-change`/);
  assert.doesNotMatch(brief, /### CSS parts|### CSS custom properties|### Custom states/);
  assert.match(brief, /For styling: /);
});

test('get_component shows the functions of the module of the element', async () => {
  const { call } = await connect();

  // confirm() and toast() were only named in descriptions: runs grepped the .d.ts for them
  const dialog = await call('get_component', { tags: ['punica-alert-dialog'], brief: true });
  assert.match(dialog, /### Functions\n\n`import \{ confirm \} from '@punica\/components';`/);
  assert.match(dialog, /confirm\(options\?: \{ heading\?: string, .*\}\): Promise<boolean>/);

  // The toast and its toaster share a folder: both show toast()
  const toasts = await call('get_component', { tags: ['punica-toast', 'punica-toaster'], brief: true });
  assert.equal(toasts.match(/toast\(message: string, options\?: /g).length, 2);

  // A helper module of a folder, which defines no element, is not part of the API
  const select = await call('get_component', { tags: ['punica-date-picker', 'punica-select'] });
  assert.doesNotMatch(select, /### Functions/);
});

test('get_component says how the element is written in JSX', async () => {
  const { call } = await connect();

  // Runs read dist/types/react.d.ts to learn how punica-* tags and their events are typed in JSX
  const input = await call('get_component', { tags: ['punica-input'], brief: true });
  assert.match(input, /### In React \(JSX\)\n\n`import type \{\} from '@punica\/components\/react';`/);
  assert.match(input, /`<punica-input onpunica-input=\{\(event\) => setValue\(event\.detail\.value\)\} \/>`, `event` a `CustomEvent<\{ value: string \}>`/);
  assert.match(input, /`label-clear` or, in React 19, `labelClear`/);

  // No events: no event example
  const icon = await call('get_component', { tags: ['punica-icon'], brief: true });
  assert.match(icon, /### In React \(JSX\)/);
  assert.doesNotMatch(icon, /Events are `on`/);
});

test('get_component shows the type of each event detail', async () => {
  const { call } = await connect();

  // Runs read react.d.ts to learn what an event's detail holds
  const select = await call('get_component', { tags: ['punica-select'], brief: true });
  assert.match(select, /\| Event \| Detail \| Description \|/);
  assert.match(select, /\| `punica-change` \| `\{ value: string \\\| string\[\] \\\| null \}` \|/);
  // An event that carries nothing has an empty cell
  assert.match(select, /\| `punica-open` \| {2}\|/);
});

test('validate_markup reports problems with fixes', async () => {
  const { call } = await connect();
  assert.match(await call('validate_markup', { code: '<punica-button variant="filled">Save</punica-button>' }), /No problems/);
  const report = await call('validate_markup', { code: '<punica-buton fullWidth></punica-buton>' });
  assert.match(report, /1 error/);
  assert.match(report, /\[fix: punica-button\]/);
});

test('get_examples finds the page in the site index, and falls back to the API offline', async () => {
  const { call } = await connect();
  assert.match(await call('get_examples', { tag: 'punica-option' }), /<punica-select label="Plan">/);
  const offline = await connect(async () => {
    throw new Error('offline');
  });
  assert.match(await offline.call('get_examples', { tag: 'select' }), /could not be fetched \(offline\)[\s\S]*## <punica-select>/);
});

test('a page the site answers with HTML is not taken for Markdown', async () => {
  const html = async () => ({ ok: true, status: 200, headers: new Headers({ 'content-type': 'text/html' }), text: async () => '<!doctype html><html></html>' });
  const { call } = await connect(html);
  const guide = await call('get_guide', { topic: 'forms' });
  assert.match(guide, /not on the documentation site yet/);
  assert.match(guide, /Rules that hold for every element/);
  assert.match(await call('get_examples', { tag: 'select' }), /could not be fetched[\s\S]*## <punica-select>/);
});

test('get_guide and the resources', async () => {
  const { client, call } = await connect();
  assert.match(await call('get_guide', {}), /Rules that hold for every element/);
  assert.match(await call('get_guide', { topic: 'theme' }), /# Theme/);
  const { resources } = await client.listResources();
  assert.ok(resources.some((r) => r.uri === 'punica://component/punica-button'));
  const read = await client.readResource({ uri: 'punica://component/punica-switch' });
  assert.match(read.contents[0].text, /## <punica-switch>/);
});

test('get_tokens lists the design tokens and validate_markup checks var() names', async () => {
  const { call } = await connect();
  const all = await call('get_tokens', {});
  assert.match(all, /`--punica-color-primary` \| light `#[0-9a-f]{6}`, dark `#[0-9a-f]{6}`/);
  assert.match(all, /### spacing/);
  const space = await call('get_tokens', { query: 'space' });
  assert.match(space, /`--punica-space-24` \| `24px`/);
  assert.doesNotMatch(space, /--punica-color-/);
  assert.match(await call('get_tokens', { query: 'nothing-like-this' }), /No token matches/);
  const checked = await call('validate_markup', { code: '.a { gap: var(--punica-spce-16); color: var(--punica-color-text); }', kind: 'css' });
  assert.match(checked, /warning unknown-token: `--punica-spce-16`.*Did you mean `--punica-space-16`/);
  assert.doesNotMatch(checked, /--punica-color-text/);
});

test('the instructions name the imports', async () => {
  const { client } = await connect();
  const text = client.getInstructions();
  assert.match(text, /import '@punica\/components'/);
  assert.match(text, /`confirm`, `qrMatrix` and `toast` are named exports/);
  // with their signatures, so the options are not grepped from the .d.ts
  assert.match(text, /`confirm\(options\?: \{[^`]*confirmLabel\?: string[^`]*\}\): Promise<boolean>`/);
  assert.match(text, /`toast\(message: string, options\?: \{[^`]*duration\?: number[^`]*\}\): HTMLElement`/);
  assert.match(text, /import type \{\} from '@punica\/components\/react'/);
});
