import { PunicaElement, define } from '../../core/element.js';
import { nextIndex } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import styles from './virtualTable.css';

/**
 * @typedef {object} VirtualTableColumn
 * @property {string} key Field of a row shown in the column; also the column's id in `punica-sort`.
 * @property {string} [label] Header text.
 * @property {number | string} [width] Track size: a number is px, a string any grid track (`'2fr'`, `'12rem'`); shares the free space by default.
 * @property {'start' | 'center' | 'end'} [align] Alignment of header and cells, `start` by default.
 * @property {boolean} [sortable] The header is a button that asks for a sort.
 * @property {(row: any, index: number, column: VirtualTableColumn) => Node | string} [render]
 *   Builds a cell; a Node is placed as it is, anything else is shown as text.
 */

/**
 * A table that renders only the rows in view, for arrays of any length.
 *
 * `columns` describes the columns and `rows` holds one object per row; every
 * row has the same height (`row-height`). The header stays in place while
 * the body scrolls. A sortable header is a button that fires `punica-sort`
 * and shows the direction: the table never reorders `rows` itself. With
 * `selectable` the rows are options of a grid: arrow keys, Home, End, Page
 * Up and Page Down move between them and Enter, Space or a click picks one.
 *
 * @element punica-virtual-table
 *
 * @attr {number} row-height - Height of every body row in px, 48 by default.
 * @attr {number} overscan - Rows rendered beyond each edge of the view, 6 by default.
 * @attr {string} label - Accessible name of the table.
 * @attr {boolean} selectable - A row can be picked; the table becomes a grid.
 * @attr {string} row-key - Field that identifies a row; the row's index by default.
 * @attr {string} sort-column - `key` of the column the data is sorted by.
 * @attr {'ascending' | 'descending'} sort-direction - Direction of that sort, `ascending` by default.
 *
 * @prop {VirtualTableColumn[]} columns - The columns, in order.
 * @prop {object[]} rows - The data, one object per row.
 * @prop {unknown} value - Key of the selected row, or null.
 * @prop {unknown[]} selectedValues - `[value]` while a row is selected, else `[]` (read-only); what a `punica-table-selection-toolbar` counts.
 *
 * @fires punica-sort - A sortable header was activated. `detail` is `{ column, direction }`; cancel it to keep the indicator where it was.
 * @fires punica-select - A row was picked. `detail` is `{ value, item }`: the row's key and the row. A selection toolbar's clear button fires it with `{ value: null, item: null }`.
 * @fires punica-range-change - The rows in view changed, by scroll, resize or new data. `detail` is `{ start, end }`: the first index in view and the one after the last.
 * @fires punica-near-end - The view came within one screen of the last row, once per `rows` value. `detail` is `{ end }`.
 *
 * @csspart viewport - The scrolling element, which has the `table` or `grid` role.
 * @csspart header - The sticky header group.
 * @csspart header-cell - One column header.
 * @csspart sort-button - The button of a sortable header.
 * @csspart body - The group holding the rows.
 * @csspart row - One body row.
 * @csspart cell - One body cell.
 * @csspart icon - The sort direction glyph.
 *
 * @cssprop --punica-virtual-table-background - Background of the table.
 * @cssprop --punica-virtual-table-header-background - Background of the sticky header.
 * @cssprop --punica-virtual-table-border-color - Colour of the line under each row.
 * @cssprop --punica-virtual-table-cell-padding - Padding of header and body cells.
 * @cssprop --punica-virtual-table-max-height - Largest block size of the scroller when the host has no height of its own, one viewport by default.
 */
export class PunicaVirtualTable extends PunicaElement {
  static properties = {
    columns: { type: Array, attribute: false },
    rows: { type: Array, attribute: false },
    value: { type: Object, attribute: false },
    rowHeight: { type: Number, default: 48 },
    overscan: { type: Number, default: 6 },
    label: {},
    selectable: { type: Boolean },
    rowKey: {},
    sortColumn: {},
    sortDirection: { default: 'ascending' }
  };

  static styles = styles;
  static template = `
    <div part="viewport" class="viewport" role="table">
      <div class="inner" role="none">
        <div part="header" class="header" role="rowgroup">
          <div class="row" role="row" aria-rowindex="1"></div>
        </div>
        <div part="body" class="body" role="rowgroup"></div>
      </div>
    </div>
    <template>${icons.chevronUp}</template>
  `;

  #viewport = this.$('.viewport');
  #inner = this.$('.inner');
  #header = this.$('.header');
  #headRow = this.$('.header .row');
  #body = this.$('.body');
  #icon = this.$('template');
  /** Mounted rows. @type {Map<number, { el: HTMLElement, row: unknown, epoch: number }>} */
  #mounted = new Map();
  /** @type {ResizeObserver | null} */
  #resize = null;
  /** Bumped whenever every mounted row must be rebuilt. */
  #epoch = 0;
  #active = 0;
  #start = -1;
  #end = -1;
  #nearEnd = false;
  /** Index of a row rebuilt while it had focus. @type {number | null} */
  #refocus = null;

  constructor() {
    super();
    this.#viewport.addEventListener('scroll', () => this.#render(), { passive: true });
    this.#headRow.addEventListener('click', (event) => this.#onHeaderClick(event));
    this.#body.addEventListener('click', (event) => this.#onRowClick(event));
    this.#body.addEventListener('keydown', (event) => this.#onRowKeydown(event));
  }

  connected() {
    this.#resize = new ResizeObserver(() => this.#render());
    this.#resize.observe(this.#viewport);
    this.#resize.observe(this.#header);
  }

  disconnected() {
    this.#resize?.disconnect();
    this.#resize = null;
  }

  update(changed) {
    const viewport = this.#viewport;
    const columns = this.#columns;
    if (this.label) viewport.setAttribute('aria-label', this.label);
    else viewport.removeAttribute('aria-label');
    viewport.setAttribute('role', this.selectable ? 'grid' : 'table');
    // A plain table scrolls from the scroller; a grid from its rows.
    if (this.selectable) viewport.removeAttribute('tabindex');
    else viewport.tabIndex = 0;
    viewport.setAttribute('aria-colcount', String(columns.length));
    viewport.setAttribute('aria-rowcount', String(this.#rows.length + 1));

    if (changed.has('columns')) {
      this.#inner.style.setProperty('--_columns', columns.map(track).join(' '));
      this.#buildHeader();
    }
    if (changed.has('columns') || changed.has('sortColumn') || changed.has('sortDirection')) {
      this.#syncSort();
    }
    if (changed.has('columns') || changed.has('selectable')) {
      this.#epoch++;
    }
    if (changed.has('rows')) {
      this.#nearEnd = false;
      this.#active = Math.max(0, Math.min(this.#active, this.#rows.length - 1));
    }
    if ((changed.has('value') || changed.has('rows') || changed.has('rowKey')) && this.selectable) {
      // The grid's tab stop is the selected row, so Tab lands on it.
      const rows = this.#rows;
      if (this.value != null && !this.#isSelected(rows[this.#active], this.#active)) {
        const index = rows.findIndex((row, i) => this.#isSelected(row, i));
        if (index >= 0) this.#active = index;
      }
    }
    this.#render();
    if (changed.has('value')) {
      for (const toolbar of selectionToolbars(this)) toolbar.requestUpdate?.();
    }
  }

  get selectedValues() {
    return this.value == null ? [] : [this.value];
  }

  /**
   * Clears the selection. Like any change made from code, it fires nothing.
   */
  clearSelection() {
    this.value = null;
  }

  /**
   * A person cleared the selection from a selection toolbar.
   * @internal
   */
  userClear() {
    this.value = null;
    this.emit('select', { value: null, item: null });
  }

  /**
   * Moves focus into the table: to the current row of a `selectable` grid,
   * else to the scroller, which scrolls with the keyboard.
   * @param {FocusOptions} [options]
   */
  focus(options) {
    if (this.selectable && this.#rows.length) {
      this.#render();
      this.#mounted.get(this.#active)?.el.focus(options);
    } else {
      this.#viewport.focus(options);
    }
  }

  /** The first row index in view and the one after the last, without overscan. */
  get range() {
    return { start: Math.max(0, this.#start), end: Math.max(0, this.#end) };
  }

  /**
   * Scrolls a row into view.
   * @param {number} index
   * @param {{ align?: 'start' | 'center' | 'end' | 'nearest' }} [options]
   *   Where the row lands under the header, `start` by default; `nearest`
   *   scrolls only as far as needed and not at all for a row already in view.
   */
  scrollToIndex(index, options = {}) {
    const count = this.#rows.length;
    if (!count) return;
    const i = Math.max(0, Math.min(count - 1, Math.trunc(Number(index)) || 0));
    const h = this.#height;
    const view = this.#view;
    const top = i * h;
    const current = this.#viewport.scrollTop;
    let target = top;
    const align = options.align || 'start';
    if (align === 'center') target = top - (view - h) / 2;
    else if (align === 'end') target = top - (view - h);
    else if (align === 'nearest') {
      if (top < current) target = top;
      else if (top + h > current + view) target = top - (view - h);
      else target = current;
    }
    this.#viewport.scrollTop = Math.max(0, target);
    this.#render();
  }

  /** @returns {VirtualTableColumn[]} */
  get #columns() {
    return Array.isArray(this.columns) ? this.columns.filter((c) => c && c.key != null) : [];
  }

  get #rows() {
    return Array.isArray(this.rows) ? this.rows : [];
  }

  get #height() {
    return Math.max(1, this.rowHeight || 48);
  }

  /** Block size of the body's visible part: the scroller less the header. */
  get #view() {
    return Math.max(0, this.#viewport.clientHeight - this.#header.offsetHeight);
  }

  #key(row, index) {
    const field = this.rowKey;
    return field && row != null && row[field] != null ? row[field] : index;
  }

  #isSelected(row, index) {
    return this.value != null && String(this.#key(row, index)) === String(this.value);
  }

  #buildHeader() {
    const cells = this.#columns.map((column) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.setAttribute('part', 'header-cell');
      cell.setAttribute('role', 'columnheader');
      cell.dataset.key = String(column.key);
      if (column.align) cell.dataset.align = column.align;
      const text = document.createElement('span');
      text.className = 'text';
      text.textContent = column.label == null ? '' : String(column.label);
      if (column.sortable) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sort';
        button.setAttribute('part', 'sort-button');
        button.append(text, this.#icon.content.cloneNode(true));
        cell.appendChild(button);
      } else {
        cell.appendChild(text);
      }
      return cell;
    });
    this.#headRow.replaceChildren(...cells);
    // A row with no cells is not a row.
    this.#header.hidden = !cells.length;
  }

  #syncSort() {
    const columns = this.#columns;
    [...this.#headRow.children].forEach((cell, i) => {
      const column = columns[i];
      if (!column?.sortable) return cell.removeAttribute('aria-sort');
      const sorted = this.sortColumn != null && String(column.key) === this.sortColumn;
      cell.setAttribute('aria-sort', sorted ? direction(this.sortDirection) : 'none');
    });
  }

  #render() {
    const rows = this.#rows;
    const columns = this.#columns;
    const count = rows.length;
    const h = this.#height;
    const overscan = Math.max(0, Math.trunc(this.overscan ?? 6));
    const viewport = this.#viewport;
    const body = this.#body;
    const total = `${count * h}px`;
    if (body.style.blockSize !== total) body.style.blockSize = total;

    const view = this.#view;
    const top = Math.min(viewport.scrollTop, Math.max(0, count * h - view));
    const start = Math.min(count, Math.max(0, Math.floor(top / h)));
    const end = Math.min(count, Math.max(start, Math.ceil((top + view) / h)));
    const from = Math.max(0, start - overscan);
    const to = Math.min(count, end + overscan);
    const selectable = this.selectable;
    const active = this.shadowRoot.activeElement;

    for (const [index, entry] of this.#mounted) {
      const stale = index >= count || entry.row !== rows[index] || entry.epoch !== this.#epoch;
      const outside = index < from || index >= to;
      // The row that holds focus, and the grid's one tab stop, stay mounted.
      const keep = !stale && outside && ((active && entry.el.contains(active)) || (selectable && index === this.#active));
      if (stale || (outside && !keep)) {
        // A row rebuilt while it had focus is focused again below.
        if (stale && index < count && entry.el === active) this.#refocus = index;
        entry.el.remove();
        this.#mounted.delete(index);
      }
    }

    const wanted = [];
    for (let index = from; index < to; index++) wanted.push(index);
    if (selectable && count && (this.#active < from || this.#active >= to)) wanted.push(this.#active);

    for (const index of wanted) {
      if (this.#mounted.has(index)) continue;
      const row = rows[index];
      const el = document.createElement('div');
      el.className = 'row';
      el.setAttribute('part', 'row');
      el.setAttribute('role', 'row');
      el.setAttribute('aria-rowindex', String(index + 2));
      el.dataset.index = String(index);
      for (const column of columns) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('part', 'cell');
        cell.setAttribute('role', selectable ? 'gridcell' : 'cell');
        if (column.align) cell.dataset.align = column.align;
        const content = typeof column.render === 'function' ? column.render(row, index, column) : row?.[column.key];
        if (content instanceof Node) cell.appendChild(content);
        else {
          const text = document.createElement('span');
          text.className = 'text';
          text.textContent = content == null ? '' : String(content);
          cell.appendChild(text);
        }
        el.appendChild(cell);
      }
      this.#mounted.set(index, { el, row, epoch: this.#epoch });
      body.insertBefore(el, this.#after(index));
    }

    for (const [index, entry] of this.#mounted) {
      const { el } = entry;
      const offset = `${index * h}px`;
      if (el.style.insetBlockStart !== offset) el.style.insetBlockStart = offset;
      if (el.style.blockSize !== `${h}px`) el.style.blockSize = `${h}px`;
      el.classList.toggle('last', index === count - 1);
      if (selectable) {
        el.tabIndex = index === this.#active ? 0 : -1;
        el.setAttribute('aria-selected', String(this.#isSelected(entry.row, index)));
      }
    }

    if (this.#refocus != null) {
      const index = this.#refocus;
      this.#refocus = null;
      this.#mounted.get(index)?.el.focus({ preventScroll: true });
    }

    if (start !== this.#start || end !== this.#end) {
      this.#start = start;
      this.#end = end;
      this.emit('range-change', { start, end });
    }
    if (count && view && !this.#nearEnd && count - end <= Math.max(overscan, end - start)) {
      this.#nearEnd = true;
      this.emit('near-end', { end });
    }
  }

  /** The mounted row that follows `index` in document order, if any. */
  #after(index) {
    let best = Infinity;
    for (const i of this.#mounted.keys()) if (i > index && i < best) best = i;
    return best === Infinity ? null : this.#mounted.get(best).el;
  }

  #onHeaderClick(event) {
    const button = /** @type {Element} */ (event.target).closest?.('.sort');
    if (!button) return;
    const key = button.parentElement.dataset.key;
    const column = this.#columns.find((c) => String(c.key) === key);
    if (!column) return;
    const same = this.sortColumn === key;
    const next = same && direction(this.sortDirection) === 'ascending' ? 'descending' : 'ascending';
    const sent = this.emit('sort', { column: column.key, direction: next }, { cancelable: true });
    if (sent.defaultPrevented) return;
    this.sortColumn = key;
    this.sortDirection = next;
  }

  /** @param {Event} event */
  #rowOf(event) {
    const el = /** @type {Element} */ (event.target).closest?.('.row');
    return el && this.#body.contains(el) ? /** @type {HTMLElement} */ (el) : null;
  }

  #onRowClick(event) {
    if (!this.selectable) return;
    const el = this.#rowOf(event);
    if (!el) return;
    // A control a column rendered keeps its own click, also one with its own
    // shadow root (a punica-button), whose inner button is on the path.
    const path = event.composedPath();
    const inside = path.slice(0, path.indexOf(el));
    const control = 'button, a[href], input, select, textarea, label, [role=button], [role=link], [contenteditable=""], [contenteditable=true]';
    if (inside.some((node) => node instanceof Element && node.matches(control))) return;
    const index = Number(el.dataset.index);
    this.#setActive(index, false);
    this.#select(index);
  }

  #onRowKeydown(event) {
    if (!this.selectable) return;
    const el = this.#rowOf(event);
    if (!el || event.target !== el) return;
    const count = this.#rows.length;
    const index = Number(el.dataset.index);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.#select(index);
      return;
    }
    const page = Math.max(1, Math.floor(this.#view / this.#height) - 1);
    let next = -1;
    if (event.key === 'PageDown') next = Math.min(count - 1, index + page);
    else if (event.key === 'PageUp') next = Math.max(0, index - page);
    else next = nextIndex(event, count, index, { orientation: 'vertical', loop: false });
    if (next < 0) return;
    event.preventDefault();
    this.#setActive(next, true);
  }

  #setActive(index, focus) {
    this.#active = index;
    if (focus) this.scrollToIndex(index, { align: 'nearest' });
    else this.#render();
    if (focus) this.#mounted.get(index)?.el.focus({ preventScroll: true });
  }

  #select(index) {
    const row = this.#rows[index];
    const value = this.#key(row, index);
    this.value = value;
    this.emit('select', { value, item: row });
  }
}

/** @param {VirtualTableColumn} column */
function track(column) {
  const { width } = column;
  if (typeof width === 'number' && Number.isFinite(width)) return `${Math.max(0, width)}px`;
  if (typeof width === 'string' && width.trim() && !/[;{}]/.test(width)) return width.trim();
  return 'minmax(0, 1fr)';
}

/**
 * The selection toolbars that name `table` with `for`.
 * @param {HTMLElement} table
 * @returns {any[]}
 */
function selectionToolbars(table) {
  const root = /** @type {Document | ShadowRoot} */ (table.getRootNode());
  if (!table.id || !root.querySelectorAll) return [];
  return [...root.querySelectorAll('punica-table-selection-toolbar[for]')].filter((el) => el.getAttribute('for') === table.id);
}

const direction = (value) => (value === 'descending' ? 'descending' : 'ascending');

define('punica-virtual-table', PunicaVirtualTable);
