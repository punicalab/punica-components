import { PunicaElement, define } from '../../core/element.js';
import styles from './table.css';

/**
 * A table of rows and cells the author writes as elements.
 *
 * It is a real table to assistive technology (`table`, `rowgroup`, `row`,
 * `columnheader`, `cell`) and lays out as one. It sorts and filters nothing:
 * a sortable header says what the user asked for and the app reorders the
 * rows.
 *
 * @element punica-table
 *
 * @attr {string} label - Accessible name, when there is no visible caption.
 * @attr {string} caption - Visible caption; also the accessible name unless `label` is set.
 * @attr {boolean} dense - Tighter cells.
 * @attr {boolean} striped - Shades every other body row.
 * @attr {boolean} sticky-header - The header stays in view while the nearest scroll container scrolls.
 * @attr {boolean} dividers - Draws lines between columns.
 * @attr {'single' | 'multiple'} selectable - Rows carry a checkbox; `multiple` adds select-all to the header row.
 * @attr {string} label-select-row - Name of a row's checkbox, `Select row` by default; a row's own `label` wins.
 * @attr {string} label-select-all - Name of the header checkbox, `Select all rows` by default.
 *
 * @prop {PunicaTableRow[]} rows - The body rows (read-only).
 * @prop {(string | null)[]} selectedValues - `value` of every selected row (read-only).
 *
 * @slot - `punica-table-header`, `punica-table-body`, `punica-table-footer`.
 * @slot empty - Shown while the body has no row.
 * @slot toolbar - A `punica-table-selection-toolbar`, drawn above the rows across the table's width.
 *
 * @fires punica-select - The user changed the selection. `detail` is `{ value, item }`: the selected rows' values and the row that was toggled (null for select-all).
 *
 * @csspart caption - The visible caption.
 * @csspart empty - The wrapper of the `empty` slot.
 * @csspart toolbar - The wrapper of the `toolbar` slot.
 *
 * @cssprop --punica-table-cell-padding - Padding of every cell.
 * @cssprop --punica-table-border-color - Colour of row and column lines.
 * @cssprop --punica-table-header-background - Background of header cells.
 * @cssprop --punica-table-header-color - Text colour of header cells.
 * @cssprop --punica-table-stripe-background - Background of a striped row.
 * @cssprop --punica-table-selected-background - Background of a selected row.
 * @cssprop --punica-table-font-size - Font size.
 */
export class PunicaTable extends PunicaElement {
  static properties = {
    label: {},
    caption: {},
    dense: { type: Boolean },
    striped: { type: Boolean },
    stickyHeader: { type: Boolean },
    dividers: { type: Boolean },
    selectable: {},
    labelSelectRow: { default: 'Select row' },
    labelSelectAll: { default: 'Select all rows' }
  };

  static styles = styles;
  static template = `
    <div part="caption" class="caption" aria-hidden="true" hidden></div>
    <div part="toolbar" class="toolbar" hidden><slot name="toolbar"></slot></div>
    <slot></slot>
    <div part="empty" class="empty" hidden><slot name="empty"></slot></div>
  `;

  #caption = this.$('.caption');
  #empty = this.$('.empty');
  #emptySlot = this.$('slot[name="empty"]');
  #toolbar = this.$('.toolbar');
  #toolbarSlot = this.$('slot[name="toolbar"]');

  constructor() {
    super();
    this.internals.role = 'table';
    this.shadowRoot.addEventListener('slotchange', () => this.refresh());
  }

  /** @returns {any[]} */
  get #allRows() {
    return [...this.querySelectorAll('punica-table-row')].filter((row) => row.closest('punica-table') === this);
  }

  get rows() {
    return this.#allRows.filter((row) => !row.closest('punica-table-header, punica-table-footer'));
  }

  get selectedValues() {
    return this.rows.filter((row) => row.selected).map((row) => row.value);
  }

  /**
   * Clears every selected row. Like any change made from code, it fires
   * nothing; the header checkbox and any selection toolbar follow.
   */
  clearSelection() {
    for (const row of this.rows) row.selected = false;
    this.refresh();
  }

  /**
   * Re-reads the rows: the empty state, the header checkbox and the selection
   * toolbars. Sections and rows call it when they change; an app has no need
   * to.
   */
  refresh() {
    const rows = this.rows;
    this.#empty.hidden = rows.length > 0 || this.#emptySlot.assignedNodes().length === 0;
    this.#toolbar.hidden = this.#toolbarSlot.assignedElements().length === 0;
    for (const row of this.#allRows) {
      if (row.closest('punica-table-header')) row.requestUpdate?.();
    }
    for (const toolbar of selectionToolbars(this)) toolbar.requestUpdate?.();
  }

  /**
   * The user toggled a row's checkbox, or the header's (`row` is null).
   * @internal
   * @param {any | null} row
   * @param {boolean} selected
   */
  userSelect(row, selected) {
    const rows = this.rows;
    if (!row) {
      for (const each of rows) each.selected = selected;
    } else {
      row.selected = selected;
      if (selected && this.selectable !== 'multiple') {
        for (const each of rows) if (each !== row) each.selected = false;
      }
    }
    this.refresh();
    this.emit('select', { value: this.selectedValues, item: row });
  }

  update(changed) {
    const caption = this.caption || '';
    this.#caption.textContent = caption;
    this.#caption.hidden = !caption;
    this.internals.ariaLabel = this.label || caption || null;
    if (changed.has('selectable') || changed.has('labelSelectRow') || changed.has('labelSelectAll')) {
      for (const row of this.#allRows) row.requestUpdate?.();
    }
    this.refresh();
  }
}

/**
 * The selection toolbars that read `table`: those inside it and those that
 * name it with `for`.
 * @param {HTMLElement} table
 * @returns {any[]}
 */
function selectionToolbars(table) {
  const found = [...table.querySelectorAll('punica-table-selection-toolbar')];
  const root = /** @type {Document | ShadowRoot} */ (table.getRootNode());
  if (table.id && root.querySelectorAll) {
    for (const el of root.querySelectorAll('punica-table-selection-toolbar[for]')) {
      if (el.getAttribute('for') === table.id && !found.includes(el)) found.push(el);
    }
  }
  return found;
}

define('punica-table', PunicaTable);
