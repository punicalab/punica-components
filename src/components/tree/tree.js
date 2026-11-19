import { PunicaElement, define } from '../../core/element.js';
import { nextIndex, createTypeahead, isRtl } from '../../core/a11y.js';
import styles from './tree.css';

const ITEM = 'punica-tree-item';
/** @param {Element} el */
const childItems = (el) => /** @type {any[]} */ ([...el.children].filter((child) => child.localName === ITEM));
const isBranch = (item) => item.hasAttribute('lazy') || childItems(item).length > 0;
const isOpen = (item) => item.hasAttribute('expanded');
const isDisabled = (item) => item.hasAttribute('disabled');

/**
 * A tree view: a hierarchy whose branches expand and collapse.
 *
 * The nodes are `punica-tree-item` elements; an item's children are the
 * items in its default slot.
 *
 * @element punica-tree
 *
 * @attr {'none' | 'single' | 'multiple'} selection - Whether items can be selected, and how many; `none` by default.
 * @attr {string} label - Accessible name.
 *
 * @slot - The top-level `punica-tree-item` elements.
 *
 * @fires punica-select - The user selected or, with `multiple`, deselected an item. `detail` is `{ value, item }`.
 * @fires punica-toggle - The user expanded or collapsed an item; fired on the item. `detail` is `{ open, item }`.
 * @fires punica-load - A `lazy` item was expanded and wants its children; fired on the item. `detail` is `{ item }`.
 *
 * @cssprop --punica-tree-indent - Indent of each level.
 */
export class PunicaTree extends PunicaElement {
  static properties = {
    selection: { default: 'none' },
    label: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #typeahead = createTypeahead();

  constructor() {
    super();
    this.internals.role = 'tree';
    this.$('slot').addEventListener('slotchange', () => {
      this.requestUpdate();
      for (const item of childItems(this)) item.requestUpdate?.();
    });
    this.addEventListener('click', (event) => this.#onClick(event));
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('focusin', (event) => {
      const item = /** @type {Element} */ (event.target);
      if (item.localName === ITEM) this.#rove(item);
    });
  }

  /** Every item of the tree, in document order. */
  get items() {
    return /** @type {any[]} */ ([...this.querySelectorAll(ITEM)]);
  }

  /** The selected items, in document order. */
  get selectedItems() {
    return this.items.filter((item) => item.hasAttribute('selected'));
  }

  /** The items not hidden inside a collapsed branch, in order. */
  get visibleItems() {
    const out = [];
    const walk = (parent) => {
      for (const item of childItems(parent)) {
        out.push(item);
        if (isOpen(item)) walk(item);
      }
    };
    walk(this);
    return out;
  }

  /** Expands every branch. Fires nothing. */
  expandAll() {
    for (const item of this.items) if (isBranch(item) && !item.hasAttribute('lazy')) item.expanded = true;
  }

  /** Collapses every branch. Fires nothing. */
  collapseAll() {
    for (const item of this.items) item.expanded = false;
  }

  connected() {
    this.requestUpdate();
  }

  #enabled() {
    return this.visibleItems.filter((item) => !isDisabled(item));
  }

  #rove(active) {
    for (const item of this.items) item.tabIndex = item === active ? 0 : -1;
  }

  #focus(item) {
    this.#rove(item);
    item.focus();
  }

  #valueOf(item) {
    return item.value ?? item.getAttribute('value') ?? this.#labelOf(item);
  }

  #labelOf(item) {
    return (item.getAttribute('label') ?? item.querySelector(':scope > [slot="label"]')?.textContent ?? '').trim();
  }

  #toggle(item, open = !isOpen(item)) {
    if (!isBranch(item) || open === isOpen(item)) return;
    item.expanded = open;
    item.emit?.('toggle', { open, item });
  }

  #select(item) {
    if (this.selection === 'multiple') {
      item.selected = !item.hasAttribute('selected');
    } else if (this.selection === 'single') {
      if (item.hasAttribute('selected')) return;
      for (const other of this.items) other.selected = other === item;
    } else {
      return;
    }
    this.emit('select', { value: this.#valueOf(item), item });
  }

  /** @param {MouseEvent} event */
  #onClick(event) {
    const path = event.composedPath();
    const row = /** @type {any} */ (path.find((node) => /** @type {any} */ (node).classList?.contains('row')));
    const item = row?.getRootNode().host;
    if (!item || item.localName !== ITEM || !this.contains(item) || isDisabled(item)) return;
    this.#focus(item);
    const onToggle = path.some((node) => /** @type {any} */ (node).classList?.contains('toggle'));
    if (!onToggle) this.#select(item);
    this.#toggle(item);
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    const item = /** @type {any} */ (event.target);
    if (item.localName !== ITEM || event.defaultPrevented) return;
    const enabled = this.#enabled();
    const current = enabled.indexOf(item);
    const rtl = isRtl(this);
    const key = event.key;
    const opens = key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const closes = key === (rtl ? 'ArrowRight' : 'ArrowLeft');

    if (opens || closes) {
      event.preventDefault();
      if (opens) {
        if (isBranch(item) && !isOpen(item)) this.#toggle(item, true);
        else if (isBranch(item)) {
          const child = childItems(item).find((el) => !isDisabled(el));
          if (child) this.#focus(child);
        }
      } else if (isBranch(item) && isOpen(item)) {
        this.#toggle(item, false);
      } else {
        const parent = item.parentElement?.closest(ITEM);
        if (parent && this.contains(parent)) this.#focus(parent);
      }
      return;
    }
    if (key === '*') {
      event.preventDefault();
      for (const sibling of childItems(item.parentElement)) {
        if (!isDisabled(sibling)) this.#toggle(sibling, true);
      }
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (isDisabled(item)) return;
      if (this.selection === 'none') this.#toggle(item);
      else this.#select(item);
      return;
    }
    let index = nextIndex(event, enabled.length, current, { orientation: 'vertical', loop: false });
    if (index < 0) {
      index = this.#typeahead(
        event,
        enabled.map((el) => this.#labelOf(el)),
        current
      );
    }
    if (index >= 0) {
      event.preventDefault();
      this.#focus(enabled[index]);
    }
  }

  update(changed) {
    this.internals.ariaLabel = this.label || null;
    this.internals.ariaMultiSelectable = this.selection === 'multiple' ? 'true' : null;
    const items = this.items;
    if (changed.has('selection')) {
      if (this.selection !== 'multiple') {
        // At most one selection outside multiple, none at all with `none`.
        const keep = this.selection === 'single' ? this.selectedItems[0] : null;
        for (const item of items) if (item !== keep && item.hasAttribute('selected')) item.selected = false;
      }
      for (const item of items) item.requestUpdate?.();
    }

    // Roving tabindex: one visible, enabled item is the tree's tab stop.
    const enabled = this.#enabled();
    let active =
      enabled.find((item) => item.matches(':focus')) ||
      items.find((item) => item.getAttribute('tabindex') === '0') ||
      enabled.find((item) => item.hasAttribute('selected')) ||
      null;
    // An item inside a branch that closed hands over to that branch.
    while (active && !enabled.includes(active)) active = active.parentElement?.closest(ITEM) || null;
    this.#rove(active && this.contains(active) ? active : enabled[0]);
  }
}

define('punica-tree', PunicaTree);
