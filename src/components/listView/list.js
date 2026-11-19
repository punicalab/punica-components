import { PunicaElement, define } from '../../core/element.js';
import styles from './list.css';

/**
 * A list of rows.
 *
 * @element punica-list
 *
 * @attr {boolean} dividers - A line between the rows.
 * @attr {boolean} dense - Tighter rows.
 * @attr {string} label - Accessible name.
 *
 * @slot - The `punica-list-item` rows.
 *
 * @cssprop --punica-list-gap - Space between the rows.
 * @cssprop --punica-list-padding - Block padding of the list.
 * @cssprop --punica-list-divider - The line between rows when `dividers` is set.
 * @cssprop --punica-list-radius - Corner radius.
 */
export class PunicaList extends PunicaElement {
  static properties = {
    dividers: { type: Boolean },
    dense: { type: Boolean },
    label: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;

  constructor() {
    super();
    this.internals.role = 'list';
  }

  /** The rows, in order. */
  get items() {
    return [...this.children].filter((el) => el.localName === 'punica-list-item');
  }

  update() {
    this.internals.ariaLabel = this.label || null;
  }
}

define('punica-list', PunicaList);
