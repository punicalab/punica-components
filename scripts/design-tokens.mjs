// The tokens of src/tokens/tokens.css as Design Tokens (the W3C Design
// Tokens Community Group format, 2025.10): one file per colour scheme, for
// design tools and token pipelines (Figma variables through a plugin such as
// Tokens Studio, Style Dictionary). Every token names the CSS custom property
// it comes from in $extensions["com.punicalab.css"].
//
//   designTokens(css) → { light, dark }   (plain objects)
//   node scripts/design-tokens.mjs        writes dist/tokens/{light,dark}.tokens.json


/** `--punica-color-primary-light` → ['color', 'primary-light']; a group of one token is `default`. */
export function pathOf(property) {
  const [group, ...rest] = property.replace(/^--punica-/, '').split('-');
  if (group === 'font' && ['family', 'size', 'weight'].includes(rest[0])) {
    return ['font', rest[0], rest.slice(1).join('-') || 'default'];
  }
  if (group === 'line' && rest[0] === 'height') return ['line-height', rest.slice(1).join('-') || 'default'];
  if (group === 'focus' && rest[0] === 'ring') return ['focus-ring', rest.slice(1).join('-') || 'default'];
  if (group === 'disabled') return ['opacity', rest.join('-')];
  return [group, rest.join('-') || 'default'];
}

const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');

/** `#5560a9`, `rgb(111 126 140 / 10%)` → a DTCG colour. */
export function color(text) {
  let r, g, b, a = 1;
  const hex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(text);
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,]\s*([\d.]+)(%?))?\s*\)$/i.exec(text);
  if (hex) {
    [r, g, b] = [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
    if (hex[2]) a = parseInt(hex[2], 16) / 255;
  } else if (rgb) {
    [r, g, b] = rgb.slice(1, 4).map(Number);
    if (rgb[4] !== undefined) a = Number(rgb[4]) / (rgb[5] ? 100 : 1);
  } else {
    throw new Error(`Not a colour this export reads: ${text}`);
  }
  return {
    colorSpace: 'srgb',
    components: [r, g, b].map((c) => +(c / 255).toFixed(4)),
    ...(a < 1 ? { alpha: +a.toFixed(4) } : {}),
    hex: `#${hex2(r)}${hex2(g)}${hex2(b)}`
  };
}

const dimension = (text) => {
  const m = /^(-?[\d.]+)(px|rem)?$/.exec(text.trim());
  if (!m) throw new Error(`Not a dimension: ${text}`);
  return { value: Number(m[1]), unit: m[2] || 'px' };
};

/** One token: its type and its value in one scheme. */
function token(property, raw, scheme) {
  const pair = /^light-dark\((.+)\)$/.exec(raw);
  const value = pair ? splitTop(pair[1])[scheme === 'light' ? 0 : 1].trim() : raw;
  const [group, name] = pathOf(property);
  const css = { 'com.punicalab.css': property };
  const ref = (other) => `{${pathOf(other).join('.')}}`;

  if (group === 'color') return { $type: 'color', $value: color(value), $extensions: css };
  if (group === 'shadow') {
    const m = /^(-?[\d.]+px|0)\s+(-?[\d.]+px|0)\s+(-?[\d.]+px|0)(?:\s+(-?[\d.]+px|0))?\s+(.+)$/.exec(value);
    if (!m) throw new Error(`Not a shadow: ${value}`);
    return { $type: 'shadow', $value: { color: color(m[5]), offsetX: dimension(m[1]), offsetY: dimension(m[2]), blur: dimension(m[3]), spread: dimension(m[4] ?? '0') }, $extensions: css };
  }
  if (group === 'focus-ring' && name === 'default') {
    // `var(--punica-focus-ring-width) solid var(--punica-color-focus)`
    const [width, style, colour] = value.split(/\s+/);
    return { $type: 'border', $value: { width: ref(width.slice(4, -1)), style, color: ref(colour.slice(4, -1)) }, $extensions: css };
  }
  if (group === 'font' && name === 'family') {
    return { $type: 'fontFamily', $value: splitTop(value).map((f) => f.trim().replace(/^['"]|['"]$/g, '')), $extensions: css };
  }
  if (group === 'font' && name === 'weight') return { $type: 'fontWeight', $value: Number(value), $extensions: css };
  if (group === 'duration') return { $type: 'duration', $value: { value: parseFloat(value), unit: 'ms' }, $extensions: css };
  if (group === 'ease') {
    const m = /^cubic-bezier\(([^)]+)\)$/.exec(value);
    return { $type: 'cubicBezier', $value: m[1].split(',').map(Number), $extensions: css };
  }
  if (['z', 'line-height', 'opacity'].includes(group)) return { $type: 'number', $value: Number(value), $extensions: css };
  return { $type: 'dimension', $value: dimension(value), $extensions: css };
}

/** Splits at commas outside parentheses. */
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
  return parts;
}

/** The declarations of the first `:root` block: the tokens, not the reduced-motion overrides. */
export function declarations(css) {
  const start = css.indexOf(':root');
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const body = css.slice(open + 1, close).replace(/\/\*[\s\S]*?\*\//g, '');
  return [...body.matchAll(/(--punica-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]);
}

export function designTokens(css) {
  const files = {};
  for (const scheme of ['light', 'dark']) {
    const tree = {
      $description: `@punica/components tokens, ${scheme} colour scheme. Generated from tokens.css; do not edit.`
    };
    for (const [property, raw] of declarations(css)) {
      const path = pathOf(property);
      let node = tree;
      for (const key of path.slice(0, -1)) node = node[key] ??= {};
      node[path.at(-1)] = token(property, raw, scheme);
    }
    files[scheme] = tree;
  }
  return files;
}

// Pure above this line (the tests run it in a browser); Node only below.
if (typeof process !== 'undefined' && process.argv?.[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const { readFile, writeFile, mkdir } = await import('node:fs/promises');
  const css = await readFile(new URL('../src/tokens/tokens.css', import.meta.url), 'utf8');
  const files = designTokens(css);
  await mkdir(new URL('../dist/tokens/', import.meta.url), { recursive: true });
  for (const [scheme, tree] of Object.entries(files)) {
    await writeFile(new URL(`../dist/tokens/${scheme}.tokens.json`, import.meta.url), JSON.stringify(tree, null, 2) + '\n');
  }
  console.log(`dist/tokens/{light,dark}.tokens.json: ${declarations(css).length} tokens`);
}
