import { PunicaElement, define } from '../../core/element.js';
import styles from './dialogContent.css';

/**
 * The body of a `punica-dialog`; it scrolls when it is taller than the dialog.
 *
 * @element punica-dialog-content
 *
 * @slot - The content.
 *
 * @cssprop --punica-dialog-content-padding - Padding.
 */
export class PunicaDialogContent extends PunicaElement {
  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-dialog-content', PunicaDialogContent);
