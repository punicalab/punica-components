import { PunicaElement, define } from '../../core/element.js';
import styles from './row.css';

/** One spacing unit of the grid, as in 1.x. */
const UNIT = 8;

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/** @param {number | null} n a spacing step, or null when it is not one */
const step = (n) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 64 ? n : null);

/**
 * The row of the 12-column grid: a flex container its `punica-col` children
 * measure themselves against.
 *
 * The row is a size container, so a column's `sm` to `xl` spans answer to the
 * row's own inline size (600, 900, 1200, 1536 px), not to the viewport.
 *
 * @element punica-row
 *
 * @attr {number} spacing - Gap on both axes in units of 8 px, 0 to 64; `0` by default.
 * @attr {number} row-spacing - Gap between lines, in the same units; wins over `spacing`.
 * @attr {number} column-spacing - Gap between columns, in the same units; wins over `spacing`.
 * @attr {'row' | 'row-reverse' | 'column' | 'column-reverse'} direction - Main axis, `row` by default.
 * @attr {'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'} justify - Distribution on the main axis.
 * @attr {'start' | 'center' | 'end' | 'stretch' | 'baseline'} align - Alignment on the cross axis.
 * @attr {'wrap' | 'nowrap' | 'wrap-reverse'} wrap - Whether columns wrap, `wrap` by default.
 * @attr {boolean} full-height - Fills its container's block size.
 *
 * @slot - `punica-col` elements.
 *
 * @cssprop --punica-row-columns - Number of columns, 12 by default.
 * @cssprop --punica-row-column-gap - Gap between columns while no spacing attribute is set.
 * @cssprop --punica-row-row-gap - Gap between lines while no spacing attribute is set.
 */
export class PunicaRow extends PunicaElement {
  static properties = {
    direction: {},
    justify: {},
    align: {},
    wrap: {},
    spacing: { type: Number },
    rowSpacing: { type: Number },
    columnSpacing: { type: Number },
    fullHeight: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #style = instanceStyle(this.shadowRoot);

  update() {
    const both = step(this.spacing);
    this.#gap('--punica-row-row-gap', step(this.rowSpacing) ?? both);
    this.#gap('--punica-row-column-gap', step(this.columnSpacing) ?? both);
  }

  #gap(name, steps) {
    if (steps == null) this.#style.removeProperty(name);
    else this.#style.setProperty(name, `${steps * UNIT}px`);
  }
}

define('punica-row', PunicaRow);
