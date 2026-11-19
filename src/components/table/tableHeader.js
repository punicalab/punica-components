import { PunicaElement, define } from '../../core/element.js';
import styles from './tableHeader.css';

/**
 * The rows of column headers of a `punica-table`: a row group.
 *
 * @element punica-table-header
 *
 * @slot - `punica-table-row` elements.
 */
export class PunicaTableHeader extends PunicaElement {
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

define('punica-table-header', PunicaTableHeader);
