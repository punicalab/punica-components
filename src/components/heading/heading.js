import { PunicaElement, define } from '../../core/element.js';
import styles from './heading.css';

/**
 * A heading: its level is for the outline, its size for the eye.
 *
 * @element punica-heading
 *
 * @attr {'1' | '2' | '3' | '4' | '5' | '6'} level - Rank in the document outline, `2` by default and for anything else.
 * @attr {'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge'} size - Type size; follows the level while unset.
 * @attr {boolean} truncate - Stays on one line and ends in an ellipsis.
 * @attr {'start' | 'center' | 'end' | 'justify'} align - Text alignment.
 *
 * @slot - The heading text.
 *
 * @cssprop --punica-heading-font-size - Type size.
 * @cssprop --punica-heading-font-weight - Weight.
 * @cssprop --punica-heading-line-height - Line height.
 * @cssprop --punica-heading-color - Text colour.
 */
export class PunicaHeading extends PunicaElement {
  static properties = {
    size: {},
    align: {},
    level: { type: Number, default: 2 },
    truncate: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  update() {
    const level = Number.isInteger(this.level) && this.level >= 1 && this.level <= 6 ? this.level : 2;
    this.internals.role = 'heading';
    this.internals.ariaLevel = String(level);
  }
}

define('punica-heading', PunicaHeading);
