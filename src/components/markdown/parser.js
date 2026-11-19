/**
 * A small Markdown parser: source text in, a tree of plain objects out.
 * It builds no DOM and knows no HTML: raw HTML in the source is text like any
 * other, and a URL it would not link to is left as the text that was written.
 *
 * Supported: ATX headings, paragraphs, emphasis, strong, strikethrough (`~~`),
 * inline code, fenced and indented code, block quotes, bullet / ordered /
 * nested lists, task lists, links, images, autolinks, GFM tables, thematic
 * breaks, hard line breaks, backslash escapes and character references.
 * Not supported: setext headings, reference-style links, footnotes.
 */
import { safeUrl } from './url.js';

/**
 * @typedef {object} MarkdownBlock
 * @property {string} type heading | paragraph | code | hr | blockquote | list | item | table
 * @property {string} raw the source lines the block was read from; equal raw
 *   and equal sig mean an equal block
 * @property {string} sig what kind of node renders it
 * @property {MarkdownBlock[]} [children] blocks inside a quote, a list or an item
 * @property {MarkdownInline[]} [inline] inline content of a heading or paragraph
 *
 * @typedef {object} MarkdownInline
 * @property {string} t text | code | br | wrap | link | img | delim
 */

/* ------------------------------------------------------------------ blocks */

const FENCE = /^( {0,3})(`{3,}|~{3,})[ \t]*(.*)$/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/;
const HR = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const QUOTE = /^ {0,3}>/;
const LIST = /^( {0,3})([-+*]|\d{1,9}[.)])(?:( +|\t)(.*))?$/;
const TABLE_DELIMITER = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
const TASK = /^\[([ xX])\](?:[ \t]+|$)/;

const isBlank = (line) => line.trim() === '';
const indentOf = (line) => line.length - line.trimStart().length;

/** @param {string} line */
function fenceOpen(line) {
  const m = FENCE.exec(line);
  if (!m) return null;
  if (m[2][0] === '`' && m[3].includes('`')) return null;
  return { indent: m[1].length, char: m[2][0], length: m[2].length, info: m[3].trim() };
}

/** A list marker, or null. */
function listMarker(line) {
  if (HR.test(line)) return null;
  const m = LIST.exec(line);
  if (!m) return null;
  const ordered = m[2].length > 1 || /\d/.test(m[2]);
  return {
    indent: m[1].length,
    ordered,
    // Items belong to one list while their bullet or delimiter is the same.
    kind: ordered ? m[2].slice(-1) : m[2],
    start: ordered ? parseInt(m[2], 10) : 1,
    width: m[1].length + m[2].length,
    pad: m[3] === undefined ? 0 : m[3] === '\t' ? 1 : m[3].length,
    rest: m[4] ?? ''
  };
}

/** A line that ends a paragraph without a blank line before it. */
function interrupts(line) {
  if (fenceOpen(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line)) return true;
  const marker = listMarker(line);
  return !!marker && marker.rest.trim() !== '' && (!marker.ordered || marker.start === 1);
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
  let cell = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') {
      cell += '|';
      i++;
    } else if (s[i] === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += s[i];
    }
  }
  cells.push(cell.trim());
  return cells;
}

/** The table that starts at `lines[i]`, or null. */
function tableStart(lines, i) {
  const line = lines[i];
  if (!line.includes('|') || i + 1 >= lines.length || !TABLE_DELIMITER.test(lines[i + 1])) return null;
  const head = splitRow(line);
  const delimiter = splitRow(lines[i + 1]);
  if (head.length !== delimiter.length) return null;
  const align = delimiter.map((cell) => {
    const start = cell.startsWith(':');
    const end = cell.endsWith(':');
    return start && end ? 'center' : end ? 'end' : start ? 'start' : null;
  });
  return { head, align };
}

/**
 * @param {string[]} lines
 * @returns {MarkdownBlock[]}
 */
function parseBlocks(lines) {
  /** @type {any[]} */
  const out = [];
  const n = lines.length;
  let i = 0;
  const push = (start, block) => {
    block.raw = lines.slice(start, i).join('\n');
    block.sig ||= block.type;
    block.from = start;
    block.to = i;
    out.push(block);
  };

  while (i < n) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }
    const start = i;

    const fence = fenceOpen(line);
    if (fence) {
      const body = [];
      let closed = false;
      i++;
      while (i < n) {
        const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(lines[i]);
        if (close && close[1][0] === fence.char && close[1].length >= fence.length) {
          closed = true;
          i++;
          break;
        }
        const l = lines[i];
        body.push(l.slice(Math.min(fence.indent, indentOf(l))));
        i++;
      }
      const language = fence.info.split(/\s+/)[0] || '';
      push(start, { type: 'code', sig: `code:${language}`, language, text: body.join('\n'), closed });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      i++;
      let text = (heading[2] || '').trim();
      text = /^#+$/.test(text) ? '' : text.replace(/[ \t]+#+$/, '');
      const level = heading[1].length;
      push(start, { type: 'heading', sig: `h${level}`, level, inline: parseInline(text) });
      continue;
    }

    if (HR.test(line)) {
      i++;
      push(start, { type: 'hr' });
      continue;
    }

    if (QUOTE.test(line)) {
      const inner = [];
      while (i < n) {
        const l = lines[i];
        if (QUOTE.test(l)) inner.push(l.replace(/^ {0,3}> ?/, ''));
        // A paragraph inside the quote may go on without its marker.
        else if (!isBlank(l) && inner.length && !isBlank(inner[inner.length - 1]) && !interrupts(l)) inner.push(l);
        else break;
        i++;
      }
      push(start, { type: 'blockquote', children: parseBlocks(inner) });
      continue;
    }

    const first = listMarker(line);
    if (first) {
      const items = [];
      let loose = false;
      while (i < n) {
        const marker = listMarker(lines[i]);
        if (!marker || marker.ordered !== first.ordered || marker.kind !== first.kind) break;
        // Five or more spaces after the marker start an indented code block.
        const pad = marker.rest === '' || marker.pad > 4 ? 1 : marker.pad;
        const indent = marker.width + pad;
        const itemLines = [lines[i].slice(Math.min(indent, lines[i].length))];
        i++;
        while (i < n) {
          const l = lines[i];
          if (isBlank(l)) {
            let j = i;
            while (j < n && isBlank(lines[j])) j++;
            if (j < n && indentOf(lines[j]) >= indent) {
              for (; i < j; i++) itemLines.push('');
              continue;
            }
            break;
          }
          if (indentOf(l) >= indent) itemLines.push(l.slice(indent));
          else if (listMarker(l) || interrupts(l)) break;
          else if (!isBlank(itemLines[itemLines.length - 1])) itemLines.push(l.trimStart());
          else break;
          i++;
        }

        let task = false;
        let checked = false;
        const box = TASK.exec(itemLines[0]);
        if (box) {
          task = true;
          checked = box[1] !== ' ';
          itemLines[0] = itemLines[0].slice(box[0].length);
        }
        const children = parseBlocks(itemLines);
        for (let k = 1; k < children.length; k++) {
          if (itemLines.slice(children[k - 1].to, children[k].from).some(isBlank)) loose = true;
        }
        items.push({
          type: 'item',
          sig: task ? `item:task:${checked}` : 'item',
          raw: itemLines.join('\n'),
          task,
          checked,
          label: itemLines[0].trim(),
          children
        });

        // Blank lines before a sibling item make the list loose.
        let j = i;
        while (j < n && isBlank(lines[j])) j++;
        if (j > i && j < n) {
          const next = listMarker(lines[j]);
          if (next && next.ordered === first.ordered && next.kind === first.kind) {
            loose = true;
            i = j;
          }
        }
      }
      push(start, {
        type: 'list',
        sig: `list:${first.ordered ? `o${first.start}` : 'u'}:${loose ? 'loose' : 'tight'}`,
        ordered: first.ordered,
        start: first.start,
        loose,
        children: items
      });
      continue;
    }

    const table = tableStart(lines, i);
    if (table) {
      i += 2;
      const rows = [];
      while (i < n && !isBlank(lines[i]) && !interrupts(lines[i])) {
        const cells = splitRow(lines[i]);
        rows.push(table.head.map((_, c) => parseInline(cells[c] ?? '')));
        i++;
      }
      push(start, { type: 'table', align: table.align, head: table.head.map((cell) => parseInline(cell)), rows });
      continue;
    }

    if (indentOf(line) >= 4) {
      const body = [];
      while (i < n && (isBlank(lines[i]) || indentOf(lines[i]) >= 4)) {
        body.push(lines[i].slice(4));
        i++;
      }
      while (body.length && isBlank(body[body.length - 1])) {
        body.pop();
        i--;
      }
      push(start, { type: 'code', sig: 'code:', language: '', text: body.join('\n'), closed: true });
      continue;
    }

    const text = [line.trimStart()];
    i++;
    while (i < n && !isBlank(lines[i]) && !interrupts(lines[i]) && !tableStart(lines, i)) {
      text.push(lines[i].trimStart());
      i++;
    }
    push(start, { type: 'paragraph', inline: parseInline(text.join('\n').trimEnd()) });
  }
  return out;
}

/**
 * Parses Markdown into blocks.
 * @param {string} source
 * @returns {MarkdownBlock[]}
 */
export function parseMarkdown(source) {
  const lines = String(source ?? '')
    .replace(/\r\n?/g, '\n')
    .replaceAll(String.fromCharCode(0), '\ufffd')
    .split('\n')
    // Leading tabs count as four columns; tabs inside a line are kept.
    .map((line) => line.replace(/^[ \t]+/, (ws) => ws.replace(/\t/g, '    ')));
  return parseBlocks(lines);
}

/* ------------------------------------------------------------------ inline */

const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/;
const PUNCTUATION = /[\p{P}\p{S}]/u;
const WHITESPACE = /\s/;

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«',
  raquo: '»', bull: '•', middot: '·', deg: '°', plusmn: '±', times: '×', divide: '÷', larr: '←',
  rarr: '→', uarr: '↑', darr: '↓', euro: '€', pound: '£', yen: '¥', cent: '¢', sect: '§', para: '¶',
  le: '≤', ge: '≥', ne: '≠', infin: '∞'
};
const ENTITY = /^&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z][a-zA-Z0-9]{1,31}));/;

/** The character reference at `src[i]`, or null. A reference decodes to text, never to markup. */
function entityAt(src, i) {
  const m = ENTITY.exec(src.slice(i, i + 40));
  if (!m) return null;
  if (m[3]) {
    return Object.hasOwn(ENTITIES, m[3]) ? { text: ENTITIES[m[3]], length: m[0].length } : null;
  }
  const code = m[1] ? parseInt(m[1], 10) : parseInt(m[2], 16);
  const valid = code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff);
  return { text: valid ? String.fromCodePoint(code) : '\ufffd', length: m[0].length };
}

/** Backslash escapes and character references resolved, for a URL or a title. */
function unescape(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length && ASCII_PUNCTUATION.test(text[i + 1])) {
      out += text[++i];
    } else if (ch === '&') {
      const entity = entityAt(text, i);
      if (entity) {
        out += entity.text;
        i += entity.length - 1;
      } else out += ch;
    } else out += ch;
  }
  return out;
}

/** The index after the code span that opens at `src[i]`, or -1. */
function codeSpanEnd(src, i) {
  let j = i;
  while (src[j] === '`') j++;
  const length = j - i;
  let k = j;
  while (k < src.length) {
    const p = src.indexOf('`', k);
    if (p < 0) return -1;
    let q = p;
    while (src[q] === '`') q++;
    if (q - p === length) return q;
    k = q;
  }
  return -1;
}

/** The index of the `]` that closes the `[` at `src[i]`, or -1. */
function bracketEnd(src, i) {
  let depth = 0;
  for (let k = i; k < src.length; k++) {
    const ch = src[k];
    if (ch === '\\') k++;
    else if (ch === '`') {
      const end = codeSpanEnd(src, k);
      if (end > 0) k = end - 1;
      else while (src[k + 1] === '`') k++;
    } else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return k;
  }
  return -1;
}

/** Reads `(destination "title")` at `src[p]`. */
function linkTail(src, p) {
  if (src[p] !== '(') return null;
  let i = p + 1;
  const skip = () => {
    while (i < src.length && WHITESPACE.test(src[i])) i++;
  };
  skip();
  let destination;
  if (src[i] === '<') {
    const end = src.indexOf('>', i);
    if (end < 0 || src.slice(i, end).includes('\n')) return null;
    destination = src.slice(i + 1, end);
    i = end + 1;
  } else {
    const from = i;
    let depth = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '\\' && i + 1 < src.length) {
        i += 2;
        continue;
      }
      if (WHITESPACE.test(ch)) break;
      if (ch === '(') depth++;
      else if (ch === ')') {
        if (!depth) break;
        depth--;
      }
      i++;
    }
    destination = src.slice(from, i);
  }
  skip();
  let title = null;
  const quote = src[i];
  if (quote === '"' || quote === "'" || quote === '(') {
    const close = quote === '(' ? ')' : quote;
    let end = i + 1;
    while (end < src.length && src[end] !== close) end += src[end] === '\\' ? 2 : 1;
    if (end >= src.length) return null;
    title = unescape(src.slice(i + 1, end));
    i = end + 1;
    skip();
  }
  if (src[i] !== ')') return null;
  return { destination: unescape(destination), title, end: i + 1 };
}

/** The text a list of inline items reads as, for an image's alt. */
function plainText(items) {
  let out = '';
  for (const item of items) {
    if (item.t === 'text' || item.t === 'code') out += item.s;
    else if (item.t === 'delim') out += item.ch.repeat(item.n);
    else if (item.t === 'br') out += ' ';
    else if (item.t === 'img') out += item.alt;
    else if (item.children) out += plainText(item.children);
  }
  return out;
}

/**
 * Pairs delimiter runs into emphasis, strong and strikethrough, by the
 * CommonMark rules. Runs that find no partner stay in the list and read as
 * the characters they are.
 */
function pairDelimiters(items) {
  let c = 0;
  while (c < items.length) {
    const closer = items[c];
    if (closer.t !== 'delim' || !closer.close) {
      c++;
      continue;
    }
    let found = -1;
    for (let o = c - 1; o >= 0; o--) {
      const opener = items[o];
      if (opener.t !== 'delim' || opener.ch !== closer.ch || !opener.open) continue;
      if (closer.ch === '~') {
        if (opener.n !== closer.n) continue;
      } else if (
        (opener.close || closer.open) &&
        (opener.orig + closer.orig) % 3 === 0 &&
        !(opener.orig % 3 === 0 && closer.orig % 3 === 0)
      ) {
        continue;
      }
      found = o;
      break;
    }
    if (found < 0) {
      c++;
      continue;
    }
    const opener = items[found];
    const use = closer.ch === '~' ? closer.n : opener.n >= 2 && closer.n >= 2 ? 2 : 1;
    const tag = closer.ch === '~' ? 'del' : use === 2 ? 'strong' : 'em';
    const children = items.splice(found + 1, c - found - 1);
    items.splice(found + 1, 0, { t: 'wrap', tag, children });
    opener.n -= use;
    closer.n -= use;
    c = found + 2;
    if (opener.n === 0) {
      items.splice(found, 1);
      c--;
    }
    if (closer.n === 0) items.splice(c, 1);
  }
  return items;
}

/**
 * Parses inline Markdown.
 * @param {string} src
 * @param {{ inLink?: boolean }} [context]
 * @returns {MarkdownInline[]}
 */
export function parseInline(src, context = {}) {
  /** @type {any[]} */
  const items = [];
  let text = '';
  const flush = () => {
    if (text) items.push({ t: 'text', s: text });
    text = '';
  };
  const link = (url, title, children) => items.push({ t: 'link', href: url.href, external: url.external, title, children });

  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (ch === '\\') {
      const next = src[i + 1];
      if (next === '\n') {
        flush();
        items.push({ t: 'br' });
        i += 2;
        while (src[i] === ' ') i++;
      } else if (next && ASCII_PUNCTUATION.test(next)) {
        text += next;
        i += 2;
      } else {
        text += ch;
        i++;
      }
      continue;
    }

    if (ch === '\n') {
      const hard = / {2,}$/.test(text);
      text = text.replace(/ +$/, '');
      if (hard) {
        flush();
        items.push({ t: 'br' });
      } else {
        text += '\n';
      }
      i++;
      while (src[i] === ' ') i++;
      continue;
    }

    if (ch === '`') {
      const end = codeSpanEnd(src, i);
      let open = i;
      while (src[open] === '`') open++;
      if (end < 0) {
        text += src.slice(i, open);
        i = open;
        continue;
      }
      let code = src.slice(open, end - (open - i)).replace(/\n/g, ' ');
      if (code.length > 1 && code.startsWith(' ') && code.endsWith(' ') && code.trim()) code = code.slice(1, -1);
      flush();
      items.push({ t: 'code', s: code });
      i = end;
      continue;
    }

    if (ch === '&') {
      const entity = entityAt(src, i);
      if (entity) {
        text += entity.text;
        i += entity.length;
        continue;
      }
    }

    if (ch === '<' && !context.inLink) {
      // <https://…> and <me@example.com>; any other tag is text.
      const auto = /^<([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s<>]*)>/.exec(src.slice(i));
      const mail = auto ? null : /^<([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/.exec(src.slice(i));
      const found = auto || mail;
      if (found) {
        const url = safeUrl(auto ? auto[1] : `mailto:${mail[1]}`);
        if (url) {
          flush();
          link(url, null, [{ t: 'text', s: found[1] }]);
        } else {
          text += found[0];
        }
        i += found[0].length;
        continue;
      }
    }

    if (ch === '[' || (ch === '!' && src[i + 1] === '[')) {
      const image = ch === '!';
      const open = image ? i + 1 : i;
      const close = image || !context.inLink ? bracketEnd(src, open) : -1;
      const tail = close > 0 ? linkTail(src, close + 1) : null;
      if (tail) {
        const raw = src.slice(i, tail.end);
        const url = safeUrl(tail.destination);
        const label = src.slice(open + 1, close);
        if (url && image) {
          const alt = plainText(parseInline(label, { inLink: true })).trim();
          // An image nobody described is not shown.
          if (alt) {
            flush();
            items.push({ t: 'img', src: url.href, alt, title: tail.title });
          } else {
            text += raw;
          }
        } else if (url) {
          flush();
          link(url, tail.title, parseInline(label, { inLink: true }));
        } else {
          // A URL that may not be linked to stays the text that was written.
          text += raw;
        }
        i = tail.end;
        continue;
      }
      text += ch;
      i++;
      continue;
    }

    if (ch === '*' || ch === '_' || ch === '~') {
      let j = i;
      while (src[j] === ch) j++;
      const n = j - i;
      if (ch === '~' && n !== 2) {
        text += src.slice(i, j);
        i = j;
        continue;
      }
      const prev = i > 0 ? src[i - 1] : ' ';
      const next = j < src.length ? src[j] : ' ';
      const prevSpace = WHITESPACE.test(prev);
      const nextSpace = WHITESPACE.test(next);
      const prevPunct = PUNCTUATION.test(prev);
      const nextPunct = PUNCTUATION.test(next);
      const left = !nextSpace && (!nextPunct || prevSpace || prevPunct);
      const right = !prevSpace && (!prevPunct || nextSpace || nextPunct);
      const open = ch === '_' ? left && (!right || prevPunct) : left;
      const close = ch === '_' ? right && (!left || nextPunct) : right;
      flush();
      items.push({ t: 'delim', ch, n, orig: n, open, close });
      i = j;
      continue;
    }

    if (ch === 'h' && !context.inLink && (i === 0 || /[\s(*_~]/.test(src[i - 1]))) {
      const bare = /^https?:\/\/[^\s<]+/.exec(src.slice(i));
      if (bare) {
        let address = bare[0];
        for (;;) {
          const last = address[address.length - 1];
          const unbalanced = last === ')' && address.split(')').length > address.split('(').length;
          if (/[?!.,:;*_~'"]/.test(last) || unbalanced) address = address.slice(0, -1);
          else break;
        }
        const url = address.length > bare[0].indexOf('//') + 2 ? safeUrl(address) : null;
        if (url) {
          flush();
          link(url, null, [{ t: 'text', s: address }]);
          i += address.length;
          continue;
        }
      }
    }

    text += ch;
    i++;
  }
  flush();
  return pairDelimiters(items);
}
