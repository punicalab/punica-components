import { PunicaElement, define } from '../../core/element.js';
import styles from './cardContent.css';

/**
 * The body of a card.
 *
 * @element punica-card-content
 *
 * @slot - The content.
 *
 * @cssprop --punica-card-content-padding - Padding.
 */
export class PunicaCardContent extends PunicaElement {
  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-card-content', PunicaCardContent);
