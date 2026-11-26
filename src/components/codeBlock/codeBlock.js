import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './codeBlock.css';

/**
 * Splits a fragment into one element per line of text, keeping the elements
 * that span a line break open on both sides of it.
 * @param {DocumentFragment} source
 * @returns {HTMLElement[]}
 */
function splitLines(source) {
  /** @type {HTMLElement[]} */
  const lines = [];
  /** @type {Element[]} */
  const stack = [];
  /** @type {Node[]} */
  let chain = [];
  let line;
  const newLine = () => {
    line = document.createElement('span');
    line.className = 'line';
    line.setAttribute('part', 'line');
    lines.push(line);
    chain = [];
    let parent = line;
    for (const el of stack) {
      const clone = el.cloneNode(false);
      parent.appendChild(clone);
      chain.push(clone);
      parent = clone;
    }
  };
  const tip = () => chain[chain.length - 1] || line;
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        child.data.split('\n').forEach((piece, i) => {
          if (i) newLine();
          if (piece) tip().appendChild(document.createTextNode(piece));
        });
      } else if (child.nodeType === 1) {
        const clone = child.cloneNode(false);
        tip().appendChild(clone);
        stack.push(child);
        chain.push(clone);
        walk(child);
        stack.pop();
        chain.pop();
      }
    }
  };
  newLine();
  walk(source);
  return lines;
}

/**
 * Light-DOM text as an author writes it in markup: without the first line
 * break, the trailing space and the indentation every line shares.
 * @param {string} text
 */
function tidy(text) {
  const lines = text.replace(/^[ \t]*\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length);
  const indent = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(indent)).join('\n');
}

/**
 * A block of code with a copy button.
 *
 * The code is the element's text content, or `code` when it is set, and is
 * always written as text. There is no highlighter inside: set `highlight` to
 * a function that returns a fragment and the block draws that instead.
 *
 * @element punica-code-block
 *
 * @attr {string} language - Language of the code, shown as a label and passed to `highlight`.
 * @attr {string} label - Accessible name of the code region.
 * @attr {boolean} line-numbers - Numbers every line.
 * @attr {boolean} wrap - Wraps long lines instead of scrolling.
 * @attr {number} max-lines - Shows this many lines and an expand button for the rest.
 * @attr {boolean} open - Every line is showing although `max-lines` is set.
 * @attr {string} label-copy - Name of the copy button, `Copy` by default.
 * @attr {string} label-copied - Announced after a copy, `Copied` by default.
 * @attr {string} label-expand - Text of the button that shows every line, `Show more` by default.
 * @attr {string} label-collapse - Text of the button that cuts the block again, `Show less` by default.
 *
 * @prop {string | null} code - The code; wins over the text content.
 * @prop {((text: string, language: string | null) => DocumentFragment | null) | null} highlight -
 *   Returns the code as a fragment of marked-up text, or null for plain text.
 *
 * @fires {{ open: boolean }} punica-toggle - The user expanded or cut the block. `detail` is `{ open }`.
 *
 * @csspart base - The frame.
 * @csspart header - The row with the language and the copy button.
 * @csspart language - The language label.
 * @csspart copy-button - The copy button.
 * @csspart pre - The native `<pre>`, which scrolls.
 * @csspart code - The native `<code>`.
 * @csspart line - One line of code.
 * @csspart expand-button - The button under a cut block.
 * @csspart status - The live region that announces a copy.
 *
 * @cssprop --punica-code-block-background - Background.
 * @cssprop --punica-code-block-color - Text colour.
 * @cssprop --punica-code-block-radius - Corner radius.
 * @cssprop --punica-code-block-padding - Padding around the code.
 * @cssprop --punica-code-block-font-size - Font size of the code.
 * @cssprop --punica-code-block-line-number-color - Colour of the line numbers.
 *
 * @cssstate copied - For two seconds after a copy.
 */
export class PunicaCodeBlock extends PunicaElement {
  static properties = {
    language: {},
    label: {},
    lineNumbers: { type: Boolean },
    wrap: { type: Boolean },
    maxLines: { type: Number },
    open: { type: Boolean },
    labelCopy: { default: 'Copy' },
    labelCopied: { default: 'Copied' },
    labelExpand: { default: 'Show more' },
    labelCollapse: { default: 'Show less' },
    code: { attribute: false },
    highlight: { type: Object, attribute: false }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <div part="header" class="header">
        <span part="language" class="language"></span>
        <button part="copy-button" class="copy" type="button">
          <span class="when-idle">${icons.copy}</span>
          <span class="when-copied">${icons.check}</span>
        </button>
      </div>
      <pre part="pre" tabindex="0"><code part="code"></code></pre>
      <button part="expand-button" class="expand" type="button" hidden></button>
      <span part="status" class="status" role="status" aria-live="polite"></span>
    </div>
  `;

  #code = this.$('code');
  #pre = this.$('pre');
  #language = this.$('.language');
  #copy = this.$('.copy');
  #expand = this.$('.expand');
  #status = this.$('.status');
  /** @type {MutationObserver | null} */
  #observer = null;
  #copiedTimer = 0;
  #ready = false;

  constructor() {
    super();
    this.#copy.addEventListener('click', () => this.copy());
    this.#expand.addEventListener('click', () => {
      this.open = !this.open;
      this.emit('toggle', { open: this.open });
    });
  }

  /** The code as it is shown and copied. */
  get text() {
    return this.code ?? tidy(this.textContent || '');
  }

  connected() {
    // The parser adds the text after the element connected, and an app may
    // change it later.
    this.#observer = new MutationObserver(() => {
      if (this.code == null) this.#render();
    });
    this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
    if (this.#ready) this.#render();
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#clearCopied();
  }

  update() {
    this.#ready = true;
    this.#language.textContent = this.language || '';
    this.#copy.setAttribute('aria-label', this.labelCopy);
    this.#copy.title = this.labelCopy;
    if (this.label) {
      this.#pre.setAttribute('role', 'region');
      this.#pre.setAttribute('aria-label', this.label);
    } else {
      this.#pre.removeAttribute('role');
      this.#pre.removeAttribute('aria-label');
    }
    this.#render();
  }

  /**
   * Copies the code to the clipboard and announces it.
   * @returns {Promise<boolean>} whether the clipboard took it
   */
  async copy() {
    try {
      await navigator.clipboard.writeText(this.text);
    } catch {
      return false;
    }
    if (!this.isConnected) return true;
    clearTimeout(this.#copiedTimer);
    this.toggleState('copied', true);
    this.#status.textContent = this.labelCopied;
    this.#copiedTimer = setTimeout(() => this.#clearCopied(), 2000);
    return true;
  }

  #clearCopied() {
    clearTimeout(this.#copiedTimer);
    this.#copiedTimer = 0;
    this.toggleState('copied', false);
    this.#status.textContent = '';
  }

  #render() {
    const text = this.text;
    let fragment = null;
    if (typeof this.highlight === 'function') {
      const result = this.highlight(text, this.language);
      if (result instanceof DocumentFragment) fragment = result;
    }
    if (!fragment) {
      fragment = document.createDocumentFragment();
      fragment.append(text);
    }
    const lines = splitLines(fragment);
    const max = this.maxLines > 0 ? Math.floor(this.maxLines) : Infinity;
    const cut = lines.length > max;
    lines.forEach((line, i) => {
      line.append('\n');
      line.hidden = cut && !this.open && i >= max;
    });
    this.#code.replaceChildren(...lines);
    this.#code.style.setProperty('--_digits', String(String(lines.length).length));
    this.#expand.hidden = !cut;
    this.#expand.textContent = this.open ? this.labelCollapse : this.labelExpand;
    this.#expand.setAttribute('aria-expanded', String(this.open));
  }
}

define('punica-code-block', PunicaCodeBlock);
