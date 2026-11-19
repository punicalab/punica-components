import { PunicaElement, define } from '../../core/element.js';
import styles from './paper.css';

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
 * A surface: the background a group of content sits on.
 *
 * @element punica-paper
 *
 * @attr {'0' | '1' | '2' | '3' | '4' | '5'} elevation - Depth of the shadow, `0` by default.
 * @attr {'elevated' | 'outlined'} variant - `outlined` draws a border and no shadow; `elevated` by default.
 * @attr {'none' | 'small' | 'medium' | 'large' | 'full'} radius - Corner radius, `medium` by default.
 * @attr {number} padding - A step of the spacing scale (`16` is `--punica-space-16`); other values are ignored.
 *
 * @slot - The content.
 *
 * @cssprop --punica-paper-background - Background.
 * @cssprop --punica-paper-radius - Corner radius.
 * @cssprop --punica-paper-padding - Padding while `padding` is not set.
 * @cssprop --punica-paper-shadow - Shadow.
 */
export class PunicaPaper extends PunicaElement {
  static properties = {
    variant: {},
    elevation: { type: Number },
    radius: {},
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

define('punica-paper', PunicaPaper);
