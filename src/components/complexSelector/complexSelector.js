import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, OptionNavigator, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import '../select/option.js';
import './complexOption.js';
import './optionGroup.js';
import fieldStyles from '../select/field.css';
import styles from './complexSelector.css';

const ROW = new Set(['punica-option', 'punica-complex-option']);

/** @param {any} option an option that may not be upgraded yet */
const valueOf = (option) => option.optionValue ?? option.getAttribute('value') ?? option.textContent.trim();
/** @param {any} option */
const textOf = (option) => option.text ?? option.getAttribute('label') ?? option.textContent.trim();

/**
 * A select for rich choices: a trigger like `punica-select` opens a panel
 * with a search field and a list of rows in named groups. A row can carry
 * an icon or an avatar and a description (`punica-complex-option`), or be a
 * plain `punica-option`; rows go straight in the selector or in
 * `punica-option-group`s.
 *
 * The search field is a combobox that keeps focus while the arrow keys move
 * through the list. With `multiple` each pick toggles a row, the trigger
 * shows the picks as chips, and each group starts with a row that selects
 * every row of the group the search leaves showing.
 *
 * The `value` attribute is the default value; with `multiple` it is a
 * space-separated list. A row carrying `selected` in the markup is part of
 * the default too.
 *
 * @element punica-complex-selector
 *
 * @attr {string} value - Default value; space-separated with `multiple`.
 * @attr {boolean} multiple - Several rows can be picked; `value` is then an array.
 * @attr {string} placeholder - Text shown while nothing is picked.
 * @attr {boolean} clearable - Shows a button that empties the value.
 * @attr {string} label - Accessible name of the trigger, the panel and the list.
 * @attr {boolean} open - The panel is showing.
 * @attr {string} name - Name the value is submitted under; one entry per value.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} required - A value is needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Height of the trigger, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-search - Name and placeholder of the search field, `Search` by default.
 * @attr {string} label-no-results - Shown when the search matches no row, `No results` by default.
 * @attr {string} label-select-all - Text of a group's select-all row, `Select all` by default; with the group's label before it, the row's name.
 * @attr {string} label-clear - Name of the clear button, `Clear` by default.
 *
 * @prop {string | string[] | null} value - The current value: a string, or an array with `multiple`.
 * @prop {any[]} options - Every row, grouped or not, in order.
 *
 * @slot - `punica-option-group`, `punica-complex-option` and `punica-option` elements.
 * @slot start - Content before the value in the trigger, an icon.
 *
 * @fires punica-change - The user picked, unpicked or cleared. `detail.value` is the new value.
 * @fires punica-open - The panel opened.
 * @fires punica-close - The panel closed. `detail.reason` is `select`, `escape`, `outside`, `blur` or `api`.
 *
 * @csspart field - The bordered box of the trigger.
 * @csspart trigger - The button that opens the panel, a combobox.
 * @csspart value - The text of the picked row, the chips, or the placeholder.
 * @csspart chip - One picked row, with `multiple`.
 * @csspart clear - The clear button.
 * @csspart caret - The chevron.
 * @csspart panel - The floating panel, a dialog.
 * @csspart search - The search field.
 * @csspart listbox - The list of rows.
 * @csspart group-header - A group's heading row; with `multiple` it selects the group.
 * @csspart empty - The text shown when nothing matches.
 *
 * @cssprop --punica-complex-selector-radius - Corner radius of the trigger.
 * @cssprop --punica-complex-selector-height - Minimum block size of the trigger.
 * @cssprop --punica-complex-selector-padding - Inline padding of the trigger.
 * @cssprop --punica-complex-selector-border-color - Border colour at rest.
 * @cssprop --punica-complex-selector-background - Trigger background.
 * @cssprop --punica-complex-selector-min-width - Smallest inline size.
 * @cssprop --punica-complex-selector-panel-width - Smallest inline size of the panel.
 * @cssprop --punica-complex-selector-listbox-max-height - Largest block size of the list.
 * @cssprop --punica-complex-selector-chip-background - Background of a chip.
 *
 * @cssstate open - The panel is showing.
 * @cssstate placeholder - Nothing is picked.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaComplexSelector extends FormControl(PunicaElement) {
  static properties = {
    defaultValue: { attribute: 'value', reflect: false },
    value: { type: Object, attribute: false },
    multiple: { type: Boolean },
    placeholder: {},
    clearable: { type: Boolean },
    label: {},
    open: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelSearch: { default: 'Search' },
    labelNoResults: { default: 'No results' },
    labelSelectAll: { default: 'Select all' },
    labelClear: { default: 'Clear' }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true, slotAssignment: 'manual' };
  static template = `
    <div part="field" class="field">
      <slot name="start"></slot>
      <button part="trigger" class="control" type="button" role="combobox" aria-haspopup="dialog" aria-controls="panel" aria-expanded="false">
        <span part="value" class="value"></span>
        <span part="caret" class="caret">${icons.chevronDown}</span>
      </button>
      <button part="clear" class="icon-button clear" type="button" hidden>${icons.close}</button>
    </div>
    <div part="panel" id="panel" class="panel" role="dialog" popover="manual">
      <div class="search">
        ${icons.search}
        <input part="search" type="text" role="combobox" aria-autocomplete="list" aria-controls="listbox" aria-expanded="true" autocomplete="off" autocapitalize="off" spellcheck="false">
      </div>
      <div part="listbox" id="listbox" class="listbox" role="listbox"></div>
      <div part="empty" class="empty" hidden></div>
    </div>
    <template id="chip"><span part="chip" class="chip"></span></template>
  `;

  #field = this.$('.field');
  #trigger = this.$('[part="trigger"]');
  #valueEl = this.$('[part="value"]');
  #clear = this.$('[part="clear"]');
  #panel = this.$('#panel');
  #search = this.$('[part="search"]');
  #listbox = this.$('#listbox');
  #empty = this.$('[part="empty"]');
  #startSlot = this.$('slot[name="start"]');
  #surface = new FieldSurface(this, this.#panel);
  #nav = new OptionNavigator(this.#search, () => this.#navigable());
  /** Header row in the shadow root for each group. @type {Map<Element, HTMLElement>} */
  #headers = new Map();
  /** @type {MutationObserver | null} */
  #observer = null;
  /** Rows that carried `selected` when first seen: the markup's default. */
  #defaults = new WeakSet();
  #seen = new WeakSet();
  #dirty = false;
  #touched = false;
  #initialised = false;
  /** The value this element last applied as its default, serialised. @type {string | null} */
  #auto = null;
  #reason = 'api';
  /** What the chips were last drawn from. */
  #drawn = '';

  constructor() {
    super();
    this.#trigger.addEventListener('click', () => {
      if (this.isDisabled) return;
      if (this.open) this.#close('api');
      else this.show();
    });
    this.#trigger.addEventListener('keydown', (event) => this.#onTriggerKeydown(event));
    this.#clear.addEventListener('click', () => {
      if (this.isDisabled) return;
      this.#commit([]);
      this.#trigger.focus();
    });
    this.#search.addEventListener('input', () => {
      this.#nav.set(null);
      this.update(new Map());
      this.#nav.set(this.#nav.items[0] || null);
      this.#markHeaders();
    });
    this.#search.addEventListener('keydown', (event) => this.#onSearchKeydown(event));
    // A press on a row must not take focus from the search field.
    this.#listbox.addEventListener('mousedown', (event) => event.preventDefault());
    this.#listbox.addEventListener('click', (event) => {
      const row = this.#rowFrom(event);
      if (row && !row.disabled) this.#activate(row);
    });
    this.#listbox.addEventListener('pointermove', (event) => {
      const row = this.#rowFrom(event);
      if (row && !row.disabled && row !== this.#nav.active) {
        this.#nav.set(row);
        this.#markHeaders();
      }
    });
    this.shadowRoot.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (next instanceof Node && (this.shadowRoot.contains(next) || this.contains(next))) return;
      this.#touched = true;
      if (this.open) this.#close('blur');
      else this.requestUpdate();
    });
  }

  /** Every row, grouped or not, in order. @returns {any[]} */
  get options() {
    const out = [];
    for (const child of this.children) {
      if (ROW.has(child.localName)) out.push(child);
      else if (child.localName === 'punica-option-group') out.push(...[...child.children].filter((c) => ROW.has(c.localName)));
    }
    return out;
  }

  /** The picked rows. @returns {any[]} */
  get selectedOptions() {
    const values = this.#values();
    return this.options.filter((option) => values.includes(valueOf(option)));
  }

  /** Opens the panel. */
  show() {
    this.open = true;
  }

  /** Closes the panel. */
  hide() {
    this.#close('api');
  }

  /** Moves focus to the trigger. */
  focus(options) {
    this.#trigger.focus(options);
  }

  connected() {
    this.#observer = new MutationObserver(() => this.#layout());
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['slot', 'label'] });
    // Children inserted with the element are upgraded after it.
    queueMicrotask(() => this.isConnected && this.#layout());
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#surface.hide();
    this.#nav.set(null);
  }

  formReset() {
    this.#dirty = false;
    this.#touched = false;
    this.value = this.#defaultValue();
    this.#auto = JSON.stringify(this.#values());
  }

  formRestore(state) {
    if (state instanceof FormData) this.value = this.multiple ? state.getAll(this.name) : state.get(this.name);
    else if (typeof state === 'string') this.value = state;
  }

  /* ------------------------------------------------------------ layout */

  /** Assigns the light children to slots: groups each behind a header row of the shadow root. */
  #layout() {
    const start = [];
    const parts = [];
    let loose = null;
    const headers = new Map();
    for (const child of this.children) {
      if (child.getAttribute('slot') === 'start') {
        start.push(child);
        continue;
      }
      if (child.localName === 'punica-option-group') {
        loose = null;
        const header = this.#headers.get(child) || this.#makeHeader();
        headers.set(child, header);
        const slot = document.createElement('slot');
        slot.assign(child);
        parts.push(header, slot);
      } else if (ROW.has(child.localName)) {
        if (!loose) {
          loose = { slot: document.createElement('slot'), nodes: [] };
          parts.push(loose.slot);
        }
        loose.nodes.push(child);
        loose.slot.assign(...loose.nodes);
      }
    }
    this.#startSlot.assign(...start);
    this.#headers = headers;
    const active = this.#nav.active;
    this.#listbox.replaceChildren(...parts);
    if (active?.isConnected && this.#navigable().includes(active)) this.#nav.set(active);
    this.#sync();
  }

  #makeHeader() {
    const header = document.createElement('div');
    header.className = 'group-header';
    header.setAttribute('part', 'group-header');
    const text = document.createElement('span');
    text.className = 'group-label';
    const all = document.createElement('span');
    all.className = 'select-all';
    header.append(text, all);
    return header;
  }

  /** Rows the keyboard can land on: each group's select-all row with `multiple`, then its rows. */
  #navigable() {
    const out = [];
    for (const child of this.children) {
      if (ROW.has(child.localName) && child.getAttribute('slot') !== 'start') out.push(child);
      else if (child.localName === 'punica-option-group') {
        const header = this.#headers.get(child);
        if (header && this.multiple) out.push(header);
        out.push(...[...child.children].filter((c) => ROW.has(c.localName)));
      }
    }
    return out;
  }

  #markHeaders() {
    const active = this.#nav.active;
    for (const header of this.#headers.values()) header.classList.toggle('active', header === active);
  }

  #rowFrom(event) {
    const rows = this.#navigable();
    return event.composedPath().find((node) => rows.includes(node)) || null;
  }

  /* ------------------------------------------------------------- value */

  /** @returns {string[]} */
  #values() {
    const value = this.value;
    if (Array.isArray(value)) return value.map(String);
    return value == null || value === '' ? [] : [String(value)];
  }

  #defaultValue() {
    let values = [];
    if (this.defaultValue != null) {
      values = this.multiple ? this.defaultValue.split(/\s+/).filter(Boolean) : [this.defaultValue];
    } else {
      values = this.options.filter((o) => this.#defaults.has(o)).map(valueOf);
    }
    if (this.multiple) return values;
    return values.length ? values[0] : null;
  }

  #sync() {
    this.#applyDefault();
    if (this.isConnected) this.update(new Map());
  }

  #applyDefault() {
    for (const option of this.options) {
      if (this.#seen.has(option)) continue;
      this.#seen.add(option);
      if (option.hasAttribute('selected')) this.#defaults.add(option);
    }
    this.#initialised = true;
    if (this.#dirty) return;
    const current = JSON.stringify(this.#values());
    if (current !== (this.#auto ?? '[]')) {
      this.#dirty = true;
      return;
    }
    this.value = this.#defaultValue();
    this.#auto = JSON.stringify(this.#values());
  }

  update(changed) {
    if (!this.#initialised || changed.has('defaultValue') || changed.has('multiple')) this.#applyDefault();
    // Each opening starts with an empty search.
    if (this.open && !this.#surface.open) this.#search.value = '';
    const language = fieldLanguage(this);
    const options = this.options;
    const values = this.#values();
    const disabled = this.isDisabled;
    const name = fieldName(this);

    const known = new Map(options.map((option) => [valueOf(option), option]));
    for (const option of options) option.selected = values.includes(valueOf(option));
    const texts = values.map((value) => (known.has(value) ? textOf(known.get(value)) : value));
    const empty = texts.length === 0;
    this.#drawValue(texts, empty);
    this.toggleState('placeholder', empty);
    this.toggleState('disabled', disabled);

    const trigger = this.#trigger;
    trigger.disabled = disabled;
    setAttr(trigger, 'aria-label', name);
    setAttr(trigger, 'aria-required', this.required ? 'true' : null);
    setAttr(this.#panel, 'aria-label', name);
    setAttr(this.#listbox, 'aria-label', name);
    setAttr(this.#listbox, 'aria-multiselectable', this.multiple ? 'true' : null);
    setAttr(this.#search, 'aria-label', this.labelSearch);
    setAttr(this.#search, 'placeholder', this.labelSearch);
    setAttr(this.#clear, 'aria-label', this.labelClear);
    this.#clear.hidden = !this.clearable || empty || disabled;

    // The search hides the rows it does not match, and groups left empty.
    const needle = this.#search.value.trim().toLocaleLowerCase(language);
    const matches = (row) => {
      if (!needle) return true;
      const hay = `${textOf(row)} ${row.descriptionText ?? ''}`.toLocaleLowerCase(language);
      return hay.includes(needle);
    };
    let visible = 0;
    for (const child of this.children) {
      if (ROW.has(child.localName) && child.getAttribute('slot') !== 'start') {
        child.hidden = !matches(child);
        if (!child.hidden) visible++;
      } else if (child.localName === 'punica-option-group') {
        const rows = [...child.children].filter((c) => ROW.has(c.localName));
        let shown = 0;
        for (const row of rows) {
          row.hidden = !matches(row);
          if (!row.hidden) shown++;
        }
        visible += shown;
        child.hidden = shown === 0;
        const header = this.#headers.get(child);
        if (header) this.#drawHeader(header, child, rows, values);
      }
    }
    this.#empty.textContent = this.labelNoResults;
    this.#empty.hidden = visible > 0;

    // Form value: one entry per picked value.
    if (this.multiple && this.name) {
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.setFormValue(data);
    } else {
      this.setFormValue(empty ? null : values[0]);
    }
    const missing = this.required && empty;
    this.setValidity(missing ? { valueMissing: true } : {}, nativeMessage('choose'), trigger);
    setAttr(trigger, 'aria-invalid', this.#touched && missing ? 'true' : null);
    this.toggleState('user-invalid', this.#touched && !this.validity.valid);

    const want = this.open && !disabled;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, { matchWidth: true }, () => this.#close('outside'));
      this.toggleState('open', true);
      trigger.setAttribute('aria-expanded', 'true');
      this.#search.focus({ preventScroll: true });
      const first = options.find((o) => o.selected && !o.disabled && !o.hidden) || this.#nav.items[0] || null;
      this.#nav.set(first);
      this.#markHeaders();
      this.emit('open');
    } else if (!want && this.#surface.open) {
      const inside = this.shadowRoot.activeElement === this.#search;
      this.#surface.hide();
      this.#nav.set(null);
      this.#markHeaders();
      this.toggleState('open', false);
      trigger.setAttribute('aria-expanded', 'false');
      const reason = this.#reason;
      this.#reason = 'api';
      if (inside && reason !== 'outside' && reason !== 'blur') trigger.focus({ preventScroll: true });
      this.emit('close', { reason });
    }
    if (this.#nav.active?.hidden) {
      this.#nav.set(null);
      this.#markHeaders();
    }
  }

  /** The trigger's text, or a chip per value with `multiple`. */
  #drawValue(texts, empty) {
    const key = JSON.stringify([this.multiple, texts, this.placeholder]);
    if (key === this.#drawn) return;
    this.#drawn = key;
    const el = this.#valueEl;
    el.classList.toggle('placeholder', empty);
    el.classList.toggle('chips', this.multiple && !empty);
    if (empty) {
      el.textContent = this.placeholder || '';
    } else if (this.multiple) {
      const template = /** @type {HTMLTemplateElement} */ (this.$('#chip'));
      el.replaceChildren(
        ...texts.map((text) => {
          const chip = /** @type {HTMLElement} */ (template.content.firstElementChild.cloneNode(true));
          chip.textContent = text;
          return chip;
        })
      );
    } else {
      el.textContent = texts[0];
    }
  }

  /**
   * @param {HTMLElement} header
   * @param {any} group
   * @param {any[]} rows
   * @param {string[]} values
   */
  #drawHeader(header, group, rows, values) {
    const label = group.label || group.getAttribute('label') || '';
    header.hidden = group.hidden;
    header.querySelector('.group-label').textContent = label;
    const all = header.querySelector('.select-all');
    all.textContent = this.multiple ? this.labelSelectAll : '';
    header.classList.toggle('selectable', this.multiple);
    if (this.multiple) {
      const pickable = rows.filter((r) => !r.hidden && !r.disabled);
      const every = pickable.length > 0 && pickable.every((r) => values.includes(valueOf(r)));
      header.setAttribute('role', 'option');
      header.setAttribute('aria-selected', String(every));
      header.removeAttribute('aria-hidden');
      header.classList.toggle('selected', every);
    } else {
      // The group is named by its own label; the heading is only drawn.
      header.removeAttribute('role');
      header.removeAttribute('aria-selected');
      header.setAttribute('aria-hidden', 'true');
      header.classList.remove('selected');
    }
  }

  /* ----------------------------------------------------------- actions */

  /** @param {string} reason */
  #close(reason) {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  /** @param {string[]} values */
  #commit(values) {
    const before = this.#values();
    if (before.length === values.length && before.every((v, i) => v === values[i])) return;
    this.#dirty = true;
    this.#touched = true;
    this.value = this.multiple ? values : values[0] ?? null;
    this.update(new Map());
    this.emit('change', { value: this.value });
  }

  /** Keeps the list's own order, whatever order the user picked in. */
  #ordered(values) {
    const order = this.options.map(valueOf);
    return [...new Set(values)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }

  /** A row or a select-all row was picked. */
  #activate(row) {
    if (this.#headers.size && [...this.#headers.values()].includes(row)) {
      const group = [...this.#headers].find(([, h]) => h === row)?.[0];
      const pickable = [...(group?.children || [])].filter((r) => ROW.has(r.localName) && !r.hidden && !r.disabled).map(valueOf);
      const values = this.#values();
      const every = pickable.every((v) => values.includes(v));
      this.#commit(this.#ordered(every ? values.filter((v) => !pickable.includes(v)) : [...values, ...pickable]));
      this.#nav.set(row);
      this.#markHeaders();
      return;
    }
    const value = valueOf(row);
    if (this.multiple) {
      const values = this.#values();
      this.#commit(this.#ordered(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]));
      this.#nav.set(row);
      this.#markHeaders();
    } else {
      this.#commit([value]);
      this.#close('select');
    }
  }

  /** @param {KeyboardEvent} event */
  #onTriggerKeydown(event) {
    if (this.isDisabled || this.open) return;
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      this.show();
    }
  }

  /** @param {KeyboardEvent} event */
  #onSearchKeydown(event) {
    const nav = this.#nav;
    const key = event.key;
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.#close('escape');
    } else if (key === 'Tab') {
      this.#close('blur');
    } else if (key === 'Enter') {
      // Enter never submits the form from inside the panel.
      event.preventDefault();
      if (nav.active) this.#activate(nav.active);
    } else if (key === 'ArrowUp' && event.altKey) {
      event.preventDefault();
      this.#close('escape');
    } else if (nav.move(event, { homeEnd: false })) {
      event.preventDefault();
      this.#markHeaders();
    }
  }
}

define('punica-complex-selector', PunicaComplexSelector);
