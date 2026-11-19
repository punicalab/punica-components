import { PunicaElement, define } from '../../core/element.js';
import { nextIndex, setRovingTabindex, isRtl, composedContains } from '../../core/a11y.js';
import styles from './tableSelectionToolbar.css';

const CONTROL = 'a[href],button,input:not([type="hidden"]),select,textarea,[tabindex],[contenteditable="true"]';
/** Controls that use the arrow keys themselves. */
const TEXT_ENTRY =
  'input:not([type="button"],[type="checkbox"],[type="radio"],[type="submit"],[type="reset"],[type="image"],[type="file"],[type="color"]),textarea,select,[contenteditable="true"]';

/**
 * The actions for the selected rows of a table: how many rows are selected, a
 * button that clears the selection, and the author's own action buttons.
 *
 * Put it in a `punica-table`'s `toolbar` slot, or anywhere with `for` naming
 * the id of a `punica-table` or a `punica-virtual-table`. It shows nothing and
 * is out of the tab order while no row is selected. It is one stop in the tab
 * order: the arrow keys, Home and End move between its controls. A change of
 * the count is announced politely.
 *
 * @element punica-table-selection-toolbar
 *
 * @attr {string} for - Id of the table, in the same document or shadow root; the closest enclosing table by default.
 * @attr {string} label - Accessible name of the toolbar, `Bulk actions` by default.
 * @attr {string} label-selected - The count text; `{count}` is replaced by the number, formatted in the element's language. `{count} selected` by default.
 * @attr {string} label-clear - Text of the clear button, `Clear selection` by default.
 *
 * @prop {number} count - Number of selected rows (read-only).
 * @prop {HTMLElement | null} table - The table it reads (read-only).
 *
 * @slot - Action controls for the selected rows.
 *
 * @fires punica-select - Not from this element: pressing clear makes the table fire its own `punica-select`, as when a person clears every row.
 *
 * @csspart base - The visible bar.
 * @csspart count - The count text.
 * @csspart actions - The wrapper around the default slot.
 * @csspart clear-button - The native clear button.
 *
 * @cssprop --punica-table-selection-toolbar-background - Background of the bar.
 * @cssprop --punica-table-selection-toolbar-color - Text colour of the bar.
 * @cssprop --punica-table-selection-toolbar-radius - Corner radius of the bar.
 * @cssprop --punica-table-selection-toolbar-padding - Padding of the bar.
 * @cssprop --punica-table-selection-toolbar-gap - Space between controls.
 *
 * @cssstate empty - No row is selected; the bar is not shown.
 */
export class PunicaTableSelectionToolbar extends PunicaElement {
  static properties = {
    for: {},
    label: { default: 'Bulk actions' },
    labelSelected: { default: '{count} selected' },
    labelClear: { default: 'Clear selection' }
  };

  static styles = styles;
  static template = `
    <div part="base" class="bar">
      <span part="count" class="count"></span>
      <div part="actions" class="actions"><slot></slot></div>
      <button part="clear-button" class="clear" type="button"></button>
    </div>
    <div class="status" role="status"></div>
  `;

  #count = this.$('.count');
  #clear = this.$('.clear');
  #status = this.$('.status');
  /** @type {HTMLElement | null} */
  #active = null;
  /** @type {any} */
  #table = null;
  /** @type {AbortController | null} */
  #tableListeners = null;
  /** The count last written, -1 before the first. */
  #shown = -1;

  constructor() {
    super();
    this.shadowRoot.addEventListener('slotchange', () => this.#rove());
    this.#clear.addEventListener('click', () => this.#onClear());
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('focusin', (event) => {
      const items = this.#items();
      const item = this.#itemOf(items, event.composedPath()[0]);
      if (item) {
        this.#active = item;
        setRovingTabindex(items, item);
      }
    });
  }

  disconnected() {
    this.#tableListeners?.abort();
    this.#tableListeners = null;
    this.#table = null;
    this.#shown = -1;
  }

  /** @returns {any} */
  get table() {
    if (this.for) {
      const root = /** @type {Document | ShadowRoot} */ (this.getRootNode());
      return root.getElementById?.(this.for) ?? null;
    }
    return this.closest('punica-table, punica-virtual-table');
  }

  get count() {
    const values = this.table?.selectedValues;
    return Array.isArray(values) ? values.length : 0;
  }

  update() {
    this.#watch();
    const count = this.count;
    const empty = count === 0;
    const lang = this.closest('[lang]')?.lang || navigator.language;
    let number;
    try {
      number = new Intl.NumberFormat(lang).format(count);
    } catch {
      number = String(count);
    }
    const text = String(this.labelSelected).split('{count}').join(number);
    this.#count.textContent = text;
    this.#clear.textContent = this.labelClear;
    // The live region is never hidden, so the first selection is heard too.
    if (this.#shown !== -1 && this.#shown !== count) this.#status.textContent = text;
    this.#shown = count;

    const internals = this.internals;
    internals.role = empty ? null : 'toolbar';
    internals.ariaLabel = empty ? null : this.label;
    internals.ariaOrientation = empty ? null : 'horizontal';
    this.toggleState('empty', empty);
    this.#rove();
  }

  /** Listens to the table it reads for a person's change of selection. */
  #watch() {
    const table = this.isConnected ? this.table : null;
    if (table === this.#table) return;
    this.#tableListeners?.abort();
    this.#tableListeners = null;
    this.#table = table;
    if (!table) return;
    this.#tableListeners = new AbortController();
    const signal = AbortSignal.any([this.#tableListeners.signal, this.signal]);
    table.addEventListener('punica-select', () => this.requestUpdate(), { signal });
  }

  #onClear() {
    const table = this.table;
    if (!table) return;
    const hadFocus = composedContains(this, document.activeElement);
    // A person's clear: the table fires punica-select as for select-all.
    if (typeof table.userSelect === 'function') table.userSelect(null, false);
    else if (typeof table.userClear === 'function') table.userClear();
    else table.clearSelection?.();
    this.update();
    // The bar is gone; focus goes back to the rows rather than the page.
    if (hadFocus) rowControl(table)?.focus();
  }

  /** The enabled controls: the slotted ones, then the clear button. */
  #items() {
    /** @type {HTMLElement[]} */
    const items = [];
    const visit = (el) => {
      if (!(el instanceof HTMLElement) || el.hidden || el.hasAttribute('disabled') || el.inert) return;
      if (el.matches(CONTROL) || el.shadowRoot?.delegatesFocus) items.push(el);
      else for (const child of el.children) visit(child);
    };
    for (const el of this.shadowRoot.querySelector('slot').assignedElements({ flatten: true })) visit(el);
    items.push(this.#clear);
    return items;
  }

  /**
   * @param {HTMLElement[]} items
   * @param {EventTarget} origin
   */
  #itemOf(items, origin) {
    return items.find((item) => composedContains(item, /** @type {Node} */ (origin))) || null;
  }

  #rove() {
    const items = this.#items();
    if (!items.includes(this.#active)) this.#active = null;
    setRovingTabindex(items, this.#active);
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const origin = event.composedPath()[0];
    if (origin instanceof Element && origin.matches(TEXT_ENTRY)) return;
    const items = this.#items();
    const current = items.indexOf(this.#itemOf(items, origin));
    if (current < 0) return;
    const next = nextIndex(event, items.length, current, { orientation: 'horizontal', rtl: isRtl(this) });
    if (next < 0) return;
    event.preventDefault();
    this.#active = items[next];
    setRovingTabindex(items, items[next]);
    items[next].focus();
  }
}

/**
 * Where focus goes once the bar is gone: the select-all checkbox, else the
 * first row's checkbox, else the table itself.
 * @param {any} table
 * @returns {HTMLElement | null}
 */
function rowControl(table) {
  if (table.localName !== 'punica-table') return table;
  const rows = [table.querySelector('punica-table-header punica-table-row'), ...(table.rows || [])];
  for (const row of rows) {
    const input = row?.shadowRoot?.querySelector('input');
    if (input && !input.hidden && input.checkVisibility()) return input;
  }
  return null;
}

define('punica-table-selection-toolbar', PunicaTableSelectionToolbar);
