import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { nextIndex } from '../../core/a11y.js';
import { ModalSurface } from '../dialog/modalSurface.js';
import styles from './commandPalette.css';

/**
 * A dialog for finding and running a command by typing.
 *
 * It is a native `<dialog>` holding a combobox over a listbox. Its children
 * are `punica-command-item`, alone or inside `punica-command-group`. Typing
 * keeps the items whose text or `keywords` contain every word typed; arrow
 * keys, Home and End move the active item while focus stays in the input;
 * Enter chooses it. The application opens the palette, from a button or its
 * own shortcut.
 *
 * @element punica-command-palette
 *
 * @attr {string} label - Accessible name of the dialog, the input and the list.
 * @attr {boolean} open - The palette is showing.
 * @attr {string} placeholder - Placeholder of the input.
 * @attr {boolean} no-light-dismiss - A click on the backdrop does not close it.
 *
 * @prop {string} query - The text in the input.
 * @prop {string} returnValue - The value given to `hide()` or `requestClose()` when it last closed (read-only).
 *
 * @slot - `punica-command-item` and `punica-command-group` elements.
 * @slot empty - Shown when nothing matches.
 *
 * @fires punica-open - The palette opened.
 * @fires {{ value: string }} punica-input - The query changed. `detail` is `{ value }`.
 * @fires {{ value: string, item: HTMLElement }} punica-select - A command was chosen. `detail` is `{ value, item }`; `value` is the item's `value`, or its text. Cancelable: preventing it keeps the palette open.
 * @fires {{ reason: 'select' | 'escape' | 'backdrop' | 'api' | (string & {}) }} punica-request-close - The user asked to close it. `detail` is `{ reason }`. Cancelable: preventing it keeps the palette open.
 * @fires {{ reason: 'select' | 'escape' | 'backdrop' | 'api' | (string & {}), returnValue: string }} punica-close - The palette closed. `detail` is `{ reason, returnValue }`; `reason` is `select`, `escape`, `backdrop` or `api`.
 *
 * @csspart dialog - The native dialog.
 * @csspart search - The row holding the input.
 * @csspart input - The input.
 * @csspart list - The listbox.
 * @csspart empty - The wrapper around the `empty` slot.
 *
 * @cssprop --punica-command-palette-radius - Corner radius.
 * @cssprop --punica-command-palette-background - Background.
 * @cssprop --punica-command-palette-backdrop - Colour of the backdrop.
 * @cssprop --punica-command-palette-shadow - Shadow.
 * @cssprop --punica-command-palette-width - Inline size.
 * @cssprop --punica-command-palette-max-height - Largest block size.
 */
export class PunicaCommandPalette extends ModalSurface(PunicaElement) {
  static properties = {
    placeholder: {}
  };

  static styles = styles;
  static template = `
    <dialog part="dialog">
      <div part="search" class="search">
        ${icons.search}
        <input part="input" type="text" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="list" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
      </div>
      <div part="list" id="list" role="listbox"><slot></slot></div>
      <div part="empty" class="empty" role="status" hidden><slot name="empty"></slot></div>
    </dialog>
  `;

  #input = this.$('input');
  #list = this.$('#list');
  /** @type {any} */
  #active = null;

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('input', () => {
      this.#filter();
      this.emit('input', { value: input.value });
    });
    input.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.$('slot:not([name])').addEventListener('slotchange', () => this.#filter());
    this.#list.addEventListener('click', (event) => {
      const item = this.#itemOf(event);
      if (item) this.#choose(item);
    });
    this.#list.addEventListener('pointermove', (event) => {
      const item = this.#itemOf(event);
      if (item && item !== this.#active) this.#setActive(item, false);
    });
    // A press on the list must not take focus from the input.
    this.#list.addEventListener('mousedown', (event) => event.preventDefault());
  }

  /** The text in the input. */
  get query() {
    return this.#input.value;
  }

  set query(value) {
    this.#input.value = value ?? '';
    this.#filter();
  }

  /** Every command item, in order. @returns {any[]} */
  get items() {
    return [...this.querySelectorAll('punica-command-item')];
  }

  /** The item Enter would choose. */
  get activeItem() {
    return this.#active;
  }

  surfaceOpened() {
    this.#input.value = '';
    this.#filter();
    this.#input.focus({ preventScroll: true });
  }

  update(changed) {
    super.update(changed);
    const input = this.#input;
    const name = this.label || this.placeholder;
    if (this.placeholder) input.setAttribute('placeholder', this.placeholder);
    else input.removeAttribute('placeholder');
    for (const el of [input, this.#list]) {
      if (name) el.setAttribute('aria-label', name);
      else el.removeAttribute('aria-label');
    }
  }

  #visible() {
    return this.items.filter((item) => !item.filteredOut && !item.disabled);
  }

  #itemOf(event) {
    const item = event.composedPath().find((node) => node instanceof Element && node.localName === 'punica-command-item');
    return item && !item.disabled && this.contains(item) ? item : null;
  }

  #filter() {
    const words = this.#input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const item of this.items) {
      const text = `${item.textContent} ${item.getAttribute('keywords') ?? ''}`.toLowerCase();
      const out = !words.every((word) => text.includes(word));
      item.filteredOut = out;
      if (!out) shown++;
    }
    for (const group of /** @type {any[]} */ ([...this.querySelectorAll('punica-command-group')])) {
      group.filteredOut = ![...group.querySelectorAll('punica-command-item')].some((item) => !item.filteredOut);
    }
    this.$('.empty').hidden = shown > 0;
    this.#list.hidden = shown === 0;
    this.#setActive(this.#visible()[0] || null, true);
  }

  /**
   * @param {any} item
   * @param {boolean} scroll
   */
  #setActive(item, scroll) {
    if (this.#active && this.#active !== item) this.#active.active = false;
    this.#active = item;
    const input = this.#input;
    if (item) {
      item.active = true;
      if (scroll) item.scrollIntoView?.({ block: 'nearest' });
    }
    // The input points at the active option across the shadow boundary.
    if ('ariaActiveDescendantElement' in input) input.ariaActiveDescendantElement = item;
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (event.key === 'Enter') {
      if (event.isComposing) return;
      event.preventDefault();
      if (this.#active) this.#choose(this.#active);
      return;
    }
    const items = this.#visible();
    const next = nextIndex(event, items.length, items.indexOf(this.#active), { orientation: 'vertical' });
    if (next < 0) return;
    event.preventDefault();
    this.#setActive(items[next], true);
  }

  /** @param {any} item */
  #choose(item) {
    const value = item.value ?? item.textContent.trim();
    const event = this.emit('select', { value, item }, { cancelable: true });
    if (!event.defaultPrevented) this.closeWith('select', value);
  }
}

define('punica-command-palette', PunicaCommandPalette);
