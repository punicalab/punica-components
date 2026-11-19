import { PunicaElement, define } from '../../core/element.js';
import styles from './menuDivider.css';

/**
 * A line between sets of menu items.
 *
 * @element punica-menu-divider
 *
 * @cssprop --punica-menu-divider-color - Colour of the line.
 */
export class PunicaMenuDivider extends PunicaElement {
  static styles = styles;

  connected() {
    this.internals.role = 'separator';
  }
}

define('punica-menu-divider', PunicaMenuDivider);
