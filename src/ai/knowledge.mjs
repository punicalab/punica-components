// What a tool (a CLI, an MCP server, an editor, a model's context) needs to
// know about the elements, read from custom-elements.json. Pure: no Node and
// no DOM, so the same code runs in the CLI, the MCP server and the tests.
import { TAGS as LEGACY_TAGS, REMOVED as LEGACY_REMOVED } from '../../scripts/codemod-rules.mjs';
import { icons as ICONS } from '../core/icons.js';

export const DOCS_URL = 'https://components.punicalab.com';

/** Methods every element has that are not part of its own API. */
const HIDDEN_METHODS = new Set(['update', 'connected', 'disconnected', 'firstUpdated', 'formReset', 'formRestore', 'requestUpdate', 'emit', 'listen', 'toggleState']);

/** Words people use for an element, mapped to words its tag or text holds. */
const SYNONYMS = {
  modal: 'dialog',
  popup: 'popover dialog',
  dropdown: 'select menu',
  combobox: 'autocomplete select',
  toggle: 'switch toggle',
  checkbox: 'checkbox',
  datepicker: 'date picker',
  calendar: 'calendar date',
  spinner: 'progress',
  loader: 'progress skeleton',
  snackbar: 'toast',
  notification: 'toast alert',
  sidebar: 'side nav drawer',
  navbar: 'app bar top nav',
  header: 'app bar',
  grid: 'grid table',
  datagrid: 'table',
  tooltip: 'tooltip',
  tag: 'chip tokenizer',
  pill: 'chip badge',
  upload: 'file',
  typography: 'heading text',
  textfield: 'input',
  textbox: 'input',
  radio: 'radio',
  stepper: 'stepper',
  wizard: 'stepper',
  breadcrumbs: 'breadcrumb',
  carousel: 'carousel',
  slider: 'slider range',
  rating: 'rating',
  chat: 'chat',
  search: 'search'
};

/** Two-word names people use, read before the words are split. */
const PHRASES = {
  'text field': 'input',
  'text input': 'input',
  'text box': 'input',
  'text area': 'textarea',
  'drop down': 'dropdown',
  'date picker': 'date picker',
  'time picker': 'time picker',
  'radio button': 'radio',
  'toggle switch': 'switch',
  'side bar': 'sidebar',
  'nav bar': 'navbar',
  'tool tip': 'tooltip',
  'progress bar': 'progress',
  'tag input': 'tokenizer',
  'tags input': 'tokenizer',
  'chip input': 'tokenizer'
};

/** `'a' | 'b'` → ['a', 'b']; anything open (`string`, `number`) → null. */
export function enumValues(type) {
  if (!type) return null;
  const parts = type.split('|').map((p) => p.trim());
  if (!parts.every((p) => /^'[^']*'$/.test(p))) return null;
  return parts.map((p) => p.slice(1, -1));
}

const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** One element as tools see it. */
function normalize(declaration, path) {
  const d = declaration;
  const attributes = (d.attributes || []).map((a) => {
    const type = a.type?.text || 'string';
    return { name: a.name, property: a.fieldName || camel(a.name), type, values: enumValues(type), description: a.description || '' };
  });
  const attributeProps = new Set(attributes.map((a) => a.property));
  const members = (d.members || []).filter((m) => m.privacy !== 'private' && m.privacy !== 'protected' && !m.static && !/^[_#]/.test(m.name));
  return {
    tag: d.tagName,
    className: d.name,
    module: path.replace(/^src\//, ''),
    description: d.description || '',
    attributes,
    properties: members
      .filter((m) => m.kind === 'field' && m.description && !attributeProps.has(m.name))
      .map((m) => ({ name: m.name, type: m.type?.text || '', description: m.description, readonly: !!m.readonly })),
    methods: members
      .filter((m) => m.kind === 'method' && m.description && !HIDDEN_METHODS.has(m.name))
      .map((m) => ({
        name: m.name,
        signature: `${m.name}(${(m.parameters || []).map((p) => p.name + (p.optional ? '?' : '')).join(', ')})`,
        description: m.description
      })),
    events: (d.events || []).filter((e) => e.name).map((e) => ({ name: e.name, description: e.description || '' })),
    slots: (d.slots || []).map((s) => ({ name: s.name || '', description: s.description || '' })),
    // Attributes the element reads off its children, as its slot docs say:
    // "Each may carry `span`".
    childAttributes: [...new Set((d.slots || []).flatMap((s) => [...(s.description || '').matchAll(/may carry `([a-z-]+)`/g)].map((m) => m[1])))],
    parts: (d.cssParts || []).map((p) => ({ name: p.name, description: p.description || '' })),
    cssProperties: (d.cssProperties || []).map((p) => ({ name: p.name, description: p.description || '' })),
    states: (d.cssStates || []).map((s) => ({ name: s.name, description: s.description || '' }))
  };
}

/** Levenshtein distance, for "did you mean". */
export function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row[j];
      row[j] = next;
    }
  }
  return row[b.length];
}

/** The closest of `names` to `name`, if it is close enough to be a typo. */
export function closest(name, names) {
  let best = null;
  let bestDistance = Infinity;
  for (const candidate of names) {
    const d = distance(name, candidate);
    if (d < bestDistance) [best, bestDistance] = [candidate, d];
  }
  return best && bestDistance <= Math.max(2, Math.floor(name.length / 3)) ? best : null;
}

/**
 * @param {any} manifest the parsed custom-elements.json
 */
export function createKnowledge(manifest) {
  /** @type {Map<string, ReturnType<typeof normalize>>} */
  const elements = new Map();
  for (const mod of manifest.modules || []) {
    for (const d of mod.declarations || []) {
      if (d.kind === 'class' && d.tagName) elements.set(d.tagName, normalize(d, mod.path));
    }
  }
  const tags = [...elements.keys()].sort();
  const allEvents = new Set([...elements.values()].flatMap((e) => e.events.map((ev) => ev.name)));
  /** The glyphs `<punica-icon name>` draws; any other name draws nothing. */
  const icons = Object.keys(ICONS);

  /** What became of a 1.x tag, or null. */
  function legacy(tag) {
    if (LEGACY_TAGS[tag]) return { tag, replacement: LEGACY_TAGS[tag], message: `${tag} is the 1.x name: use <${LEGACY_TAGS[tag]}>` };
    if (LEGACY_REMOVED[tag]) return { tag, replacement: null, message: `${tag} was removed in 2.0: use ${LEGACY_REMOVED[tag]}` };
    return null;
  }

  function list() {
    return tags.map((tag) => ({ tag, description: firstSentence(elements.get(tag).description) }));
  }

  function get(tag) {
    return elements.get(normalizeTag(tag)) || null;
  }

  /** Ranked by how well tag, description and API names match the query. */
  function search(query, limit = 10) {
    const words = expand(query);
    if (!words.length) return [];
    const scored = [];
    for (const element of elements.values()) {
      const tagWords = element.tag.replace(/^punica-/, '').split('-');
      const text = element.description.toLowerCase();
      const api = [...element.attributes.map((a) => a.name), ...element.events.map((e) => e.name), ...element.slots.map((s) => s.name)].join(' ');
      let score = 0;
      for (const { word, weight } of words) {
        let s = 0;
        if (tagWords.includes(word)) s += 6;
        else if (tagWords.some((t) => t.startsWith(word) || word.startsWith(t))) s += 3;
        if (new RegExp(`\\b${escape(word)}`).test(text)) s += 2;
        if (api.includes(word)) s += 1;
        score += s * weight;
      }
      if (!score) continue;
      // Every word of the tag in the query: this is the element asked for.
      const typed = new Set(words.filter((w) => w.weight === 1).map((w) => w.word.replace(/s$/, '')));
      if (tagWords.every((t) => typed.has(t.replace(/s$/, '')))) score += 5 * tagWords.length;
      // A part of another element ("The body of a `punica-dialog`") ranks
      // below the element it belongs to, and a longer tag below a shorter one.
      const part = /^(?:the |one |a |an )?[^.]*?\b(?:of|in|for|inside) (?:a|an|the) `punica-/i.test(firstSentence(element.description)) ? 4 : 0;
      scored.push({ tag: element.tag, description: firstSentence(element.description), score: score - part - tagWords.length * 0.1 });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * The element's API as Markdown, the way a model reads it best.
   *
   * `brief` is what writing markup needs: the description, attributes,
   * properties, methods, events and slots. CSS parts, custom properties and
   * states, which only styling needs, are left to the whole form.
   * @param {string} tag
   * @param {{ brief?: boolean }} [options]
   */
  function formatMarkdown(tag, { brief = false } = {}) {
    const e = get(tag);
    if (!e) {
      const old = legacy(normalizeTag(tag));
      if (old) return old.message;
      const guess = closest(normalizeTag(tag), tags);
      return `No element ${normalizeTag(tag)}.${guess ? ` Did you mean ${guess}?` : ''}`;
    }
    const lines = [`## <${e.tag}>`, '', e.description, '', `Import: \`import '@punica/components/${e.module}';\` or \`import '@punica/components';\``];
    const table = (title, head, rows) => {
      if (!rows.length) return;
      lines.push('', `### ${title}`, '', `| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`));
    };
    if (brief) table('Attributes', ['Attribute', 'Type', 'Description'], e.attributes.map((a) => [`\`${a.name}\``, `\`${a.type}\``, a.description]));
    else table('Attributes', ['Attribute', 'Property', 'Type', 'Description'], e.attributes.map((a) => [`\`${a.name}\``, `\`${a.property}\``, `\`${a.type}\``, a.description]));
    table('Properties (no attribute)', ['Property', 'Type', 'Description'], e.properties.map((p) => [`\`${p.name}\``, p.type ? `\`${p.type}\`` : '', (p.readonly ? 'Read-only. ' : '') + p.description]));
    table('Methods', ['Method', 'Description'], e.methods.map((m) => [`\`${m.signature}\``, m.description]));
    table('Events', ['Event', 'Description'], e.events.map((ev) => [`\`${ev.name}\``, ev.description]));
    table('Slots', ['Slot', 'Description'], e.slots.map((s) => [s.name ? `\`${s.name}\`` : '(default)', s.description]));
    if (!brief) {
      table('CSS parts', ['Part', 'Description'], e.parts.map((p) => [`\`${p.name}\``, p.description]));
      table('CSS custom properties', ['Property', 'Description'], e.cssProperties.map((p) => [`\`${p.name}\``, p.description]));
    }
    if (e.tag === 'punica-icon') lines.push('', `### Icon names`, '', icons.map((i) => `\`${i}\``).join(', ') + '. Any other name draws nothing: slot an `<svg>` instead.');
    if (!brief) table('Custom states', ['State', 'Description'], e.states.map((s) => [`\`:state(${s.name})\``, s.description]));
    else if (e.parts.length || e.cssProperties.length || e.states.length) {
      const left = [e.parts.length && `${e.parts.length} CSS parts`, e.cssProperties.length && `${e.cssProperties.length} custom properties`, e.states.length && `${e.states.length} states`].filter(Boolean);
      lines.push('', `For styling: ${left.join(', ')}; ask for the whole API to see them.`);
    }
    return lines.join('\n');
  }

  return { elements, tags, allEvents, icons, list, get, search, legacy, formatMarkdown };
}

export function normalizeTag(tag) {
  const t = String(tag).trim().toLowerCase().replace(/^<|\/?>$/g, '');
  return t.startsWith('punica-') ? t : `punica-${t}`;
}

export function firstSentence(text) {
  const match = /^[\s\S]*?[.!?](?=\s|$)/.exec(text || '');
  return (match ? match[0] : text || '').replace(/\s+/g, ' ').trim();
}

/** The query's words at weight 1, the synonyms they bring at 0.5. */
function expand(query) {
  let text = String(query).toLowerCase().replace(/<?punica-/g, '');
  // A phrase stands for one thing: "radio button" is a radio, not a button.
  for (const [phrase, word] of Object.entries(PHRASES)) text = text.replaceAll(phrase, ` ${word} `);
  const words = text.split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  const out = new Map(words.map((w) => [w, 1]));
  // A synonym's first word is what people most often mean by it.
  for (const w of words) (SYNONYMS[w] || '').split(' ').filter(Boolean).forEach((s, i) => !out.has(s) && out.set(s, i === 0 ? 0.6 : 0.5));
  return [...out].map(([word, weight]) => ({ word, weight }));
}

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cell(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}
