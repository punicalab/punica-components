import { PunicaElement, define } from '../../core/element.js';
import styles from './tableBody.css';

/**
 * The rows of data of a `punica-table`: a row group.
 *
 * @element punica-table-body
 *
 * @slot - `punica-table-row` elements.
 */
export class PunicaTableBody extends PunicaElement {
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

define('punica-table-body', PunicaTableBody);
