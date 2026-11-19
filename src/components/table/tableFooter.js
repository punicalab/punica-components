import { PunicaElement, define } from '../../core/element.js';
import styles from './tableFooter.css';

/**
 * The rows of totals under the data of a `punica-table`: a row group.
 *
 * @element punica-table-footer
 *
 * @slot - `punica-table-row` elements.
 */
export class PunicaTableFooter extends PunicaElement {
  static styles = styles;
  static template = `<slot></slot>`;

  constructor() {
    super();
    this.internals.role = 'rowgroup';
    this.shadowRoot.addEventListener('slotchange', () => this.#table?.refresh?.());
  }

  /** @returns {any} */
  get #table() {
    return this.closest('punica-table');
  }
}

define('punica-table-footer', PunicaTableFooter);
