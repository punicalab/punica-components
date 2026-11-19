import { PunicaElement, define } from '../../core/element.js';
import styles from './dialogFooter.css';

/**
 * The actions of a `punica-dialog`, aligned to the inline end.
 *
 * @element punica-dialog-footer
 *
 * @slot - The buttons.
 *
 * @cssprop --punica-dialog-footer-gap - Gap between the buttons.
 */
export class PunicaDialogFooter extends PunicaElement {
  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-dialog-footer', PunicaDialogFooter);
