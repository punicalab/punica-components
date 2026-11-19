import { PunicaElement, define } from '../../core/element.js';
import styles from './appBar.css';

/**
 * The bar across the top of an application: its name, its navigation, the
 * account.
 *
 * @element punica-app-bar
 *
 * @attr {'static' | 'sticky' | 'fixed'} position - How the bar holds its place while the page scrolls, `static` by default.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Background, `primary` by default; `neutral` is the surface colour with a line under it.
 *
 * @slot - The middle of the bar, a title or a `punica-toolbar`.
 * @slot start - Leading content, a menu button or a logo.
 * @slot end - Trailing content, the account.
 *
 * @csspart content - The wrapper around the default slot.
 *
 * @cssprop --punica-app-bar-background - Background.
 * @cssprop --punica-app-bar-color - Text colour.
 * @cssprop --punica-app-bar-shadow - Shadow under the bar.
 * @cssprop --punica-app-bar-padding - Inline padding.
 * @cssprop --punica-app-bar-gap - Space between the three areas.
 */
export class PunicaAppBar extends PunicaElement {
  static properties = {
    position: {},
    color: {}
  };

  static styles = styles;
  static template = `<slot name="start"></slot><div part="content" class="content"><slot></slot></div><slot name="end"></slot>`;

  update() {
    this.internals.role = 'banner';
  }
}

define('punica-app-bar', PunicaAppBar);
