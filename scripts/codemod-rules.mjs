// The rules of the 1.x → 2.0 codemod, free of Node imports so they can be
// tested in a browser. The command line is scripts/codemod-2.0.mjs.

export const TAGS = {
  'punica-tab': 'punica-tabs',
  'punica-tab-item': 'punica-tab',
  'punica-select-item': 'punica-option',
  'punica-list-view': 'punica-list',
  'punica-list-view-item': 'punica-list-item',
  'punica-progress-line': 'punica-progress-bar',
  'punica-modal': 'punica-dialog',
  'punica-modal-header': 'punica-dialog-header',
  'punica-modal-content': 'punica-dialog-content',
  'punica-modal-footer': 'punica-dialog-footer',
  'punica-single-select-list': 'punica-listbox',
  'punica-single-select-list-item': 'punica-listbox-item',
  'punica-context-menu-separator': 'punica-menu-divider'
};

/** Tags with no one-to-one successor: what to do instead. */
export const REMOVED = {
  'punica-multi-select-list': '<punica-listbox multiple>',
  'punica-multi-select-list-item': '<punica-listbox-item>',
  'punica-context-menu-item': '<punica-menu-item slot="menu">',
  'punica-accordion-summary': 'the accordion\'s slot="summary" on any element',
  'punica-accordion-details': 'the accordion\'s default slot',
  'punica-alert-icon': 'the alert\'s slot="icon"',
  'punica-alert-content': 'the alert\'s default slot',
  'punica-alert-action': 'the alert\'s slot="actions"',
  'punica-typography': '<punica-heading level> or <punica-text variant>'
};

const PALETTES = 'primary|secondary|error|warning|info|success|neutral';
/** @type {[RegExp, string | ((...m: string[]) => string)][]} */
export const TOKENS = [
  [new RegExp(`--(${PALETTES})-main\\b`, 'g'), '--punica-color-$1'],
  [new RegExp(`--(${PALETTES})-(light|dark)\\b`, 'g'), '--punica-color-$1-$2'],
  [/--background-main\b/g, '--punica-color-bg'],
  [/--background-paper\b/g, '--punica-color-surface'],
  [/--background-backdrop\b/g, '--punica-color-backdrop'],
  [/--backdrop-light\b/g, '--punica-color-hover'],
  [/--text-primary\b/g, '--punica-color-text'],
  [/--text-placeholder\b/g, '--punica-color-text-placeholder'],
  [/--highlight\b/g, '--punica-color-focus'],
  [/--disabled-opacity\b/g, '--punica-disabled-opacity'],
  [/--disabled\b/g, '--punica-color-text-muted'],
  [/--white\b/g, '--punica-color-white'],
  [/--black\b/g, '--punica-color-black'],
  [/--root-border-radius\b/g, '--punica-radius'],
  [/--root-padding\b/g, '--punica-padding'],
  [/--spacing-(\d+)\b/g, '--punica-space-$1'],
  [/--box-shadow-(xxs|xs|sm|md|lg|xl)\b/g, '--punica-shadow-$1'],
  [/--weight-([a-z-]+)\b/g, '--punica-font-weight-$1'],
  [/--fontFamily\b/g, '--punica-font-family']
];

/** Things only a person can move. */
const REPORT = [
  [/--zindex-[a-z]+\b/, 'z-index token: 2.0 overlays use the top layer, drop the z-index'],
  [/--break-points-[a-z]+\b/, 'breakpoint token: use a container query or the literal width'],
  [/build\.min\.js/, '1.x bundle: load dist/punica-components.min.js or import @punica/components'],
  [/\bwindow\.Toast\b|\bToast\.(show|success|error|info|warning)\b/, 'global Toast: import { toast } from @punica/components'],
  [/['"`](changeExpanded|split-change|toast-close|menu-item-click|primary-click|punica-context-menu-select)['"`]/, '1.x event name: see docs/MIGRATION-2.0.md, "Events"'],
  [/\b(fullwidth|startadornment|endadornment|clearbutton|clear-button|selecteditemdisplayitem|disablegutters|alignitems|justifycontent|rowspacing|columnspacing|maxwidth|initstate|totalCount|breakPoint|flexItem|starthour|endhour)\b/, '1.x attribute spelling: see the element\'s table in docs/migration/'],
  [/slot=["'](startIcon|endIcon|startAdornment|endAdornment)["']/, '1.x slot name: use slot="start" / slot="end"']
];

const tagPattern = new RegExp(`(?<![\\w-])(${[...Object.keys(TAGS), ...Object.keys(REMOVED)].sort((a, b) => b.length - a.length).join('|')})(?![\\w-])`, 'g');

/**
 * @param {string} text
 * @returns {{ text: string, changes: number, notes: { line: number, note: string }[] }}
 */
export function transform(text) {
  let changes = 0;
  const notes = [];
  let out = text;
  for (const [re, to] of TOKENS) {
    out = out.replace(re, (...m) => {
      changes++;
      return typeof to === 'string' ? to.replace(/\$(\d)/g, (_, n) => m[Number(n)]) : to(...m);
    });
  }
  out = out.replace(tagPattern, (tag) => {
    if (TAGS[tag]) {
      changes++;
      return TAGS[tag];
    }
    return tag;
  });
  out.split('\n').forEach((line, i) => {
    for (const tag of Object.keys(REMOVED)) {
      if (new RegExp(`(?<![\\w-])${tag}(?![\\w-])`).test(line)) notes.push({ line: i + 1, note: `${tag} is gone: use ${REMOVED[tag]}` });
    }
    for (const [re, note] of REPORT) {
      // Attribute and slot spellings only mean something on a punica tag.
      if (/attribute spelling|slot name/.test(note) && !line.includes('punica-')) continue;
      if (re.test(line)) notes.push({ line: i + 1, note });
    }
  });
  return { text: out, changes, notes };
}
