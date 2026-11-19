import { PunicaElement, define } from '../../core/element.js';
import styles from './optionGroup.css';

/**
 * A named group of rows in a `punica-complex-selector`. The selector draws
 * the group's heading, and with `multiple` a row that selects every row of
 * the group; the group itself is the `group` its rows belong to.
 *
 * @element punica-option-group
 *
 * @attr {string} label - Name of the group: its heading and its accessible name.
 *
 * @slot - The `punica-option` or `punica-complex-option` rows.
 */
export class PunicaOptionGroup extends PunicaElement {
  static properties = {
    label: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;

  update() {
    this.internals.role = 'group';
    this.internals.ariaLabel = this.label || null;
  }

  /** The rows of the group, in order. @returns {any[]} */
  get options() {
    return [...this.children].filter((c) => c.localName === 'punica-option' || c.localName === 'punica-complex-option');
  }
}

define('punica-option-group', PunicaOptionGroup);
