import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './tableHeaderCell.css';

/**
 * A column header of a `punica-table`.
 *
 * With `sortable` its content is a native button: activating it asks for the
 * next direction, fires `punica-sort` and, unless that is prevented, shows the
 * direction here and clears it on the row's other headers. The app reorders
 * the rows.
 *
 * @element punica-table-header-cell
 *
 * @attr {boolean} sortable - The column can be sorted from this header.
 * @attr {'ascending' | 'descending' | 'none'} sort - The direction the column is sorted in, `none` by default.
 * @attr {string} column - Key of the column, sent with `punica-sort`; the header's position by default.
 * @attr {'start' | 'center' | 'end'} align - Inline alignment of the content, `start` by default.
 *
 * @slot - The header's text.
 *
 * @fires punica-sort - The user asked for a sort. `detail` is `{ column, direction }`; cancelable.
 *
 * @csspart button - The native sort button.
 * @csspart sort-icon - The direction indicator.
 */
export class PunicaTableHeaderCell extends PunicaElement {
  static properties = {
    sortable: { type: Boolean },
    sort: {},
    column: {},
    align: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <button part="button" type="button" hidden>
      <span part="sort-icon" class="sort-icon">
        <span class="up">${icons.chevronUp}</span>
        <span class="down">${icons.chevronDown}</span>
      </span>
    </button>
    <slot></slot>
  `;

  #button = this.$('button');
  #slot = this.$('slot');

  constructor() {
    super();
    this.internals.role = 'columnheader';
    this.#button.addEventListener('click', () => this.#onSort());
  }

  update() {
    const button = this.#button;
    // The content sits inside the button only while there is something to press.
    if (this.sortable && this.#slot.parentNode !== button) button.prepend(this.#slot);
    else if (!this.sortable && this.#slot.parentNode === button) this.shadowRoot.append(this.#slot);
    button.hidden = !this.sortable;
    const sort = this.sort === 'ascending' || this.sort === 'descending' ? this.sort : 'none';
    this.internals.ariaSort = this.sortable ? sort : null;
  }

  #onSort() {
    const direction = this.sort === 'ascending' ? 'descending' : 'ascending';
    const siblings = [...(this.parentElement?.children || [])];
    const column = this.column ?? String(siblings.indexOf(this));
    const event = this.emit('sort', { column, direction }, { cancelable: true });
    if (event.defaultPrevented) return;
    for (const other of siblings) {
      if (other !== this && other.localName === this.localName && other.sort) other.sort = null;
    }
    this.sort = direction;
  }
}

define('punica-table-header-cell', PunicaTableHeaderCell);
