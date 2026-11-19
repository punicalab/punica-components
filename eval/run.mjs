// Does what we give models make them write correct punica markup?
//
//   node eval/run.mjs                 the plan and its estimated cost; nothing is called
//   node eval/run.mjs --yes           run it (needs ANTHROPIC_API_KEY or `ant auth login`)
//   node eval/run.mjs --yes --only contact-form,chat --models claude-haiku-5-5 --conditions none,llms
//   node eval/run.mjs --score eval/results/<run>.json   re-score saved answers without calling a model
//
// Conditions:
//   none    the task alone; what a model knows of @punica/components 2.0
//   llms    dist/llms.txt in the system prompt
//   tools   llms.txt and the MCP server's tools (search, API, validate), as client tools
//
// Each answer is scored by the validator (src/ai), by rendering it in
// Chromium with the built library (elements left undefined, console errors,
// axe violations) and by the task's own form check. Run `npm run build` first.
import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { knowledge, validate } from '../dist/ai/node.mjs';
import { tasks } from './tasks.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const MODELS = (flag('--models') || 'claude-haiku-5-5,claude-sonnet-5-5').split(',');
const CONDITIONS = (flag('--conditions') || 'none,llms,tools').split(',');
const ONLY = flag('--only')?.split(',');
const TASKS = ONLY ? tasks.filter((t) => ONLY.includes(t.id)) : tasks;
const MAX_TOOL_TURNS = 10;
const PRICE = { 'claude-haiku-5-5': [0.1, 0.5], 'claude-sonnet-5-5': [2, 10], 'claude-opus-5-5': [4, 20] }; // $ per 1M in/out

const llms = await readFile(new URL('../dist/llms.txt', import.meta.url), 'utf8');
const library = await readFile(new URL('../dist/punica-components.min.js', import.meta.url), 'utf8');
const axeSource = await readFile(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

const BASE = 'You are a front-end developer. The project uses @punica/components (custom elements named punica-*), loaded as a global script, so markup needs no import. Answer with exactly one fenced code block (```html, or ```jsx when asked for a React component) holding the complete answer: markup, and a <script> for any behaviour. No explanation outside the block.';

function system(condition) {
  if (condition === 'none') return BASE;
  const extra = condition === 'tools' ? '\n\nBefore answering, look up every element you use with get_component, and run validate_markup on your answer; fix what it reports.' : '';
  return [
    { type: 'text', text: `${BASE}${extra}\n\nThe library's documentation:\n\n${llms}`, cache_control: { type: 'ephemeral' } }
  ];
}

const TOOLS = [
  {
    name: 'search_components',
    description: 'Finds punica-* elements by what they are for ("date range", "side navigation"), best match first.',
    input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
    strict: true
  },
  {
    name: 'get_component',
    description: 'The whole API of punica elements: attributes with their exact values, properties, events, slots, parts.',
    input_schema: { type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } }, required: ['tags'], additionalProperties: false },
    strict: true
  },
  {
    name: 'validate_markup',
    description: 'Checks markup that uses punica elements: unknown tags, attributes, values, slots, events and icon names, with fixes.',
    input_schema: { type: 'object', properties: { code: { type: 'string' }, kind: { type: 'string', enum: ['html', 'jsx', 'vue', 'js'] } }, required: ['code', 'kind'], additionalProperties: false },
    strict: true
  }
];

function runTool(name, input) {
  if (name === 'search_components') return knowledge.search(input.query).map((r) => `${r.tag}: ${r.description}`).join('\n') || 'Nothing matches.';
  if (name === 'get_component') return input.tags.map((t) => knowledge.formatMarkdown(t)).join('\n\n');
  if (name === 'validate_markup') {
    const findings = validate(input.code, { kind: input.kind });
    if (!findings.length) return 'No problems.';
    return findings.map((f) => `line ${f.line} ${f.severity} ${f.rule}: ${f.message}${f.fix ? ` [fix: ${f.fix}]` : ''}`).join('\n');
  }
  return `Unknown tool ${name}`;
}

/** One answer: the final text, token use and tool calls. */
async function generate(client, model, condition, task) {
  const messages = [{ role: 'user', content: task.prompt }];
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const toolCalls = [];
  for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      system: system(condition),
      ...(condition === 'tools' ? { tools: TOOLS } : {}),
      // Claude Sonnet 5.5 can decline a request; the server then answers on its fallback.
      ...(model === 'claude-sonnet-5-5' ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
      messages
    });
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens || 0;
    usage.cacheWrite += response.usage.cache_creation_input_tokens || 0;
    if (response.stop_reason === 'refusal') return { text: '', refused: true, usage, toolCalls };
    if (response.stop_reason !== 'tool_use') {
      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      return { text, stop: response.stop_reason, usage, toolCalls };
    }
    messages.push({ role: 'assistant', content: response.content });
    const results = [];
    for (const block of response.content.filter((b) => b.type === 'tool_use')) {
      toolCalls.push(block.name);
      results.push({ type: 'tool_result', tool_use_id: block.id, content: runTool(block.name, block.input) });
    }
    messages.push({ role: 'user', content: results });
  }
  return { text: '', stop: 'tool-turn-limit', usage, toolCalls };
}

function extractCode(text) {
  const blocks = [...text.matchAll(/```(\w*)\n([\s\S]*?)```/g)];
  return blocks.length ? blocks[blocks.length - 1][2] : text;
}

async function render(browser, code, task) {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e.message)));
  // Scripts that load other copies of the library are the answer's mistake, not the page's.
  const html = code.replace(/<script[^>]*\bsrc=[^>]*><\/script>/gi, '').replace(/^\s*import\s.*$/gm, '');
  try {
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><script>${library}</script></head><body>${html}</body></html>`, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(300);
    const undefinedTags = await page.evaluate(() => [...new Set([...document.querySelectorAll('*')].filter((el) => el.localName.startsWith('punica-') && !customElements.get(el.localName)).map((el) => el.localName))]);
    await page.addScriptTag({ content: axeSource });
    const axe = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'], rules: { 'document-title': { enabled: false }, 'landmark-one-main': { enabled: false }, 'page-has-heading-one': { enabled: false }, region: { enabled: false } } })).violations.map((v) => v.id));
    let formOk = null;
    if (task.form) {
      formOk = await page.evaluate((keys) => {
        const form = document.querySelector('form');
        if (!form) return false;
        const data = new FormData(form);
        return keys.every((k) => data.has(k));
      }, task.form);
    }
    return { undefinedTags, consoleErrors, axe, formOk };
  } catch (error) {
    return { undefinedTags: [], consoleErrors: [...consoleErrors, `render failed: ${error.message}`], axe: [], formOk: task.form ? false : null };
  } finally {
    await page.close();
  }
}

async function score(browser, task, code) {
  const findings = validate(code, { kind: task.kind });
  const errors = findings.filter((f) => f.severity === 'error');
  const rendered = task.kind === 'html' ? await render(browser, code, task) : null;
  const pass = errors.length === 0 && (!rendered || (rendered.undefinedTags.length === 0 && rendered.consoleErrors.length === 0 && rendered.formOk !== false));
  return { pass, errors: errors.length, warnings: findings.length - errors.length, rules: errors.map((f) => f.rule), rendered };
}

function summarize(results) {
  const rows = [];
  for (const model of MODELS) {
    for (const condition of CONDITIONS) {
      const set = results.filter((r) => r.model === model && r.condition === condition && r.score);
      if (!set.length) continue;
      const passed = set.filter((r) => r.score.pass).length;
      const errors = set.reduce((n, r) => n + r.score.errors, 0);
      const undefinedTags = set.reduce((n, r) => n + (r.score.rendered?.undefinedTags.length || 0), 0);
      const axe = set.reduce((n, r) => n + (r.score.rendered?.axe.length || 0), 0);
      const cost = set.reduce((n, r) => n + (r.cost || 0), 0);
      rows.push(`| ${model} | ${condition} | ${passed}/${set.length} | ${(errors / set.length).toFixed(1)} | ${undefinedTags} | ${axe} | $${cost.toFixed(3)} |`);
    }
  }
  const rules = {};
  for (const r of results) for (const rule of r.score?.rules || []) rules[`${r.condition}:${rule}`] = (rules[`${r.condition}:${rule}`] || 0) + 1;
  return [
    '| Model | Condition | Passed | Validator errors per answer | Undefined tags | axe violations | Cost |',
    '|---|---|---|---|---|---|---|',
    ...rows,
    '',
    'Errors by rule (condition:rule count):',
    ...Object.entries(rules).sort((a, b) => b[1] - a[1]).map(([k, n]) => `- ${k} ${n}`)
  ].join('\n');
}

const costOf = (model, u) => {
  const [inPrice, outPrice] = PRICE[model] || [0, 0];
  return ((u.input + u.cacheWrite * 1.25 + u.cacheRead * 0.1) * inPrice + u.output * outPrice) / 1e6;
};

// Re-score saved answers.
if (flag('--score')) {
  const saved = JSON.parse(await readFile(flag('--score'), 'utf8'));
  const browser = await chromium.launch();
  for (const r of saved.results) r.score = await score(browser, tasks.find((t) => t.id === r.task), r.code);
  await browser.close();
  console.log(summarize(saved.results));
  process.exit(0);
}

const runs = MODELS.flatMap((model) => CONDITIONS.flatMap((condition) => TASKS.map((task) => ({ model, condition, task }))));
// A rough ceiling: llms.txt is ~6k tokens, cached after the first call; the tools condition makes several turns.
const estimate = runs.reduce((n, { model, condition }) => {
  const [inPrice, outPrice] = PRICE[model] || [0, 0];
  const turns = condition === 'tools' ? 6 : 1;
  const input = condition === 'none' ? 300 : 7000;
  return n + (turns * input * inPrice + turns * 2500 * outPrice) / 1e6;
}, 0);
console.log(`${runs.length} answers: ${TASKS.length} tasks × ${MODELS.join(', ')} × ${CONDITIONS.join(', ')}. Estimated cost at most $${estimate.toFixed(2)}.`);
if (!args.includes('--yes')) {
  console.log('Nothing was called. Add --yes to run.');
  process.exit(0);
}

const client = new Anthropic();
const browser = await chromium.launch();
const results = [];
for (const { model, condition, task } of runs) {
  process.stdout.write(`${model} ${condition} ${task.id} … `);
  try {
    const answer = await generate(client, model, condition, task);
    const code = extractCode(answer.text);
    const result = { model, condition, task: task.id, code, stop: answer.stop, refused: !!answer.refused, toolCalls: answer.toolCalls, usage: answer.usage, cost: costOf(model, answer.usage) };
    result.score = answer.text ? await score(browser, task, code) : { pass: false, errors: 0, warnings: 0, rules: [], rendered: null };
    results.push(result);
    console.log(result.score.pass ? 'pass' : `fail (${result.score.rules.join(', ') || result.stop || 'render'})`);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      console.log(`\nNo usable credentials: set ANTHROPIC_API_KEY or run \`ant auth login\`. (${error.message})`);
      break;
    }
    console.log(`error: ${error.message}`);
    results.push({ model, condition, task: task.id, error: error.message });
  }
}
await browser.close();

await mkdir(new URL('./results/', import.meta.url), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const summary = summarize(results);
await writeFile(new URL(`./results/${stamp}.json`, import.meta.url), JSON.stringify({ models: MODELS, conditions: CONDITIONS, results }, null, 2));
await writeFile(new URL(`./results/${stamp}.md`, import.meta.url), `# Eval ${stamp}\n\n${summary}\n`);
console.log(`\n${summary}\n\neval/results/${stamp}.json`);
