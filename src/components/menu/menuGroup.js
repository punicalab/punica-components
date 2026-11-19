import { PunicaElement, define } from '../../core/element.js';
import styles from './menuGroup.css';

/**
 * A labelled set of related menu items.
 *
 * @element punica-menu-group
 *
 * @attr {string} label - Accessible name, shown above the items.
 *
 * @slot - The items.
 *
 * @csspart label - The visible label.
 */
export class PunicaMenuGroup extends PunicaElement {
  static properties = {
    label: {}
  };

  static styles = styles;
  static template = `<div part="label" class="label" aria-hidden="true"></div><slot></slot>`;

  connected() {
    this.internals.role = 'group';
  }

  update() {
    this.$('.label').textContent = this.label ?? '';
    this.internals.ariaLabel = this.label || null;
  }
}

define('punica-menu-group', PunicaMenuGroup);
