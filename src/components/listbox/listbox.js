import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { nextIndex, setRovingTabindex, createTypeahead, isRtl } from '../../core/a11y.js';
import styles from './listbox.css';

/**
 * A list of options to choose one or several from, as a form control.
 *
 * The options are `punica-listbox-item` children. The `value` attribute, or
 * failing that the `selected` attributes of the items, give the default
 * selection a form reset goes back to; the `value` property is the current
 * selection.
 *
 * @element punica-listbox
 *
 * @attr {string} value - The default value; with `multiple`, a JSON array or a comma-separated list.
 * @attr {boolean} multiple - Several options may be selected.
 * @attr {string} name - Name the value is submitted under; with `multiple`, once per selected option.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} required - An option must be selected before the form submits.
 * @attr {string} label - Accessible name.
 * @attr {'horizontal' | 'vertical'} orientation - Direction the arrow keys follow, `vertical` by default.
 *
 * @prop {string | string[] | null} value - The current selection: a string, or an array when `multiple`.
 * @prop {string | null} defaultValue - The `value` attribute.
 *
 * @slot - The `punica-listbox-item` options.
 *
 * @fires punica-change - The user changed the selection. `detail.value` is the new value.
 *
 * @cssprop --punica-listbox-background - Background of the list.
 * @cssprop --punica-listbox-padding - Block padding of the list.
 * @cssprop --punica-listbox-radius - Corner radius.
 * @cssprop --punica-listbox-max-height - Block size beyond which the list scrolls.
 * @cssprop --punica-listbox-border-color - Colour of the border; `transparent` for none.
 *
 * @cssstate disabled - The control is disabled, by itself or by a fieldset.
 * @cssstate invalid - The control fails validation.
 * @cssstate valid - The control passes validation.
 */
export class PunicaListbox extends FormControl(PunicaElement) {
  static properties = {
    value: { type: Object, attribute: false },
    defaultValue: { attribute: 'value', reflect: false },
    multiple: { type: Boolean },
    label: {},
    orientation: { default: 'vertical' }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  #dirty = false;
  /** The value this element last wrote itself. */
  #written = null;
  #first = true;
  /** Default selection read from the items' `selected` attributes. */
  #itemDefault = [];
  /** @type {HTMLElement | null} */
  #anchor = null;
  #typeahead = createTypeahead();

  constructor() {
    super();
    this.internals.role = 'listbox';
    this.$('slot').addEventListener('slotchange', () => this.requestUpdate());
    this.addEventListener('click', (event) => {
      if (event.target === this) {
        // A click on a <label> lands here.
        this.focus();
        return;
      }
      const item = this.#itemOf(event);
      if (!item || this.isDisabled || item.hasAttribute('disabled')) return;
      this.#setActive(item);
      if (this.multiple && event.shiftKey && this.#anchor) {
        this.#selectRange(this.#anchor, item);
      } else {
        this.#anchor = item;
        if (this.multiple) this.#toggle(item);
        else this.#commit([this.#valueOf(item)]);
      }
    });
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('focusin', (event) => {
      const item = this.#itemOf(event);
      if (item) this.#setActive(item);
    });
  }

  /** The options, in order. */
  get items() {
    return /** @type {HTMLElement[]} */ ([...this.children].filter((el) => el.localName === 'punica-listbox-item'));
  }

  /** The selected options, in order. */
  get selectedItems() {
    const values = this.#values();
    return this.items.filter((item) => values.includes(this.#valueOf(item)));
  }

  /** Moves focus to the active option. */
  focus(options) {
    const enabled = this.#enabled();
    const target = enabled.find((item) => item.tabIndex === 0) || enabled[0];
    target?.focus(options);
  }

  connected() {
    this.#revealed = false;
    this.requestUpdate();
  }

  /** Whether the selection has been scrolled into view since connecting. */
  #revealed = false;

  /** Scrolls the list, and only it, to the first selected option, once. */
  #reveal() {
    if (this.#revealed || !this.isConnected) return;
    const item = this.selectedItems[0];
    if (!item) return;
    const box = this.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    if (!box.height || !rect.height) return;
    this.#revealed = true;
    if (rect.top < box.top) this.scrollTop -= box.top - rect.top;
    else if (rect.bottom > box.bottom) this.scrollTop += rect.bottom - box.bottom;
    if (rect.left < box.left) this.scrollLeft -= box.left - rect.left;
    else if (rect.right > box.right) this.scrollLeft += rect.right - box.right;
  }

  formReset() {
    this.#dirty = false;
    this.#write(this.#fromArray(this.defaultValue != null ? this.#parse(this.defaultValue) : this.#itemDefault));
    // The items carry the default again before the next read of them.
    const values = this.#values();
    for (const item of this.items) /** @type {any} */ (item).selected = values.includes(this.#valueOf(item));
    if (this.isConnected) this.update(new Map());
  }

  /** @param {string | File | FormData | null} state */
  formRestore(state) {
    let values = [];
    if (state instanceof FormData) values = [...state.values()].map(String);
    else if (typeof state === 'string') {
      try {
        values = [JSON.parse(state)].flat().map(String);
      } catch {
        values = [state];
      }
    }
    this.#dirty = true;
    this.#write(this.#fromArray(values));
    this.requestUpdate();
  }

  /* -------------------------------------------------------------- values */

  /** @param {Event} event */
  #itemOf(event) {
    const target = /** @type {Element} */ (event.target);
    const item = target.closest?.('punica-listbox-item');
    return item && item.parentElement === this ? /** @type {HTMLElement} */ (item) : null;
  }

  #valueOf(item) {
    return item.value ?? item.getAttribute('value') ?? item.textContent.trim();
  }

  #enabled() {
    return this.isDisabled ? [] : this.items.filter((item) => !item.hasAttribute('disabled'));
  }

  /** @param {string} text */
  #parse(text) {
    if (!this.multiple) return [text];
    const trimmed = text.trim();
    if (trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed).map(String);
      } catch {
        // Not JSON: read it as a list.
      }
    }
    return trimmed ? trimmed.split(',').map((part) => part.trim()) : [];
  }

  /** The current value as a list. */
  #values() {
    const value = this.value;
    if (value == null) return [];
    const list = [value].flat().map(String);
    return this.multiple ? list : list.slice(0, 1);
  }

  /** @param {string[]} list */
  #fromArray(list) {
    return this.multiple ? [...list] : (list[0] ?? null);
  }

  #write(value) {
    const next = value == null ? [] : [value].flat();
    const current = this.#values();
    const same = next.length === current.length && next.every((v, i) => v === current[i]);
    // An equal list is not written again: a new array would be a new change.
    if (same && (this.value != null || value == null)) return;
    this.#written = value;
    this.value = value;
  }

  /** @param {string[]} list values the user chose */
  #commit(list) {
    const order = this.items.map((item) => this.#valueOf(item));
    const next = [...new Set(list)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const current = this.#values();
    if (next.length === current.length && next.every((v, i) => v === current[i])) return;
    this.#dirty = true;
    this.#write(this.#fromArray(next));
    this.emit('change', { value: this.value });
  }

  #toggle(item) {
    const value = this.#valueOf(item);
    const current = this.#values();
    this.#commit(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  }

  #selectRange(from, to) {
    const enabled = this.#enabled();
    const a = enabled.indexOf(from);
    const b = enabled.indexOf(to);
    if (a < 0 || b < 0) return;
    const range = enabled.slice(Math.min(a, b), Math.max(a, b) + 1).map((item) => this.#valueOf(item));
    this.#commit([...this.#values(), ...range]);
  }

  #setActive(item) {
    const enabled = this.#enabled();
    if (enabled.includes(item)) setRovingTabindex(enabled, item);
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    const item = this.#itemOf(event);
    if (!item || event.target !== item || this.isDisabled) return;
    const enabled = this.#enabled();
    const current = enabled.indexOf(item);

    if (this.multiple && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      const all = enabled.map((el) => this.#valueOf(el));
      const selected = this.#values();
      this.#commit(all.every((v) => selected.includes(v)) ? selected.filter((v) => !all.includes(v)) : [...selected, ...all]);
      return;
    }

    let index = nextIndex(event, enabled.length, current, {
      orientation: this.orientation === 'horizontal' ? 'horizontal' : 'vertical',
      loop: false,
      rtl: isRtl(this)
    });
    const moved = index >= 0;
    if (!moved) {
      index = this.#typeahead(
        event,
        enabled.map((el) => el.textContent),
        current
      );
    }
    if (index >= 0) {
      event.preventDefault();
      const next = enabled[index];
      this.#setActive(next);
      next.focus();
      if (!this.multiple) this.#commit([this.#valueOf(next)]);
      else if (moved && event.shiftKey) this.#selectRange(this.#anchor || item, next);
      if (!event.shiftKey) this.#anchor = next;
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (item.hasAttribute('disabled')) return;
      this.#anchor = item;
      if (this.multiple) this.#toggle(item);
      else this.#commit([this.#valueOf(item)]);
    }
  }

  /* -------------------------------------------------------------- render */

  update(changed) {
    const items = this.items;
    if (changed.has('value') && this.value !== this.#written && (this.value != null || !this.#first)) {
      // The page assigned a value: it is no longer the default.
      this.#dirty = true;
    }
    this.#first = false;
    if (!this.#dirty) {
      // Untouched: the default selection is the value.
      if (this.defaultValue != null) {
        if (changed.has('defaultValue') || changed.has('multiple') || this.value == null) {
          this.#write(this.#fromArray(this.#parse(this.defaultValue)));
        }
      } else {
        const marked = items.filter((item) => item.hasAttribute('selected')).map((item) => this.#valueOf(item));
        this.#itemDefault = this.multiple ? marked : marked.slice(0, 1);
        this.#write(this.#fromArray(this.#itemDefault));
      }
    }

    const values = this.#values();
    for (const item of items) /** @type {any} */ (item).selected = values.includes(this.#valueOf(item));

    const internals = this.internals;
    internals.ariaMultiSelectable = this.multiple ? 'true' : null;
    internals.ariaLabel = this.label || null;
    internals.ariaOrientation = this.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    internals.ariaDisabled = this.isDisabled ? 'true' : null;
    internals.ariaRequired = this.required ? 'true' : null;
    this.toggleState('disabled', this.isDisabled);

    const enabled = this.#enabled();
    for (const item of items) if (!enabled.includes(item)) item.tabIndex = -1;
    const focused = enabled.find((item) => item.matches(':focus'));
    const active = focused || enabled.find((item) => item.tabIndex === 0 && item.hasAttribute('tabindex'));
    setRovingTabindex(enabled, active || enabled.find((item) => values.includes(this.#valueOf(item))) || null);

    if (!this.name || !values.length) {
      this.setFormValue(null, JSON.stringify(values));
    } else if (this.multiple) {
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.setFormValue(data, JSON.stringify(values));
    } else {
      this.setFormValue(values[0], JSON.stringify(values));
    }
    // The host takes no focus; the browser reports a failed check on the
    // option that is the tab stop.
    const anchor = enabled.find((item) => item.tabIndex === 0) || enabled[0];
    this.setValidity({ valueMissing: this.required && !values.length }, requiredMessage(), anchor);
    // Layout settles after the first update.
    if (!this.#revealed) requestAnimationFrame(() => this.#reveal());
  }
}

let message = '';
/** The browser's own, localized "pick one" sentence. */
function requiredMessage() {
  if (!message) {
    const probe = document.createElement('select');
    probe.required = true;
    message = probe.validationMessage || ' ';
  }
  return message;
}

define('punica-listbox', PunicaListbox);
