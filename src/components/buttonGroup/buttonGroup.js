import { PunicaElement, define } from '../../core/element.js';
import styles from './buttonGroup.css';

/**
 * Buttons that belong together, drawn as one joined control.
 *
 * The group only joins its buttons visually and names them as a group: it
 * writes nothing on them. Give each button its own `variant`, `size`,
 * `color` and `disabled`.
 *
 * @element punica-button-group
 *
 * @attr {string} label - Accessible name of the group.
 * @attr {'horizontal' | 'vertical'} orientation - Direction the buttons are joined in, `horizontal` by default.
 * @attr {boolean} full-width - Fills its container; the buttons share the space.
 *
 * @slot - `punica-button`, `punica-icon-button` and `punica-toggle-button` elements.
 *
 * @cssprop --punica-button-group-radius - Radius of the group's outer corners.
 */
export class PunicaButtonGroup extends PunicaElement {
  static properties = {
    label: {},
    orientation: { default: 'horizontal' },
    fullWidth: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  constructor() {
    super();
    this.internals.role = 'group';
  }

  update() {
    this.internals.ariaLabel = this.label || null;
  }
}

define('punica-button-group', PunicaButtonGroup);
