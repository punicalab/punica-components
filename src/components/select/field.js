/**
 * Helpers shared by select and the pickers: language, accessible name, the
 * floating panel and keyboard movement through a list of options.
 */
import { Overlay } from '../../core/overlay.js';
import { nextIndex } from '../../core/a11y.js';

/**
 * The BCP 47 tag an element formats with: its `locale`, else the nearest
 * `lang`, else the browser's.
 * @param {HTMLElement & { locale?: string | null }} el
 * @returns {string}
 */
export function fieldLanguage(el) {
  const fallback = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const wanted = el.locale || el.closest('[lang]')?.lang || fallback;
  try {
    return Intl.getCanonicalLocales(wanted)[0] || fallback;
  } catch {
    return fallback;
  }
}

/**
 * The accessible name of a field: its `label`, else its own `aria-label`, else
 * the text of the `<label>` elements pointing at it.
 * @param {HTMLElement & { label?: string | null, labels?: NodeList }} el
 * @returns {string | null}
 */
export function fieldName(el) {
  if (el.label) return el.label;
  // A name written on the element the usual way (`aria-label`).
  const own = el.getAttribute?.('aria-label');
  if (own) return own;
  const text = [...(el.labels || [])]
    .map((l) => l.textContent.trim())
    .filter(Boolean)
    .join(' ');
  return text || null;
}

/**
 * Sets an attribute, or removes it for null, undefined and false.
 * @param {Element} node
 * @param {string} name
 * @param {string | number | boolean | null | undefined} value
 */
export function setAttr(node, name, value) {
  if (value == null || value === false) node.removeAttribute(name);
  else node.setAttribute(name, value === true ? '' : String(value));
}

/**
 * A `popover="manual"` panel beside an anchor that reports a pointer press
 * outside its host. Everything it attaches is undone by `hide()`.
 */
export class FieldSurface {
  #host;
  #overlay;
  /** @type {AbortController | null} */
  #abort = null;

  /**
   * @param {HTMLElement} host the component; a press inside it is not outside
   * @param {HTMLElement} panel the popover element in the host's shadow root
   */
  constructor(host, panel) {
    this.#host = host;
    this.#overlay = new Overlay(panel);
  }

  get open() {
    return this.#abort !== null;
  }

  /**
   * @param {Element} anchor
   * @param {import('../../core/overlay.js').OverlayOptions} options
   * @param {() => void} onOutside
   */
  show(anchor, options, onOutside) {
    this.#overlay.show(anchor, options);
    if (this.#abort) return;
    this.#abort = new AbortController();
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.composedPath().includes(this.#host)) onOutside();
      },
      { capture: true, signal: this.#abort.signal }
    );
  }

  hide() {
    if (!this.#abort) return;
    this.#abort.abort();
    this.#abort = null;
    this.#overlay.hide();
  }

  reposition() {
    this.#overlay.reposition();
  }
}

/**
 * Keyboard movement through `punica-option` rows while focus stays on a
 * combobox: the active row is named to assistive technology through
 * `ariaActiveDescendantElement`, which reaches from a shadow root to the
 * host's own children.
 */
export class OptionNavigator {
  #combobox;
  #getOptions;
  /** @type {any} */
  #active = null;

  /**
   * @param {HTMLElement} combobox the element that keeps focus
   * @param {() => any[]} getOptions every option, in order
   */
  constructor(combobox, getOptions) {
    this.#combobox = combobox;
    this.#getOptions = getOptions;
  }

  /** Options a key can land on. */
  get items() {
    return this.#getOptions().filter((o) => !o.hidden && !o.disabled);
  }

  get active() {
    return this.#active && this.#active.isConnected && !this.#active.hidden
      ? this.#active
      : null;
  }

  /** @param {any} option the row to highlight, or null for none */
  set(option) {
    if (this.#active && this.#active !== option) this.#active.active = false;
    this.#active = option || null;
    if ('ariaActiveDescendantElement' in this.#combobox) {
      /** @type {any} */ (this.#combobox).ariaActiveDescendantElement =
        this.#active;
    }
    if (!this.#active) {
      this.#combobox.removeAttribute('aria-activedescendant');
      return;
    }
    this.#active.active = true;
    this.#active.scrollIntoView?.({ block: 'nearest' });
  }

  /**
   * Moves for ArrowDown, ArrowUp, Home, End, PageDown and PageUp.
   * @param {KeyboardEvent} event
   * @param {{ homeEnd?: boolean }} [options] an editable combobox keeps Home and End for its text
   * @returns {boolean} whether the key was one of them
   */
  move(event, { homeEnd = true } = {}) {
    const items = this.items;
    const current = items.indexOf(this.active);
    let index = -1;
    if (event.key === 'PageDown')
      index = Math.min(items.length - 1, Math.max(current, 0) + 10);
    else if (event.key === 'PageUp') index = Math.max(0, current - 10);
    else if (!homeEnd && (event.key === 'Home' || event.key === 'End'))
      return false;
    else
      index = nextIndex(event, items.length, current, {
        orientation: 'vertical',
        loop: false
      });
    if (index < 0)
      return (
        ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key) ||
        (homeEnd && ['Home', 'End'].includes(event.key))
      );
    this.set(items[index]);
    return true;
  }
}

/**
 * The browser's own, localised validation message for a failed constraint,
 * read from a native input that is never put in the document.
 * @param {'required' | 'choose' | 'format' | 'min' | 'max'} kind - `choose` is a required native select's message
 * @param {{ type?: 'date' | 'time' | 'datetime-local', value?: string, limit?: string }} [options]
 * @returns {string}
 */
export function nativeMessage(
  kind,
  { type = 'date', value = '', limit = '' } = {}
) {
  if (kind === 'choose') {
    // A required native select with nothing chosen: "Please select an item in the list."
    const select = document.createElement('select');
    select.required = true;
    select.append(document.createElement('option'));
    return select.validationMessage || ' ';
  }
  const probe = document.createElement('input');
  if (kind === 'required') {
    probe.required = true;
  } else if (kind === 'format') {
    probe.pattern = '0';
    probe.value = '1';
  } else {
    probe.type = type;
    probe[kind] = limit;
    probe.value = value;
  }
  return probe.validationMessage || ' ';
}
