// @punica/components/ssr, end to end: rendered in Node, then drawn in
// Chromium without the script and with it arriving late.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createRenderer, renderToString } from '../dist/ssr/index.js';

const FORM = `<form>
  <punica-field label="Name"><punica-input name="name"></punica-input></punica-field>
  <punica-field label="Plan"><punica-select name="plan"><punica-option value="basic">Basic</punica-option><punica-option value="pro">Pro</punica-option></punica-select></punica-field>
  <punica-checkbox name="terms">I agree &amp; accept</punica-checkbox>
  <punica-button type="submit">Save</punica-button>
</form>`;
const tokens = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('../dist/punica-components.min.js', import.meta.url));
const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${tokens} body{margin:24px;font:16px system-ui}</style></head>
<body>${body}<p id="after">After the form.</p><script src="/lib.js"></script></body></html>`;

let renderer;
let browser;
before(async () => {
  renderer = await createRenderer();
  browser = await chromium.launch();
});
after(async () => {
  await renderer?.close();
  await browser?.close();
});

async function open(html, { javaScriptEnabled = true } = {}) {
  const context = await browser.newContext({ javaScriptEnabled });
  await context.route('http://ssr.test/', (r) => r.fulfill({ contentType: 'text/html', body: page(html) }));
  await context.route('http://ssr.test/lib.js', async (r) => {
    await new Promise((t) => setTimeout(t, 300));
    await r.fulfill({ contentType: 'text/javascript', body: script });
  });
  const p = await context.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  return { context, page: p, errors };
}

test('every punica element gets its shadow root as Declarative Shadow DOM', async () => {
  const html = await renderer.render(FORM);
  for (const tag of ['punica-field', 'punica-input', 'punica-select', 'punica-checkbox', 'punica-button']) {
    assert.match(html, new RegExp(`<${tag}[^>]*><template shadowrootmode="open"`), tag);
  }
  // What the elements draw from their attributes is there: the label, the chosen option
  assert.match(html, />Name</);
  assert.match(html, /Basic/);
  // Text is escaped; the light DOM is kept
  assert.match(html, /I agree &amp; accept/);
  assert.match(html, /<punica-option value="pro"[^>]*>(<template[\s\S]*?<\/template>)?Pro<\/punica-option>/);
  // The stylesheets' own text, not a re-serialised one
  assert.match(html, /light-dark\(|var\(--punica-/);
});

test('without the script the elements are drawn', async () => {
  const { context, page: p } = await open(await renderer.render(FORM), { javaScriptEnabled: false });
  await p.goto('http://ssr.test/');
  const box = await p.locator('punica-input').boundingBox();
  assert.ok(box.height >= 28, `the input has its height (${box.height})`);
  const label = await p.evaluate(() => document.querySelector('punica-field').shadowRoot.textContent);
  assert.match(label, /Name/);
  await context.close();
});

test('nothing moves when the script arrives, and the form works', async () => {
  const { context, page: p, errors } = await open(await renderer.render(FORM));
  await p.goto('http://ssr.test/', { waitUntil: 'commit' });
  await p.waitForSelector('#after');
  const before = (await p.locator('#after').boundingBox()).y;
  await p.waitForFunction(() => customElements.get('punica-input'));
  await p.waitForTimeout(100);
  const upgraded = (await p.locator('#after').boundingBox()).y;
  assert.equal(upgraded, before);

  await p.locator('punica-input').click();
  await p.keyboard.type('Ada');
  await p.locator('punica-checkbox').click();
  const values = await p.evaluate(() => Object.fromEntries(new FormData(document.querySelector('form'))));
  assert.deepEqual(values, { name: 'Ada', plan: 'basic', terms: 'on' });
  assert.deepEqual(errors, []);
  await context.close();
});

test('without SSR the same page moves (what the renderer is for)', async () => {
  const { context, page: p } = await open(FORM);
  await p.goto('http://ssr.test/', { waitUntil: 'commit' });
  await p.waitForSelector('#after');
  const before = (await p.locator('#after').boundingBox()).y;
  await p.waitForFunction(() => customElements.get('punica-input'));
  await p.waitForTimeout(100);
  assert.ok((await p.locator('#after').boundingBox()).y > before);
  await context.close();
});

test('renderToString starts and closes a renderer', async () => {
  const html = await renderToString('<punica-button>Go</punica-button>');
  assert.match(html, /^<punica-button><template shadowrootmode="open">/);
});

test('what was typed or checked before the script came is kept', async () => {
  const html = await renderer.render('<form><punica-input name="name"></punica-input><punica-checkbox name="terms">ok</punica-checkbox></form>');
  const { context, page: p, errors } = await open(html);
  await p.goto('http://ssr.test/', { waitUntil: 'commit' });
  await p.waitForSelector('punica-checkbox');
  assert.equal(await p.evaluate(() => !!customElements.get('punica-input')), false, 'typed before the script');
  await p.locator('punica-input input').click();
  await p.keyboard.type('early');
  await p.locator('punica-checkbox input').check();
  assert.equal(await p.evaluate(() => !!customElements.get('punica-input')), false, 'still before the script');
  await p.waitForFunction(() => customElements.get('punica-input'));
  await p.waitForTimeout(100);
  assert.equal(await p.evaluate(() => document.querySelector('punica-input').value), 'early');
  assert.equal(await p.evaluate(() => document.querySelector('punica-checkbox').checked), true);
  const values = await p.evaluate(() => Object.fromEntries(new FormData(document.querySelector('form'))));
  assert.deepEqual(values, { name: 'early', terms: 'on' });
  assert.equal(await p.evaluate(() => document.activeElement?.localName), 'punica-checkbox');
  assert.deepEqual(errors, []);
  await context.close();
});
