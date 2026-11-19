import { PunicaElement, define } from '../../core/element.js';
import styles from './col.css';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * A column of `punica-row`: spans a number of the row's 12 columns, per
 * breakpoint of the row's inline size.
 *
 * A span holds from its breakpoint up until a larger one is set. A column
 * with no span shares the space that is left.
 *
 * @element punica-col
 *
 * @attr {number} xs - Columns spanned at any size, 1 to 12.
 * @attr {number} sm - Columns spanned once the row is 600 px wide.
 * @attr {number} md - Columns spanned once the row is 900 px wide.
 * @attr {number} lg - Columns spanned once the row is 1200 px wide.
 * @attr {number} xl - Columns spanned once the row is 1536 px wide.
 *
 * @slot - The content.
 */
export class PunicaCol extends PunicaElement {
  static properties = {
    xs: { type: Number },
    sm: { type: Number },
    md: { type: Number },
    lg: { type: Number },
    xl: { type: Number }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #style = instanceStyle(this.shadowRoot);

  update() {
    for (const size of SIZES) {
      const span = this[size];
      if (Number.isInteger(span) && span >= 1 && span <= 12) this.#style.setProperty(`--_${size}`, String(span));
      else this.#style.removeProperty(`--_${size}`);
    }
  }
}

define('punica-col', PunicaCol);
