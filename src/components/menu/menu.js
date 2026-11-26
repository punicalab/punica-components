import { PunicaElement, define } from '../../core/element.js';
import { Overlay, overlayCss } from '../../core/overlay.js';
import { nextIndex, deepActiveElement, isRtl, composedContains } from '../../core/a11y.js';
import { PunicaMenuItem } from './menuItem.js';
import styles from './menu.css';

const GROUPS = new Set(['punica-menu-group', 'punica-menu-radio-group']);

/**
 * A menu of actions that opens in the top layer from a menu button.
 *
 * The element in the `trigger` slot is the menu button. The items are the
 * menu's children: `punica-menu-item`, `punica-menu-checkbox-item`,
 * `punica-menu-radio-item` inside a `punica-menu-radio-group`,
 * `punica-menu-group` and `punica-menu-divider`. A `punica-menu` placed in an
 * item's `submenu` slot is that item's submenu.
 *
 * Keyboard (WAI-ARIA APG menu button): Enter, Space, ArrowDown and ArrowUp on
 * the trigger open the menu; arrows, Home, End and typed characters move
 * between items; Enter and Space activate; ArrowRight opens a submenu and
 * ArrowLeft closes it (mirrored in right-to-left text); Escape closes and
 * returns focus; Tab closes.
 *
 * `punica-select`, `punica-open` and `punica-close` of a submenu bubble
 * through its parents; `event.target` is the menu they came from.
 *
 * @element punica-menu
 *
 * @attr {string} label - Accessible name of the menu; the trigger names it by default.
 * @attr {boolean} open - The menu is showing.
 * @attr {'block-end' | 'block-start' | 'inline-end' | 'inline-start'} side - Side of the trigger the menu opens on, `block-end` by default.
 * @attr {'start' | 'center' | 'end'} align - Alignment along that side, `start` by default.
 * @attr {number} offset - Gap between trigger and menu in px, 4 by default.
 *
 * @prop {Element | null} anchor - Element the menu is placed against instead of the trigger.
 * @prop {{ x: number, y: number } | null} point - Viewport point the menu opens at instead of an anchor.
 * @prop {PunicaMenuItem[]} items - Every item of this menu, in order (read-only).
 *
 * @slot - The menu's items.
 * @slot trigger - The menu button.
 *
 * @fires {{ value: string, item: HTMLElement }} punica-select - An item was chosen. `detail` is `{ value, item }`; `value` is the item's `value`, or its text. Cancelable: preventing it keeps the menu open.
 * @fires punica-open - The menu opened.
 * @fires {{ reason: 'select' | 'escape' | 'outside' | 'tab' | 'api' }} punica-close - The menu closed. `detail.reason` is `select`, `escape`, `outside`, `tab` or `api`.
 *
 * @csspart panel - The floating menu.
 *
 * @cssprop --punica-menu-radius - Corner radius.
 * @cssprop --punica-menu-padding - Padding around the items.
 * @cssprop --punica-menu-background - Menu background.
 * @cssprop --punica-menu-shadow - Menu shadow.
 * @cssprop --punica-menu-min-width - Smallest inline size.
 * @cssprop --punica-menu-max-width - Largest inline size.
 * @cssprop --punica-menu-max-height - Largest block size before the items scroll.
 */
export class PunicaMenu extends PunicaElement {
  static properties = {
    label: {},
    open: { type: Boolean },
    side: { default: 'block-end' },
    align: { default: 'start' },
    offset: { type: Number, default: 4 },
    anchor: { type: Object, attribute: false },
    point: { type: Object, attribute: false }
  };

  static styles = [overlayCss, styles];
  static template = `
    <slot name="trigger"></slot>
    <div part="panel" popover="manual" role="menu" tabindex="-1"><div class="items"><slot></slot></div></div>
  `;

  #panel = this.$('[part="panel"]');
  #slot = this.$('slot:not([name])');
  #triggerSlot = this.$('slot[name="trigger"]');
  #overlay = new Overlay(this.#panel);
  #typed = '';
  #typedTimer = 0;
  /** @type {PunicaMenu | null} */
  #parent = null;
  /** @type {PunicaMenuItem | null} */
  #parentItem = null;
  /** @type {'first' | 'last' | 'panel' | 'none'} */
  #focusMode = 'first';
  #reason = 'api';
  /** @type {Element | null} */
  #returnFocus = null;
  /** @type {AbortController | null} */
  #openAbort = null;
  #shown = false;
  #hoverTimer = 0;

  constructor() {
    super();
    this.#triggerSlot.addEventListener('click', (event) => this.#onTriggerClick(event));
    this.#triggerSlot.addEventListener('keydown', (event) => this.#onTriggerKeydown(event));
    this.#triggerSlot.addEventListener('slotchange', () => this.requestUpdate());
    this.#panel.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.#panel.addEventListener('click', (event) => {
      const item = this.#itemOf(event);
      if (item) this.#activate(item, false);
    });
    this.#panel.addEventListener('pointerover', (event) => {
      const item = this.#itemOf(event);
      if (item && !item.disabled) this.#hover(item);
    });
  }

  get #trigger() {
    return this.#triggerSlot.assignedElements({ flatten: true })[0] || null;
  }

  get #isSubmenu() {
    return !!this.#parent && this.#parent.#shown;
  }

  /** Every item of this menu, in order, without those of its submenus. */
  get items() {
    /** @type {PunicaMenuItem[]} */
    const out = [];
    const visit = (el) => {
      if (el instanceof PunicaMenuItem) out.push(el);
      else if (GROUPS.has(el.localName)) for (const child of el.children) visit(child);
    };
    for (const el of this.#slot.assignedElements({ flatten: true })) visit(el);
    return out;
  }

  /** The floating menu element. */
  get panel() {
    return this.#panel;
  }

  /**
   * Opens the menu.
   * @param {{ focus?: 'first' | 'last' | 'panel' | 'none' }} [options] where
   *   focus goes: the first item by default.
   */
  show(options) {
    this.#focusMode = options?.focus || 'first';
    if (this.#shown) this.#focusInitial();
    this.open = true;
  }

  /**
   * Closes the menu and its submenus.
   * @param {'select' | 'escape' | 'outside' | 'tab' | 'api'} [reason]
   */
  hide(reason = 'api') {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
    this.#teardown(true);
  }

  /** Opens the menu when it is closed, closes it when it is open. */
  toggle() {
    if (this.open) this.hide();
    else this.show();
  }

  /** Re-measures after the items changed. */
  reposition() {
    this.#overlay.reposition();
  }

  connected() {
    // Moved while open: open again in the new place.
    if (this.open && !this.#shown) {
      queueMicrotask(() => this.isConnected && this.open && !this.#shown && this.#setup());
    }
  }

  disconnected() {
    this.#teardown(false);
  }

  update(changed) {
    const panel = this.#panel;
    const trigger = this.#trigger;
    if (this.label) panel.setAttribute('aria-label', this.label);
    else panel.removeAttribute('aria-label');
    if ('ariaLabelledByElements' in panel) {
      panel.ariaLabelledByElements = !this.label && trigger ? [trigger] : null;
    }
    if (trigger) {
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', String(this.open));
    }

    if (this.open && !this.#shown) this.#setup();
    else if (!this.open && this.#shown) this.#teardown(true);
    else if (
      this.open &&
      ['side', 'align', 'offset', 'anchor', 'point'].some((name) => changed.has(name))
    ) {
      this.#place();
    }
  }

  #place() {
    if (this.#isSubmenu && this.#parentItem) {
      this.#overlay.show(this.#parentItem, { side: 'inline-end', align: 'start', offset: 0 });
      return;
    }
    const point = /** @type {any} */ (this.point);
    this.#overlay.show(point ? null : /** @type {any} */ (this.anchor) || this.#trigger || this, {
      side: /** @type {any} */ (this.side),
      align: /** @type {any} */ (this.align),
      offset: this.offset,
      point: point || undefined
    });
  }

  #setup() {
    this.#shown = true;
    this.#returnFocus = deepActiveElement();
    this.#place();
    this.#openAbort = new AbortController();
    if (!this.#isSubmenu) {
      document.addEventListener(
        'pointerdown',
        (event) => {
          const path = event.composedPath();
          if (path.includes(this) || path.includes(this.#panel)) return;
          const anchor = this.anchor;
          if (anchor && path.includes(/** @type {any} */ (anchor))) return;
          this.hide('outside');
        },
        { capture: true, signal: this.#openAbort.signal }
      );
    }
    this.#focusInitial();
    this.emit('open');
  }

  #focusInitial() {
    const mode = this.#focusMode;
    this.#focusMode = 'first';
    if (mode === 'none') return;
    const items = this.#enabled();
    if (mode === 'panel' || !items.length) this.#panel.focus({ preventScroll: true });
    else (mode === 'last' ? items[items.length - 1] : items[0]).focus({ preventScroll: true });
  }

  /**
   * @param {boolean} announce
   * @param {boolean} [refocus]
   */
  #teardown(announce, refocus = true) {
    if (!this.#shown) return;
    const active = deepActiveElement();
    const inside = !active || active === document.body || composedContains(this.#panel, active);
    this.#shown = false;
    clearTimeout(this.#hoverTimer);
    clearTimeout(this.#typedTimer);
    this.#typed = '';
    this.#openAbort?.abort();
    this.#openAbort = null;
    for (const item of this.items) {
      const sub = item.submenu;
      if (sub instanceof PunicaMenu && sub.#shown) {
        sub.open = false;
        sub.#teardown(announce, false);
      }
    }
    this.#overlay.hide();
    const back = this.#parentItem && this.#parent?.#shown ? this.#parentItem : this.#trigger || this.#returnFocus;
    this.#returnFocus = null;
    if (!announce) return;
    const reason = this.#reason;
    this.#reason = 'api';
    if (refocus && reason !== 'outside' && inside && back instanceof HTMLElement && back.isConnected) {
      back.focus({ preventScroll: true });
    }
    this.emit('close', { reason });
  }

  #enabled() {
    return this.items.filter((item) => !item.disabled);
  }

  #root() {
    /** @type {PunicaMenu} */
    let menu = this;
    while (menu.#isSubmenu) menu = /** @type {PunicaMenu} */ (menu.#parent);
    return menu;
  }

  /**
   * The item of this menu an event came from; `null` for the panel itself or
   * other content, `undefined` when the event belongs to a submenu.
   * @param {Event} event
   */
  #itemOf(event) {
    const path = event.composedPath();
    const end = path.indexOf(this.#panel);
    for (let i = 0; i < end; i++) {
      const node = path[i];
      if (node instanceof PunicaMenu) return undefined;
      if (node instanceof PunicaMenuItem) return this.items.includes(node) ? node : undefined;
    }
    return null;
  }

  #onTriggerClick(event) {
    const trigger = this.#trigger;
    if (!trigger || trigger.hasAttribute('disabled')) return;
    if (this.open) this.hide();
    // A click with no pointer behind it is Enter or Space on the button.
    else this.show({ focus: event.detail === 0 ? 'first' : 'panel' });
  }

  #onTriggerKeydown(event) {
    const trigger = this.#trigger;
    if (!trigger || trigger.hasAttribute('disabled')) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.show({ focus: event.key === 'ArrowUp' ? 'last' : 'first' });
  }

  #onKeydown(event) {
    const item = this.#itemOf(event);
    if (item === undefined) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide('escape');
      return;
    }
    if (event.key === 'Tab') {
      // Focus goes back to the trigger first, so Tab moves on from there.
      this.#root().hide('tab');
      return;
    }
    if (!item && event.composedPath()[0] !== this.#panel) return;

    const rtl = isRtl(this.#panel);
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'Enter' || event.key === ' ') {
      if (!item) return;
      event.preventDefault();
      this.#activate(item, true);
      return;
    }
    if (event.key === forward) {
      if (!item?.submenu) return;
      event.preventDefault();
      this.#openSubmenu(item, true);
      return;
    }
    if (event.key === back) {
      if (!this.#isSubmenu) return;
      event.preventDefault();
      this.hide('escape');
      return;
    }

    const items = this.#enabled();
    const current = item ? items.indexOf(item) : -1;
    let next = nextIndex(event, items.length, current, { orientation: 'vertical' });
    if (next < 0) next = this.#typeahead(event, items, current);
    if (next < 0) return;
    event.preventDefault();
    this.#closeSubmenus(items[next]);
    items[next].focus({ preventScroll: false });
  }

  /**
   * Type-to-select. `createTypeahead` in core/a11y.js stops matching on a
   * repeated letter (its buffer becomes "cc"), so the menu keeps its own:
   * a run of one letter cycles through the items starting with it.
   * @param {KeyboardEvent} event
   * @param {PunicaMenuItem[]} items
   * @param {number} current
   */
  #typeahead(event, items, current) {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return -1;
    clearTimeout(this.#typedTimer);
    this.#typedTimer = setTimeout(() => (this.#typed = ''), 500);
    this.#typed += event.key.toLowerCase();
    const cycling = [...this.#typed].every((c) => c === this.#typed[0]);
    const query = cycling ? this.#typed[0] : this.#typed;
    const start = cycling ? current + 1 : Math.max(current, 0);
    for (let i = 0; i < items.length; i++) {
      const index = (start + i) % items.length;
      if (items[index].labelText.toLowerCase().startsWith(query)) return index;
    }
    return -1;
  }

  /**
   * @param {PunicaMenuItem} item
   * @param {boolean} keyboard
   */
  #activate(item, keyboard) {
    if (item.disabled) return;
    if (item.submenu) {
      this.#openSubmenu(item, keyboard);
      return;
    }
    item.activate();
    const value = item.value ?? item.labelText;
    const event = this.emit('select', { value, item }, { cancelable: true });
    if (!event.defaultPrevented) this.#root().hide('select');
  }

  /** @param {PunicaMenuItem} item */
  #hover(item) {
    if (deepActiveElement() !== item) item.focus({ preventScroll: true });
    clearTimeout(this.#hoverTimer);
    this.#hoverTimer = setTimeout(() => {
      if (!this.#shown) return;
      this.#closeSubmenus(item);
      this.#openSubmenu(item, false);
    }, 150);
  }

  /** @param {PunicaMenuItem} [except] */
  #closeSubmenus(except) {
    for (const item of this.items) {
      if (item !== except && item.submenu?.open) item.submenu.hide();
    }
  }

  /**
   * @param {PunicaMenuItem} item
   * @param {boolean} focus move focus to the submenu's first item
   */
  #openSubmenu(item, focus) {
    const sub = item.submenu;
    if (!(sub instanceof PunicaMenu)) return;
    clearTimeout(this.#hoverTimer);
    this.#closeSubmenus(item);
    sub.#parent = this;
    sub.#parentItem = item;
    if (sub.open && sub.#shown) {
      if (focus) sub.show({ focus: 'first' });
      return;
    }
    sub.show({ focus: focus ? 'first' : 'none' });
  }
}

define('punica-menu', PunicaMenu);
