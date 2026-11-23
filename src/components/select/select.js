import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { createTypeahead } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import {
  FieldSurface,
  OptionNavigator,
  fieldLanguage,
  fieldName,
  setAttr,
  nativeMessage
} from './field.js';
import './option.js';
import fieldStyles from './field.css';
import styles from './select.css';

/** @param {any} option an option that may not be upgraded yet */
const valueOf = (option) =>
  option.optionValue ??
  option.getAttribute('value') ??
  option.textContent.trim();
/** @param {any} option */
const textOf = (option) =>
  option.text ?? option.getAttribute('label') ?? option.textContent.trim();

/**
 * A select: one value, or several with `multiple`, picked from a list of
 * `punica-option` children.
 *
 * The `value` attribute is the default value; with `multiple` it is a
 * space-separated list. An option carrying `selected` in the markup is part
 * of the default too.
 *
 * @element punica-select
 *
 * @attr {string} value - Default value; space-separated with `multiple`.
 * @attr {boolean} multiple - Several options can be picked; `value` is then an array.
 * @attr {string} placeholder - Text shown while nothing is picked. Without one, a single select with no default takes its first enabled option, as a native select does.
 * @attr {boolean} clearable - Shows a button that empties the value.
 * @attr {string} label - Accessible name. An `aria-label` on the element names it too; `label` wins.
 * @attr {boolean} open - The list is showing.
 * @attr {string} name - Name the value is submitted under; one entry per value.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} required - A value is needed before the form submits.
 * @attr {string} description - Read by assistive technology after the control's name; a `punica-field` around it sets it to its help and its error.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-clear - Name of the clear button, `Clear` by default.
 *
 * @prop {string | string[] | null} value - The current value: a string, or an array with `multiple`.
 *
 * @slot - The `punica-option` rows.
 * @slot start - Content before the value, an icon.
 *
 * @fires punica-change - The user picked or cleared. `detail.value` is the new value.
 * @fires punica-open - The list opened.
 * @fires punica-close - The list closed. `detail.reason` is `select`, `escape`, `outside`, `blur` or `api`.
 *
 * @csspart field - The bordered box.
 * @csspart trigger - The combobox button.
 * @csspart value - The text of the picked options, or the placeholder.
 * @csspart clear - The clear button.
 * @csspart caret - The chevron.
 * @csspart listbox - The floating list.
 *
 * @cssprop --punica-select-radius - Corner radius of the field.
 * @cssprop --punica-select-height - Minimum block size of the field.
 * @cssprop --punica-select-padding - Inline padding of the field.
 * @cssprop --punica-select-border-color - Border colour at rest.
 * @cssprop --punica-select-background - Field background.
 * @cssprop --punica-select-min-width - Smallest inline size.
 * @cssprop --punica-select-listbox-max-height - Largest block size of the list.
 *
 * @cssstate open - The list is showing.
 * @cssstate placeholder - Nothing is picked.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaSelect extends FormControl(PunicaElement) {
  static properties = {
    // A name written on the element the usual way names the control too; `label` wins.
    ariaLabel: { attribute: 'aria-label', reflect: false },
    defaultValue: { attribute: 'value', reflect: false },
    value: { type: Object, attribute: false },
    multiple: { type: Boolean },
    placeholder: {},
    clearable: { type: Boolean },
    label: {},
    /** Read after the name by assistive technology; a punica-field around the control sets it. */
    description: {},
    open: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelClear: { default: 'Clear' }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="field" class="field">
      <slot name="start"></slot>
      <button part="trigger" class="control" type="button" role="combobox" aria-haspopup="listbox" aria-controls="listbox" aria-expanded="false">
        <span part="value" class="value"></span>
        <span part="caret" class="caret">${icons.chevronDown}</span>
      </button>
      <button part="clear" class="icon-button clear" type="button" hidden>${icons.close}</button>
    </div>
    <div part="listbox" id="listbox" class="panel listbox" role="listbox" popover="manual"><slot></slot></div>
  `;

  #field = this.$('.field');
  #trigger = this.$('[part="trigger"]');
  #valueEl = this.$('[part="value"]');
  #clear = this.$('[part="clear"]');
  #listbox = this.$('#listbox');
  #slot = this.$('slot:not([name])');
  #surface = new FieldSurface(this, this.#listbox);
  #nav = new OptionNavigator(this.#trigger, () => this.options);
  #typeahead = createTypeahead();
  /** Options that carried `selected` when first seen: the markup's default. */
  #defaults = new WeakSet();
  #seen = new WeakSet();
  #dirty = false;
  #touched = false;
  #initialised = false;
  /** The default this element last applied itself, serialised. @type {string | null} */
  #auto = null;
  #reason = 'api';

  constructor() {
    super();
    this.#trigger.addEventListener('click', () => {
      if (this.isDisabled) return;
      if (this.open) this.#close('api');
      else this.show();
    });
    this.#trigger.addEventListener('keydown', (event) =>
      this.#onKeydown(event)
    );
    // Reported invalid (a submit, checkValidity(), reportValidity()): touched, as the text controls are.
    this.addEventListener('invalid', () => {
      this.#touched = true;
      this.requestUpdate();
    });
    this.#trigger.addEventListener('keyup', (event) => {
      if (event.key === ' ') event.preventDefault();
    });
    this.#clear.addEventListener('click', () => {
      if (this.isDisabled) return;
      this.#commit([]);
      this.#trigger.focus();
    });
    this.#slot.addEventListener('slotchange', () => this.#sync());
    // A press on the list must not take focus from the combobox.
    this.#listbox.addEventListener('mousedown', (event) =>
      event.preventDefault()
    );
    this.#listbox.addEventListener('click', (event) => {
      const option = this.#optionFrom(event);
      if (option && !option.disabled) this.#pick(option);
    });
    this.#listbox.addEventListener('pointermove', (event) => {
      const option = this.#optionFrom(event);
      if (option && !option.disabled && option !== this.#nav.active)
        this.#nav.set(option);
    });
    this.shadowRoot.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (
        next instanceof Node &&
        (this.shadowRoot.contains(next) || this.contains(next))
      )
        return;
      this.#touched = true;
      if (this.open) this.#close('blur');
      else this.requestUpdate();
    });
  }

  /** The `punica-option` children, in order. @returns {any[]} */
  get options() {
    return [...this.children].filter(
      (child) => child.localName === 'punica-option'
    );
  }

  /** The picked options. @returns {any[]} */
  get selectedOptions() {
    const values = this.#values();
    return this.options.filter((option) => values.includes(valueOf(option)));
  }

  /** Opens the list. */
  show() {
    this.open = true;
  }

  /** Closes the list. */
  hide() {
    this.#close('api');
  }

  /** Moves focus to the combobox. */
  focus(options) {
    this.#trigger.focus(options);
  }

  connected() {
    // Children inserted with the element are upgraded after it.
    queueMicrotask(() => this.isConnected && this.#sync());
  }

  disconnected() {
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
    if (state instanceof FormData)
      this.value = this.multiple
        ? state.getAll(this.name)
        : state.get(this.name);
    else if (typeof state === 'string') this.value = state;
  }

  /** @returns {string[]} */
  #values() {
    const value = this.value;
    if (Array.isArray(value)) return value.map(String);
    if (value == null) return [];
    // An option whose value is the empty string is a choice, as on a native select ("Any client"); with no such
    // option the empty string is nothing picked.
    if (value === '')
      return this.options.some((option) => valueOf(option) === '') ? [''] : [];
    return [String(value)];
  }

  #defaultValue() {
    let values = [];
    if (this.defaultValue != null) {
      values = this.multiple
        ? this.defaultValue.split(/\s+/).filter(Boolean)
        : [this.defaultValue];
    } else {
      values = this.options.filter((o) => this.#defaults.has(o)).map(valueOf);
    }
    if (this.multiple) return values;
    if (values.length) return values[0];
    // As a native select: one choice, nothing marked and no placeholder to show takes its first enabled option.
    if (this.placeholder) return null;
    const first = this.options.find((option) => !option.disabled);
    return first ? valueOf(first) : null;
  }

  /** Takes in options that arrived and brings the tree up to date. */
  #sync() {
    this.#applyDefault();
    if (this.isConnected) this.update(new Map());
  }

  /**
   * Applies the default value until the user, or code, sets another one.
   */
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
      // Assigned from outside: the default no longer applies.
      this.#dirty = true;
      return;
    }
    this.value = this.#defaultValue();
    this.#auto = JSON.stringify(this.#values());
  }

  update(changed) {
    if (
      !this.#initialised ||
      changed.has('defaultValue') ||
      changed.has('multiple')
    )
      this.#applyDefault();
    const options = this.options;
    const values = this.#values();
    const disabled = this.isDisabled;
    const name = fieldName(this);

    const known = new Map(options.map((option) => [valueOf(option), option]));
    for (const option of options)
      option.selected = values.includes(valueOf(option));
    const texts = values.map((value) =>
      known.has(value) ? textOf(known.get(value)) : value
    );
    const empty = texts.length === 0;
    let text = this.placeholder || '';
    if (!empty) {
      text =
        texts.length === 1
          ? texts[0]
          : new Intl.ListFormat(fieldLanguage(this), {
              style: 'short',
              type: 'unit'
            }).format(texts);
    }
    this.#valueEl.textContent = text;
    this.#valueEl.classList.toggle('placeholder', empty);
    this.toggleState('placeholder', empty);
    this.toggleState('disabled', disabled);

    const trigger = this.#trigger;
    trigger.disabled = disabled;
    setAttr(trigger, 'aria-label', name);
    setAttr(trigger, 'aria-required', this.required ? 'true' : null);
    setAttr(this.#listbox, 'aria-label', name);
    setAttr(
      this.#listbox,
      'aria-multiselectable',
      this.multiple ? 'true' : null
    );
    setAttr(this.#clear, 'aria-label', this.labelClear);
    this.#clear.hidden = !this.clearable || empty || disabled;

    // Form value: one entry per picked value.
    if (this.multiple && this.name) {
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.setFormValue(data);
    } else {
      this.setFormValue(empty ? null : values[0]);
    }
    // As a native required select: its empty-valued option (a placeholder) is no answer.
    const missing = this.required && (empty || values[0] === '');
    this.setValidity(
      missing ? { valueMissing: true } : {},
      nativeMessage('choose'),
      trigger
    );
    // Invalid for any reason once touched: a missing value, or an error set with setCustomValidity.
    const userInvalid = this.#touched && !this.validity.valid;
    setAttr(trigger, 'aria-invalid', userInvalid ? 'true' : null);
    setAttr(trigger, 'aria-description', this.description || null);
    this.toggleState('user-invalid', userInvalid);

    const want = this.open && !disabled;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, { matchWidth: true }, () =>
        this.#close('outside')
      );
      const first =
        options.find((o) => o.selected && !o.disabled) ||
        this.#nav.items[0] ||
        null;
      if (!this.#nav.active) this.#nav.set(first);
      this.toggleState('open', true);
      trigger.setAttribute('aria-expanded', 'true');
      this.emit('open');
    } else if (!want && this.#surface.open) {
      this.#surface.hide();
      this.#nav.set(null);
      this.toggleState('open', false);
      trigger.setAttribute('aria-expanded', 'false');
      const reason = this.#reason;
      this.#reason = 'api';
      this.emit('close', { reason });
    }
  }

  #optionFrom(event) {
    return (
      event
        .composedPath()
        .find(
          (node) =>
            node.localName === 'punica-option' && node.parentElement === this
        ) || null
    );
  }

  /** @param {string} reason */
  #close(reason) {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  /** @param {string[]} values */
  #commit(values) {
    const before = this.#values();
    if (
      before.length === values.length &&
      before.every((v, i) => v === values[i])
    )
      return;
    this.#dirty = true;
    this.#touched = true;
    this.value = this.multiple ? values : values[0] ?? null;
    this.emit('change', { value: this.value });
  }

  /** @param {any} option */
  #pick(option) {
    const value = valueOf(option);
    if (this.multiple) {
      const values = this.#values();
      // Keep the list's own order, whatever order the user clicked in.
      const next = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
      const order = this.options.map(valueOf);
      next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      this.#commit(next);
      this.#nav.set(option);
    } else {
      this.#commit([value]);
      this.#close('select');
    }
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (this.isDisabled) return;
    const nav = this.#nav;
    const key = event.key;

    if (!this.open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
        event.preventDefault();
        if (key === 'Home') nav.set(nav.items[0] || null);
        if (key === 'End') nav.set(nav.items.at(-1) || null);
        this.show();
        return;
      }
      const index = this.#typeahead(event, nav.items.map(textOf), -1);
      if (index >= 0) {
        event.preventDefault();
        nav.set(nav.items[index]);
        this.show();
      }
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.#close('escape');
    } else if (key === 'Tab') {
      // Tab takes the highlighted option and moves on.
      if (nav.active && !this.multiple) this.#pick(nav.active);
      else this.#close('blur');
    } else if (
      key === 'Enter' ||
      key === ' ' ||
      (key === 'ArrowUp' && event.altKey)
    ) {
      event.preventDefault();
      if (nav.active) this.#pick(nav.active);
      if (key === 'ArrowUp') this.#close('select');
    } else if (nav.move(event)) {
      event.preventDefault();
    } else {
      const items = nav.items;
      const index = this.#typeahead(
        event,
        items.map(textOf),
        items.indexOf(nav.active)
      );
      if (index >= 0) {
        event.preventDefault();
        nav.set(items[index]);
      }
    }
  }
}

define('punica-select', PunicaSelect);
