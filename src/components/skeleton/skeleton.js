import { PunicaElement, define } from '../../core/element.js';
import styles from './skeleton.css';

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * The value when it is one CSS length the browser accepts for `width`, else
 * null. Anything that could end a declaration is refused before the browser
 * is asked.
 * @param {string | null} value
 */
function cssLength(value) {
  if (value == null) return null;
  const text = value.trim();
  if (!text || /[;{}<>"'\\]|\/\*/.test(text)) return null;
  return CSS.supports('width', text) ? text : null;
}

/**
 * A grey placeholder in the shape of content that is still loading.
 *
 * @element punica-skeleton
 *
 * @attr {'text' | 'circle' | 'rect'} variant - Shape, `text` by default.
 * @attr {string} width - Inline size, any CSS length (`12rem`, `60%`); other values are ignored.
 * @attr {string} height - Block size, any CSS length; other values are ignored.
 * @attr {number} lines - Lines of a `text` placeholder, 1 to 50; `1` by default. The last of several is shorter.
 *
 * @csspart line - Each bar.
 *
 * @cssprop --punica-skeleton-color - Colour of the bars.
 * @cssprop --punica-skeleton-radius - Corner radius of a `text` or `rect` bar.
 */
export class PunicaSkeleton extends PunicaElement {
  static properties = {
    variant: {},
    width: {},
    height: {},
    lines: { type: Number, default: 1 }
  };

  static styles = styles;
  static template = `<span part="line" class="line"></span>`;

  #style = instanceStyle(this.shadowRoot);

  update(changed) {
    // A placeholder says nothing; the region that is loading announces itself.
    this.internals.ariaHidden = 'true';

    this.#length('--_width', this.width);
    this.#length('--_height', this.height);

    if (changed.has('lines') || changed.has('variant')) {
      const text = this.variant !== 'circle' && this.variant !== 'rect';
      const wanted = text && Number.isInteger(this.lines) && this.lines >= 1 && this.lines <= 50 ? this.lines : 1;
      const root = this.shadowRoot;
      const bars = root.querySelectorAll('.line');
      for (let i = bars.length; i < wanted; i++) root.append(bars[0].cloneNode());
      for (let i = bars.length - 1; i >= wanted; i--) bars[i].remove();
    }
  }

  #length(name, value) {
    const length = cssLength(value);
    if (length) this.#style.setProperty(name, length);
    else this.#style.removeProperty(name);
  }
}

define('punica-skeleton', PunicaSkeleton);
