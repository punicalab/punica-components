import { PunicaElement, define } from '../../core/element.js';
import styles from './tableCell.css';

/**
 * A data cell of a `punica-table-row`.
 *
 * @element punica-table-cell
 *
 * @attr {'start' | 'center' | 'end'} align - Inline alignment of the content, `start` by default.
 *
 * @slot - The cell's content.
 */
export class PunicaTableCell extends PunicaElement {
  static properties = {
    align: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;

  constructor() {
    super();
    this.internals.role = 'cell';
  }
}

define('punica-table-cell', PunicaTableCell);
