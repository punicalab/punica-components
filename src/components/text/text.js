import { PunicaElement, define } from '../../core/element.js';
import styles from './text.css';

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * The number of lines a `truncate` value asks for: 1 for the bare attribute,
 * the integer for 1 to 99, 0 for anything else.
 * @param {string | null} value
 */
function lines(value) {
  if (value == null) return 0;
  if (value.trim() === '') return 1;
  if (!/^\s*\d{1,2}\s*$/.test(value)) return 0;
  return Number(value);
}

/**
 * Running text in one of the type styles.
 *
 * @element punica-text
 *
 * @attr {'body' | 'caption' | 'label' | 'overline' | 'code'} variant - Type style, `body` by default.
 * @attr {'small' | 'medium' | 'large'} size - Type size; follows the variant while unset.
 * @attr {'thin' | 'light' | 'regular' | 'medium' | 'semi-bold' | 'bold' | 'extra-bold'} weight - Font weight.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral' | 'muted'} color - Text colour; inherited while unset.
 * @attr {string} truncate - Lines to show before an ellipsis, 1 to 99; the bare attribute is one line.
 * @attr {'start' | 'center' | 'end' | 'justify'} align - Text alignment; makes the element a block.
 * @attr {boolean} block - Lays out as a block, a paragraph.
 * @attr {boolean} italic - Sets the text in italics: an aside, a placeholder line.
 * @attr {boolean} tabular - Gives every figure the same width, so numbers line up in a column.
 * @attr {boolean} mono - Draws the text in the fixed-width face, with none of `code`'s box: an identifier, a path, a value in a row.
 *
 * @slot - The text.
 *
 * @cssprop --punica-text-font-size - Type size.
 * @cssprop --punica-text-line-height - Line height.
 *
 * @cssstate truncated - `truncate` holds a valid number of lines.
 */
export class PunicaText extends PunicaElement {
  static properties = {
    variant: {},
    size: {},
    weight: {},
    color: {},
    truncate: {},
    align: {},
    block: { type: Boolean },
    mono: { type: Boolean },
    italic: { type: Boolean },
    tabular: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #style = instanceStyle(this.shadowRoot);

  update() {
    const count = lines(this.truncate);
    this.toggleState('truncated', count > 0);
    if (count > 0) this.#style.setProperty('--_lines', String(count));
    else this.#style.removeProperty('--_lines');
  }
}

define('punica-text', PunicaText);
