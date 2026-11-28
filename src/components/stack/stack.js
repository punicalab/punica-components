import { PunicaElement, define } from '../../core/element.js';
import styles from './stack.css';

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
 * Lays its children out in one direction with an even gap.
 *
 * @element punica-stack
 *
 * @attr {'vertical' | 'horizontal'} direction - Main axis, `vertical` by default.
 * @attr {number} gap - A step of the spacing scale (`16` is `--punica-space-16`), `8` by default; other values are ignored.
 * @attr {'start' | 'center' | 'end' | 'stretch' | 'baseline'} align - Cross-axis alignment, `stretch` by default.
 * @attr {'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'} justify - Main-axis distribution, `start` by default.
 * @attr {boolean} wrap - Children wrap onto further lines.
 * @attr {boolean} divider - Draws a line between children.
 *
 * @slot - The children. One carrying the attribute `grow` takes the space the others leave on the main axis.
 *
 * @cssprop --punica-stack-gap - Gap while `gap` is not set.
 * @cssprop --punica-stack-divider-color - Colour of the lines between children.
 */
export class PunicaStack extends PunicaElement {
  static properties = {
    direction: {},
    gap: { type: Number },
    align: {},
    justify: {},
    wrap: { type: Boolean },
    divider: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #style = instanceStyle(this.shadowRoot);

  update() {
    if (this.gap != null && SPACE.has(this.gap)) {
      this.#style.setProperty('--_gap', `var(--punica-space-${this.gap})`);
    } else {
      this.#style.removeProperty('--_gap');
    }
  }
}

define('punica-stack', PunicaStack);
