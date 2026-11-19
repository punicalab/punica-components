import { PunicaElement, define } from '../../core/element.js';
import styles from './dialogHeader.css';

/**
 * The title of a `punica-dialog`; it names the dialog.
 *
 * @element punica-dialog-header
 *
 * @attr {number} level - Heading level it reports, 2 by default.
 *
 * @slot - The title.
 */
export class PunicaDialogHeader extends PunicaElement {
  static properties = {
    level: { type: Number, default: 2 }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  connected() {
    this.internals.role = 'heading';
  }

  update() {
    this.internals.ariaLevel = String(this.level);
  }
}

define('punica-dialog-header', PunicaDialogHeader);
