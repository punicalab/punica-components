import { PunicaElement, define } from '../../core/element.js';
import styles from './tableRow.css';

/**
 * A row of a `punica-table`.
 *
 * In a table with `selectable` the row draws a leading cell with a native
 * checkbox; the row of a `punica-table-header` draws select-all there.
 *
 * @element punica-table-row
 *
 * @attr {string} value - What this row contributes to the table's selection.
 * @attr {boolean} selected - The row is selected.
 * @attr {string} label - Name of this row's checkbox; the table's `label-select-row` by default.
 *
 * @slot - `punica-table-cell` or `punica-table-header-cell` elements.
 *
 * @csspart select-cell - The cell the row draws for its checkbox.
 * @csspart checkbox - The native checkbox.
 *
 * @cssstate header - The row sits in a `punica-table-header`.
 */
export class PunicaTableRow extends PunicaElement {
  static properties = {
    value: {},
    selected: { type: Boolean },
    label: {}
  };

  static styles = styles;
  static template = `
    <div part="select-cell" class="select" role="cell" hidden><input part="checkbox" type="checkbox" /></div>
    <slot></slot>
  `;

  #cell = this.$('.select');
  #input = this.$('input');

  constructor() {
    super();
    this.internals.role = 'row';
    this.#input.addEventListener('change', () => {
      const table = this.#table;
      const checked = this.#input.checked;
      if (table?.userSelect) table.userSelect(this.#section === 'header' ? null : this, checked);
      else this.selected = checked;
    });
  }

  /** @returns {any} */
  get #table() {
    return this.closest('punica-table');
  }

  /** @returns {'header' | 'body' | 'footer'} */
  get #section() {
    const name = this.parentElement?.localName;
    if (name === 'punica-table-header') return 'header';
    if (name === 'punica-table-footer') return 'footer';
    return 'body';
  }

  update(changed) {
    const table = this.#table;
    const mode = table?.selectable;
    const on = mode === 'single' || mode === 'multiple';
    const section = this.#section;
    const input = this.#input;
    this.toggleState('header', section === 'header');
    this.#cell.hidden = !on;
    const all = section === 'header' && mode === 'multiple';
    this.#cell.setAttribute('role', all ? 'columnheader' : 'cell');
    input.hidden = !(section === 'body' || all);
    if (all) {
      const rows = table.rows;
      const count = rows.filter((row) => row.selected).length;
      input.checked = rows.length > 0 && count === rows.length;
      input.indeterminate = count > 0 && count < rows.length;
      input.setAttribute('aria-label', table.labelSelectAll);
    } else {
      input.checked = this.selected;
      input.indeterminate = false;
      input.setAttribute('aria-label', this.label || table?.labelSelectRow || '');
    }
    this.internals.ariaSelected = on && section === 'body' ? String(this.selected) : null;
    if (changed.has('selected') && section === 'body') table?.refresh?.();
  }
}

define('punica-table-row', PunicaTableRow);
