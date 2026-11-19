import { PunicaElement, define } from '../../core/element.js';
import styles from './container.css';

/**
 * A centred wrapper that keeps content to a readable inline size.
 *
 * @element punica-container
 *
 * @attr {'sm' | 'md' | 'lg' | 'xl' | 'full'} max-width - Largest inline size: 600, 900, 1200 or 1536 px, or none; `lg` by default.
 * @attr {'none' | 'small' | 'medium' | 'large'} gutters - Inline padding, `medium` by default.
 *
 * @slot - The content.
 *
 * @cssprop --punica-container-max-width - Largest inline size.
 * @cssprop --punica-container-gutter - Inline padding.
 */
export class PunicaContainer extends PunicaElement {
  static properties = {
    maxWidth: {},
    gutters: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-container', PunicaContainer);
