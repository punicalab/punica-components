import { PunicaElement, define } from '../../core/element.js';
import styles from './box.css';

/** The spacing scale of `--punica-space-N`. */
const SPACE = new Set([
  0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 112, 128, 144, 160
]);

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * A generic block: an optional border, rounded corners and padding.
 *
 * @element punica-box
 *
 * @attr {boolean} border - Draws a border.
 * @attr {boolean} rounded - Rounds the corners.
 * @attr {boolean} error - Draws the border in the error colour.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {boolean} full-height - Fills its container's block size.
 * @attr {number} padding - A step of the spacing scale (`16` is `--punica-space-16`); other values are ignored.
 *
 * @slot - The content.
 *
 * @cssprop --punica-box-radius - Corner radius of a rounded box.
 * @cssprop --punica-box-border-color - Border colour.
 * @cssprop --punica-box-padding - Padding while `padding` is not set.
 */
export class PunicaBox extends PunicaElement {
  static properties = {
    border: { type: Boolean },
    rounded: { type: Boolean },
    error: { type: Boolean },
    fullWidth: { type: Boolean },
    fullHeight: { type: Boolean },
    padding: { type: Number }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #style = instanceStyle(this.shadowRoot);

  update() {
    if (this.padding != null && SPACE.has(this.padding)) {
      this.#style.setProperty('--_padding', `var(--punica-space-${this.padding})`);
    } else {
      this.#style.removeProperty('--_padding');
    }
  }
}

define('punica-box', PunicaBox);
