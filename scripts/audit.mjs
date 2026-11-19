// The static gate for the 2.0 contract (docs/contract.md).
// Reads every component's .js and .css and reports each line that breaks a
// rule a regular expression can see. `--report` writes docs/audit.md and
// exits 0; without it any finding exits 1.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const componentsDir = join(root, 'src/components');
const reportOnly = process.argv.includes('--report');

/** @type {{ file: string, line: number, rule: string, text: string }[]} */
const findings = [];
// A line (or, for a whole-file rule, any line of the file) may carry
// `audit-allow: <rule>` with the reason beside it.
const allowed = (text, rule) => new RegExp(`audit-allow:\\s*${rule}\\b`).test(text);
const add = (file, line, rule, text) =>
  !allowed(text, rule) && findings.push({ file: relative(root, file), line, rule, text: text.trim().slice(0, 120) });

const tokensCss = await readFile(join(root, 'src/tokens/tokens.css'), 'utf8');
const tokens = new Set([...tokensCss.matchAll(/(--punica-[\w-]+)\s*:/g)].map((m) => m[1]));

const dirs = (await readdir(componentsDir, { withFileTypes: true })).filter((d) => d.isDirectory());
const cssFiles = [];
const jsFiles = [];
const testsByDir = new Map();
for (const dir of dirs) {
  const full = join(componentsDir, dir.name);
  for (const name of await readdir(full)) {
    const file = join(full, name);
    if (name.endsWith('.test.js')) {
      testsByDir.set(dir.name, (testsByDir.get(dir.name) || '') + (await readFile(file, 'utf8')));
    } else if (name.endsWith('.js')) jsFiles.push({ dir: dir.name, file });
    else if (name.endsWith('.css')) cssFiles.push({ dir: dir.name, file });
  }
}

// Custom properties any component declares are legitimate to reference.
const declared = new Set(tokens);
const cssText = new Map();
for (const { file } of cssFiles) {
  const text = await readFile(file, 'utf8');
  cssText.set(file, text);
  for (const m of text.matchAll(/(--punica-[\w-]+)\s*:/g)) declared.add(m[1]);
}

/** The text of the call that starts on line `i`, to its matching paren. */
function callText(lines, i) {
  const text = lines.slice(i, i + 60).join('\n');
  let depth = 0;
  for (let k = text.indexOf('('); k < text.length; k++) {
    if (text[k] === '(') depth++;
    else if (text[k] === ')' && --depth === 0) return text.slice(0, k + 1);
  }
  return text;
}

const JS_RULES = [
  [/\.innerHTML\s*[+]?=|\.outerHTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(/, 'markup-from-string'],
  [/customElements\.define\s*\(/, 'define-without-guard'],
  [/new\s+(CustomEvent|Event)\s*\(/, 'event-not-through-emit'],
  [/^\s*(connectedCallback|disconnectedCallback|attributeChangedCallback)\s*\(/, 'lifecycle-override'],
  [/static\s+get\s+observedAttributes|static\s+observedAttributes/, 'hand-written-observed-attributes'],
  [/document\.body\.(append|appendChild|prepend|insertBefore)\s*\(/, 'portal-to-body'],
  [/\.keyCode\b|\.which\b/, 'deprecated-key-code'],
  [/\bthis\.style\.(?!getPropertyValue)\w+|\bthis\.style\s*=/, 'inline-style-on-host'],
  [/attribute:\s*'[^']*[A-Z][^']*'/, 'attribute-not-kebab'],
  [/\bwindow\.[A-Z]\w*\s*=|globalThis\.\w+\s*=/, 'global-write']
];

for (const { dir, file } of jsFiles) {
  const text = await readFile(file, 'utf8');
  const lines = text.split('\n');
  if (!/^export\s+class\s+Punica\w+\s+extends\s+/m.test(text)) {
    if (!/^export\s+(function|const|class)\b/m.test(text)) {
      add(file, 1, 'not-migrated', 'no ES module export: still a 1.x file');
      continue;
    }
  }
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    for (const [re, rule] of JS_RULES) if (re.test(line)) add(file, i + 1, rule, `${lines[i - 1] || ''} ${line}`);
    // Module top level: a statement at column 0 that reaches for the DOM.
    if (/^(const|let|var)\s+\w+\s*=\s*(document|window)\./.test(line) || /^(document|window)\./.test(line)) {
      add(file, i + 1, 'dom-at-module-top-level', line);
    }
    // A listener on window or document must die with the connection.
    if (/\b(window|document|document\.documentElement)\.addEventListener\s*\(|^\s*addEventListener\s*\(/.test(line)) {
      if (!/signal/.test(callText(lines, i))) {
        add(file, i + 1, 'global-listener-without-signal', line);
      }
    }
  });
  if (/new\s+(Resize|Mutation|Intersection)Observer/.test(text) && !/\.disconnect\s*\(/.test(text)) {
    add(file, 1, 'observer-never-disconnected', 'creates an observer and never calls disconnect()');
  }
  if (/\bsetInterval\s*\(/.test(text) && !/clearInterval\s*\(/.test(text)) {
    add(file, 1, 'interval-never-cleared', 'setInterval with no clearInterval');
  }
  const tags = [...text.matchAll(/define\(\s*'(punica-[\w-]+)'/g)].map((m) => m[1]);
  for (const tag of tags) {
    if (!new RegExp(`@element\\s+${tag}\\b`).test(text)) add(file, 1, 'missing-element-doc', `no "@element ${tag}" JSDoc`);
    const tests = testsByDir.get(dir) || '';
    if (!/\bcontract\(/.test(tests) || !new RegExp(`['"\`]${tag}['"\`]`).test(tests)) {
      add(file, 1, 'no-contract-test', `${tag} has no contract() test in ${dir}/`);
    }
  }
}

const CSS_RULES = [
  [/#[0-9a-fA-F]{3,8}\b(?![\w-])|\b(rgba?|hsla?)\(\s*\d/, 'colour-literal'],
  [/\b(margin|padding|border|inset)-(left|right)\b|^\s*(left|right)\s*:|text-align\s*:\s*(left|right)|\bfloat\s*:\s*(left|right)|border-(top|bottom)-(left|right)-radius/, 'physical-property'],
  [/!important/, 'important'],
  [/z-index\s*:\s*\d{3,}/, 'z-index-stack']
];

for (const { file } of cssFiles) {
  const text = cssText.get(file);
  const lines = text.split('\n');
  let inComment = false;
  lines.forEach((line, i) => {
    if (inComment) {
      if (line.includes('*/')) inComment = false;
      return;
    }
    if (/^\s*\/\*/.test(line) && !line.includes('*/')) {
      inComment = true;
      return;
    }
    for (const [re, rule] of CSS_RULES) {
      if (!re.test(line)) continue;
      if (rule === 'important' && /\[hidden\]/.test(lines.slice(Math.max(0, i - 2), i + 1).join(' '))) continue;
      add(file, i + 1, rule, line);
    }
    for (const m of line.matchAll(/var\(\s*(--[\w-]+)/g)) {
      const name = m[1];
      if (name.startsWith('--_')) continue;
      if (!name.startsWith('--punica-')) add(file, i + 1, 'token-without-prefix', line);
      else if (!declared.has(name)) add(file, i + 1, 'unknown-token', `${name} is defined nowhere`);
    }
    const decl = line.match(/^\s*(--[\w-]+)\s*:/);
    if (decl && !decl[1].startsWith('--punica-') && !decl[1].startsWith('--_')) {
      add(file, i + 1, 'custom-property-without-prefix', line);
    }
  });
  if (/\banimation(-name)?\s*:/.test(text) && !/prefers-reduced-motion/.test(text)) {
    add(file, 1, 'animation-without-reduced-motion', 'an animation with no prefers-reduced-motion rule');
  }
  if (/cursor\s*:\s*pointer/.test(text) && !/:focus-visible/.test(text)) {
    if (!allowed(text, 'pointer-without-focus-visible')) add(file, 1, 'pointer-without-focus-visible', 'something is clickable and nothing shows keyboard focus');
  }
}

const byRule = new Map();
for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) || 0) + 1);
const summary = [...byRule].sort((a, b) => b[1] - a[1]);

const report = [
  '# Contract audit',
  '',
  `${jsFiles.length} component modules and ${cssFiles.length} stylesheets read, ${findings.length} findings.`,
  '',
  '| Rule | Findings |',
  '|---|---|',
  ...summary.map(([rule, n]) => `| \`${rule}\` | ${n} |`),
  '',
  ...summary.flatMap(([rule]) => [
    `## ${rule}`,
    '',
    ...findings.filter((f) => f.rule === rule).map((f) => `- \`${f.file}:${f.line}\` ${f.text.replace(/\|/g, '\\|')}`),
    ''
  ])
].join('\n');

if (reportOnly) {
  await writeFile(join(root, 'docs/audit.md'), report);
  console.log(`docs/audit.md: ${findings.length} findings`);
} else {
  for (const [rule, n] of summary) console.log(`${String(n).padStart(5)}  ${rule}`);
  if (process.argv.includes('--verbose')) for (const f of findings) console.log(`${f.file}:${f.line}  ${f.rule}  ${f.text}`);
  console.log(`${findings.length} findings in ${jsFiles.length} modules and ${cssFiles.length} stylesheets`);
  process.exit(findings.length ? 1 : 0);
}
