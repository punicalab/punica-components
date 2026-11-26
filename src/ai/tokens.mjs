// The design tokens of tokens.css as data: their names, their light and dark
// values and the group they sit in. A model that guesses a token name
// (`--punica-space-6` for `--punica-space-24`) gets no error from the
// browser, only the var() fallback or nothing: these names are what the
// validator and the MCP server check against. Pure: no Node and no DOM.

/** @typedef {{ name: string, group: string, value: string, light?: string, dark?: string }} Token */

/** Splits on commas that are not inside parentheses. */
function splitTop(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;
    else if (text[i] === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim());
}

/**
 * The tokens declared on `:root` in tokens.css, in order; a later
 * declaration of the same name (the reduced-motion block) does not repeat it.
 * @param {string} css
 * @returns {Token[]}
 */
export function parseTokens(css) {
  /** @type {Token[]} */
  const tokens = [];
  const seen = new Set();
  let group = '';
  const re = /\/\*\s*([\s\S]*?)\s*\*\/|(--punica-[\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = re.exec(css))) {
    if (match[1] !== undefined) {
      // A one-line comment inside a rule names the group; the file's header does not.
      if (!match[1].includes('\n')) group = match[1].split(/[:(]/)[0].trim();
      continue;
    }
    const [, , name, raw] = match;
    if (seen.has(name)) continue;
    seen.add(name);
    const value = raw.replace(/\s+/g, ' ').trim();
    const pair = /^light-dark\((.+)\)$/.exec(value);
    const [light, dark] = pair ? splitTop(pair[1]) : [];
    tokens.push({ name, group, value, ...(pair ? { light, dark } : {}) });
  }
  return tokens;
}

/**
 * The tokens as Markdown, grouped; `query` keeps the groups or names that
 * contain it.
 * @param {Token[]} tokens
 * @param {string} [query]
 */
export function formatTokens(tokens, query) {
  const q = (query || '').trim().toLowerCase();
  const kept = q ? tokens.filter((t) => t.name.includes(q) || t.group.toLowerCase().includes(q)) : tokens;
  if (!kept.length) return `No token matches "${query}". Groups: ${[...new Set(tokens.map((t) => t.group))].join(', ')}.`;
  const lines = [];
  let group = null;
  for (const t of kept) {
    if (t.group !== group) {
      group = t.group;
      lines.push('', `### ${group || 'other'}`, '', '| Token | Value |', '|---|---|');
    }
    lines.push(`| \`${t.name}\` | ${t.light !== undefined ? `light \`${t.light}\`, dark \`${t.dark}\`` : `\`${t.value}\``} |`);
  }
  return [
    `${kept.length} of ${tokens.length} \`--punica-*\` design tokens. Use them as \`var(--punica-…)\` with the exact name: a name that does not exist gives no error, only the fallback. Override one on \`:root\` or any element. Each element's own \`--punica-<element>-*\` properties are listed by get_component.`,
    ...lines
  ].join('\n');
}
