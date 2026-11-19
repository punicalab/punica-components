import { PunicaElement, define } from '../../core/element.js';
import styles from './visuallyHidden.css';

/**
 * Content for assistive technology only: read aloud, never drawn.
 *
 * @element punica-visually-hidden
 *
 * @attr {boolean} focusable - Shows the content while focus is inside it, for a skip link.
 *
 * @slot - The content.
 */
export class PunicaVisuallyHidden extends PunicaElement {
  static properties = {
    focusable: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-visually-hidden', PunicaVisuallyHidden);
