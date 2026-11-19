import { PunicaElement, define } from '../../core/element.js';
import styles from './center.css';

/**
 * Centres its content on both axes, or on one.
 *
 * @element punica-center
 *
 * @attr {'both' | 'inline' | 'block'} axis - The axes to centre on, `both` by default.
 * @attr {boolean} inline - Lays out as an inline box, as wide as its content.
 *
 * @slot - The content.
 */
export class PunicaCenter extends PunicaElement {
  static properties = {
    axis: {},
    inline: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-center', PunicaCenter);
