#!/usr/bin/env node
// punica-components: look up an element and check markup that uses them.
//
//   punica-components search <words>        elements that match, best first
//   punica-components info <tag>            one element's whole API, as Markdown
//   punica-components info <tag> --brief    what writing markup needs: no CSS parts, properties or states
//   punica-components list                  every element, one line each
//   punica-components guide                 the rules every element follows
//   punica-components validate <files…|->   tags, attributes, values, slots, events, icons
//   punica-components migrate <dir>         the 1.x → 2.0 codemod
import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { knowledge, validate, DOCS_URL } from '../dist/ai/node.mjs';

const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const args = rest.filter((a) => !a.startsWith('--'));
const json = flags.has('--json');
const brief = flags.has('--brief');
const out = (value) => console.log(json ? JSON.stringify(value, null, 2) : value);

const EXTENSIONS = new Set(['.html', '.htm', '.js', '.mjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro', '.md', '.mdx', '.css', '.scss', '.less']);
const KIND = { '.jsx': 'jsx', '.tsx': 'jsx', '.vue': 'vue', '.js': undefined, '.ts': undefined, '.css': 'css', '.scss': 'css', '.less': 'css' };

const commands = {
  search() {
    if (!args.length) return usage(2);
    const results = knowledge.search(args.join(' '), Number(option('--limit')) || 10);
    if (json) return out(results);
    if (!results.length) return console.log(`Nothing matches "${args.join(' ')}". \`punica-components list\` shows every element.`);
    for (const r of results) console.log(`${r.tag.padEnd(34)} ${r.description}`);
  },

  info() {
    if (!args.length) return usage(2);
    for (const tag of args) {
      const element = knowledge.get(tag);
      if (json) out(element || { error: knowledge.formatMarkdown(tag) });
      else console.log(knowledge.formatMarkdown(tag, { brief }) + '\n');
      if (!element) process.exitCode = 1;
    }
  },

  list() {
    const all = knowledge.list();
    if (json) return out(all);
    for (const e of all) console.log(`${e.tag.padEnd(34)} ${e.description}`);
  },

  async guide() {
    console.log(await readFile(new URL('../dist/llms.txt', import.meta.url), 'utf8').then((t) => t.split('\n## Elements')[0]));
  },

  async validate() {
    if (!args.length) return usage(2);
    const results = [];
    for (const target of args) {
      if (target === '-') {
        results.push({ file: '<stdin>', findings: validate(await readStdin(), kindOption()) });
        continue;
      }
      for (const file of await files(target)) {
        const kind = kindOption().kind || KIND[extname(file)];
        results.push({ file: relative(process.cwd(), file) || file, findings: validate(await readFile(file, 'utf8'), kind ? { kind } : {}) });
      }
    }
    const errors = results.reduce((n, r) => n + r.findings.filter((f) => f.severity === 'error').length, 0);
    const warnings = results.reduce((n, r) => n + r.findings.filter((f) => f.severity === 'warning').length, 0);
    if (json) out({ errors, warnings, files: results.filter((r) => r.findings.length) });
    else {
      for (const { file, findings } of results) {
        for (const f of findings) console.log(`${file}:${f.line}:${f.column}  ${f.severity.padEnd(7)} ${f.rule.padEnd(22)} ${f.message}${f.fix ? `  [fix: ${f.fix}]` : ''}`);
      }
      console.log(`${results.length} file${results.length === 1 ? '' : 's'}, ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`);
    }
    if (errors) process.exitCode = 1;
  },

  migrate() {
    const script = fileURLToPath(new URL('../scripts/codemod-2.0.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [script, ...rest], { stdio: 'inherit' });
    process.exitCode = result.status ?? 1;
  }
};

function option(name) {
  const i = rest.indexOf(name);
  return i === -1 ? undefined : rest[i + 1];
}

function kindOption() {
  const kind = rest.find((a) => a.startsWith('--kind='))?.slice(7);
  return kind ? { kind } : {};
}

async function files(target) {
  const info = await stat(target).catch(() => null);
  if (!info) {
    console.error(`No such file or directory: ${target}`);
    process.exitCode = 2;
    return [];
  }
  if (info.isFile()) return [target];
  const found = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'dist') continue;
    const path = join(target, entry.name);
    if (entry.isDirectory()) found.push(...(await files(path)));
    else if (EXTENSIONS.has(extname(entry.name))) found.push(path);
  }
  return found;
}

async function readStdin() {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text;
}

function usage(code) {
  console.log(`punica-components: look up @punica/components elements and check markup that uses them.

  search <words>          elements that match, best first (--limit n)
  info <tag…>             an element's attributes, properties, events, slots, parts;
                          --brief leaves out what only styling needs
  list                    every element
  guide                   the rules every element follows
  validate <files|dirs|->  check tags, attributes, values, slots, events and icon names;
                          exits 1 on an error (--kind=html|jsx|vue|js)
  migrate <dir> [--write] move 1.x markup and tokens to 2.0

  --json                  machine-readable output
Docs and live examples: ${DOCS_URL}`);
  process.exitCode = code;
}

const run = commands[command];
if (!run) usage(command && !['help', '--help', '-h'].includes(command) ? 2 : 0);
else await run();
