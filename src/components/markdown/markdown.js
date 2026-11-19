import { PunicaElement, define } from '../../core/element.js';
import { parseMarkdown } from './parser.js';
import styles from './markdown.css';

/** Common leading white space removed, for Markdown written inside indented HTML. */
function dedent(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let indent = Infinity;
  for (const line of lines) {
    if (line.trim()) indent = Math.min(indent, line.length - line.trimStart().length);
  }
  return indent && indent !== Infinity ? lines.map((line) => line.slice(indent)).join('\n') : lines.join('\n');
}

/**
 * @typedef {object} Rendered one rendered block
 * @property {string} raw
 * @property {string} sig
 * @property {Node} node
 * @property {Rendered[] | null} kids rendered child blocks, for a quote, a list or an item
 * @property {HTMLElement} [code] the `<code>` of a built-in code block
 * @property {HTMLInputElement} [box] the checkbox of a task item
 */

/**
 * Renders Markdown to DOM in its shadow root.
 *
 * The source is the `value` property or, while that is unset, the element's
 * own text. The tree is built with `createElement` and `textContent` only:
 * raw HTML in the source shows as text, and a link or image is made only for
 * an `http:`, `https:`, `mailto:` or relative URL. A change to the source
 * touches only the blocks whose text changed, so while a response streams in
 * every finished block keeps its nodes, and a selection inside them survives.
 *
 * @element punica-markdown
 *
 * @attr {string} value - The Markdown source. Without it, the element's text content is used.
 * @attr {boolean} streaming - The source is still growing: the element is `aria-busy` and shows a caret after the last block.
 * @attr {boolean} no-images - Images render as links to the picture, so nothing is fetched until a person asks.
 *
 * @prop {((code: string, language: string) => Node | null) | null} renderCodeBlock - Called for every fenced code block; return a node (a `punica-code-block`) to use it, or null for the built-in `<pre><code>`.
 *
 * @csspart base - The container of the rendered blocks.
 * @csspart heading - A heading.
 * @csspart paragraph - A paragraph.
 * @csspart link - A link.
 * @csspart image - An image.
 * @csspart inline-code - An inline code span.
 * @csspart code-block - The `<pre>` of a built-in code block.
 * @csspart code - The `<code>` inside it.
 * @csspart blockquote - A block quote.
 * @csspart list - A list.
 * @csspart list-item - A list item.
 * @csspart checkbox - The checkbox of a task item.
 * @csspart table-wrap - The scrolling wrapper around a table.
 * @csspart table - A table.
 * @csspart hr - A thematic break.
 *
 * @cssprop --punica-markdown-gap - Space between blocks.
 * @cssprop --punica-markdown-link-color - Colour of links.
 * @cssprop --punica-markdown-code-background - Background of code spans and blocks.
 * @cssprop --punica-markdown-code-font-family - Font of code spans and blocks.
 * @cssprop --punica-markdown-border-color - Colour of table lines, rules and the quote bar.
 *
 * @cssstate streaming - The source is still growing.
 */
export class PunicaMarkdown extends PunicaElement {
  static properties = {
    value: { reflect: false },
    streaming: { type: Boolean },
    noImages: { type: Boolean },
    renderCodeBlock: { type: Object, attribute: false }
  };

  static styles = styles;
  static template = `<div part="base" class="base"></div>`;

  #base = this.$('.base');
  /** @type {Rendered[]} */
  #rendered = [];
  /** @type {MutationObserver | null} */
  #observer = null;

  connected() {
    // Only the element's own text is watched, and only while it is the source.
    this.#observer = new MutationObserver(() => {
      if (this.value == null) this.#render();
    });
    this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  update(changed) {
    this.toggleState('streaming', this.streaming);
    this.internals.ariaBusy = this.streaming ? 'true' : null;
    if (changed.has('renderCodeBlock') || changed.has('noImages')) {
      // What a block renders to changed, not only which blocks there are.
      this.#base.replaceChildren();
      this.#rendered = [];
    }
    if (changed.has('value') || changed.has('renderCodeBlock') || changed.has('noImages')) this.#render();
  }

  #render() {
    const source = this.value ?? dedent(this.textContent || '');
    this.#rendered = this.#patch(this.#base, this.#rendered, parseMarkdown(source));
  }

  /**
   * Brings `parent` in line with `blocks`, keeping every node whose block did
   * not change and descending into a quote or list that only grew.
   * @param {Node} parent
   * @param {Rendered[]} old
   * @param {import('./parser.js').MarkdownBlock[]} blocks
   * @returns {Rendered[]}
   */
  #patch(parent, old, blocks) {
    const next = [];
    for (let i = 0; i < blocks.length; i++) {
      /** @type {any} */
      const block = blocks[i];
      const was = old[i];
      const same = was && was.sig === block.sig;
      let rendered;
      if (same && was.raw === block.raw) {
        rendered = was;
      } else if (same && was.kids && block.children) {
        was.kids = this.#patch(was.node, was.kids, block.children);
        was.raw = block.raw;
        if (was.box) was.box.setAttribute('aria-label', block.label);
        rendered = was;
      } else if (same && was.code) {
        was.code.textContent = block.text;
        was.raw = block.raw;
        rendered = was;
      } else {
        rendered = this.#create(block);
        if (was) parent.replaceChild(rendered.node, was.node);
        else parent.appendChild(rendered.node);
      }
      next.push(rendered);
    }
    for (let i = blocks.length; i < old.length; i++) old[i].node.parentNode?.removeChild(old[i].node);
    return next;
  }

  /**
   * @param {any} block
   * @returns {Rendered}
   */
  #create(block) {
    /** @type {Rendered} */
    const rendered = { raw: block.raw, sig: block.sig, node: /** @type {any} */ (null), kids: null };
    switch (block.type) {
      case 'heading':
        rendered.node = this.#inline(block.inline, el(`h${block.level}`, 'heading'));
        break;
      case 'paragraph':
        rendered.node = this.#inline(block.inline, el('p', 'paragraph'));
        break;
      case 'hr':
        rendered.node = el('hr', 'hr');
        break;
      case 'code': {
        const custom = typeof this.renderCodeBlock === 'function' ? this.renderCodeBlock(block.text, block.language) : null;
        if (custom instanceof Node) {
          rendered.node = custom;
          break;
        }
        const pre = el('pre', 'code-block');
        const code = el('code', 'code');
        const language = block.language.replace(/[^\w+#.-]/g, '');
        if (language) code.className = `language-${language}`;
        code.textContent = block.text;
        pre.appendChild(code);
        rendered.node = pre;
        rendered.code = code;
        break;
      }
      case 'blockquote':
        rendered.node = el('blockquote', 'blockquote');
        rendered.kids = this.#patch(rendered.node, [], block.children);
        break;
      case 'list': {
        const list = el(block.ordered ? 'ol' : 'ul', 'list');
        if (block.ordered && block.start !== 1) list.setAttribute('start', String(block.start));
        list.className = block.loose ? 'loose' : 'tight';
        rendered.node = list;
        rendered.kids = this.#patch(list, [], block.children);
        break;
      }
      case 'item': {
        const item = el('li', 'list-item');
        if (block.task) {
          item.className = 'task';
          const box = /** @type {HTMLInputElement} */ (el('input', 'checkbox'));
          box.type = 'checkbox';
          box.disabled = true;
          box.checked = block.checked;
          box.setAttribute('aria-label', block.label);
          item.appendChild(box);
          rendered.box = box;
        }
        rendered.node = item;
        rendered.kids = this.#patch(item, [], block.children);
        break;
      }
      case 'table': {
        const wrap = el('div', 'table-wrap');
        wrap.className = 'table-wrap';
        const table = el('table', 'table');
        const row = (cells, tag) => {
          const tr = document.createElement('tr');
          cells.forEach((cell, c) => {
            const td = this.#inline(cell, document.createElement(tag));
            if (tag === 'th') td.setAttribute('scope', 'col');
            if (block.align[c]) td.className = `align-${block.align[c]}`;
            tr.appendChild(td);
          });
          return tr;
        };
        const head = document.createElement('thead');
        head.appendChild(row(block.head, 'th'));
        table.appendChild(head);
        if (block.rows.length) {
          const body = document.createElement('tbody');
          for (const cells of block.rows) body.appendChild(row(cells, 'td'));
          table.appendChild(body);
        }
        wrap.appendChild(table);
        rendered.node = wrap;
        break;
      }
      default:
        rendered.node = document.createTextNode('');
    }
    return rendered;
  }

  /**
   * Appends inline items to `parent` as text nodes and elements.
   * @template {Element} T
   * @param {any[]} items
   * @param {T} parent
   * @returns {T}
   */
  #inline(items, parent) {
    let text = '';
    const flush = () => {
      if (text) parent.appendChild(document.createTextNode(text));
      text = '';
    };
    const anchor = (href, external, title) => {
      const a = el('a', 'link');
      a.setAttribute('href', href);
      if (title) a.setAttribute('title', title);
      if (external) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
      return a;
    };
    for (const item of items) {
      switch (item.t) {
        case 'text':
          text += item.s;
          continue;
        case 'delim':
          text += item.ch.repeat(item.n);
          continue;
      }
      flush();
      switch (item.t) {
        case 'br':
          parent.appendChild(document.createElement('br'));
          break;
        case 'code': {
          const code = el('code', 'inline-code');
          code.textContent = item.s;
          parent.appendChild(code);
          break;
        }
        case 'wrap':
          parent.appendChild(this.#inline(item.children, document.createElement(item.tag)));
          break;
        case 'link':
          parent.appendChild(this.#inline(item.children, anchor(item.href, item.external, item.title)));
          break;
        case 'img': {
          if (this.noImages) {
            const a = anchor(item.src, true, item.title);
            a.textContent = item.alt;
            parent.appendChild(a);
            break;
          }
          const img = el('img', 'image');
          img.setAttribute('src', item.src);
          img.setAttribute('alt', item.alt);
          if (item.title) img.setAttribute('title', item.title);
          img.setAttribute('loading', 'lazy');
          img.setAttribute('decoding', 'async');
          parent.appendChild(img);
          break;
        }
      }
    }
    flush();
    return parent;
  }
}

/**
 * @param {string} tag
 * @param {string} part
 */
function el(tag, part) {
  const node = document.createElement(tag);
  node.setAttribute('part', part);
  return node;
}

define('punica-markdown', PunicaMarkdown);
