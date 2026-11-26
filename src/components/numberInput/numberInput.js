import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { icons } from '../../core/icons.js';
import styles from './numberInput.css';

const setAttr = (el, name, value) => {
  if (value == null || value === false) el.removeAttribute(name);
  else el.setAttribute(name, value === true ? '' : String(value));
};

// A ValidityState keeps its flags on the prototype; copy the set ones out.
const flagsOf = (validity) => {
  const flags = {};
  for (const key in validity) if (key !== 'valid' && validity[key]) flags[key] = true;
  return flags;
};

const decimals = (n) => {
  const text = String(n);
  if (text.includes('e-')) return Number(text.split('e-')[1]);
  return text.includes('.') ? text.split('.')[1].length : 0;
};

/**
 * A number field: a native text input with a decimal keyboard, a spinbutton
 * role and two step buttons.
 *
 * `value` is a number, or `null` while the field is empty. While the field
 * has focus it shows the plain number for editing; otherwise it shows the
 * number formatted by `Intl.NumberFormat` in the element's language. What
 * is typed is read in that language too, so `1,5` is one and a half in
 * German and fifteen in English.
 *
 * ArrowUp and ArrowDown step, PageUp and PageDown step ten times, Home and
 * End go to `min` and `max` when they are set. A typed value is clamped to
 * the range when the user commits it.
 *
 * @element punica-number-input
 *
 * @attr {number} value - Default value. The property holds the current number, or `null`.
 * @attr {number} min - Lowest value.
 * @attr {number} max - Highest value.
 * @attr {number} step - Step of the buttons and arrow keys, 1 by default.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name, when no `<label>` points at the field.
 * @attr {string} placeholder - Shown while the field is empty.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no edits.
 * @attr {boolean} required - A number is needed before the form submits.
 * @attr {string} label-increment - Name of the step-up button, `Increase` by default.
 * @attr {string} label-decrement - Name of the step-down button, `Decrease` by default.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 *
 * @prop {Intl.NumberFormatOptions | null} formatOptions - Options for the unfocused display, a currency or a unit.
 *
 * @slot start - Content before the number, a currency sign.
 * @slot end - Content after the number, a unit.
 *
 * @fires {{ value: number | null }} punica-input - The number changed while the user is editing or stepping; `detail: { value }`.
 * @fires {{ value: number | null }} punica-change - The user committed a new number; `detail: { value }`.
 *
 * @csspart base - The bordered box.
 * @csspart input - The native input.
 * @csspart steppers - The wrapper around the two buttons.
 * @csspart decrement - The step-down button.
 * @csspart increment - The step-up button.
 * @csspart icon - The glyphs inside the buttons.
 *
 * @cssprop --punica-number-input-height - Block size.
 * @cssprop --punica-number-input-padding - Inline padding.
 * @cssprop --punica-number-input-radius - Corner radius.
 * @cssprop --punica-number-input-border-color - Border colour at rest.
 * @cssprop --punica-number-input-background - Background.
 * @cssprop --punica-number-input-color - Text colour.
 *
 * @cssstate invalid - Required and empty.
 * @cssstate valid - Meets its constraint.
 * @cssstate user-invalid - Invalid, and the user has left the field or tried to submit.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaNumberInput extends FormControl(PunicaElement) {
  static properties = {
    value: { type: Number, reflect: false },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number, default: 1 },
    label: {},
    placeholder: {},
    readonly: { type: Boolean },
    labelIncrement: { default: 'Increase' },
    labelDecrement: { default: 'Decrease' },
    size: {},
    fullWidth: { type: Boolean },
    formatOptions: { type: Object, attribute: false }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base">
      <slot name="start"></slot>
      <input part="input" type="text" inputmode="decimal" role="spinbutton" autocomplete="off" />
      <slot name="end"></slot>
      <span part="steppers" class="steppers">
        <button part="decrement" class="decrement" type="button" tabindex="-1">${icons.minus}</button>
        <button part="increment" class="increment" type="button" tabindex="-1">${icons.plus}</button>
      </span>
    </div>
  `;

  #input = this.$('input');
  #touched = false;
  /** Value when the field took focus, to tell whether the visit changed it. */
  #committed = null;

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('input', () => {
      const value = this.#parse(input.value);
      if (value === this.value) return;
      this.value = value;
      this.emit('input', { value });
    });
    input.addEventListener('focus', () => {
      this.#committed = this.value;
      // Grouping and currency signs come off for editing.
      const text = this.#format(this.value, true);
      if (input.value !== text) input.value = text;
    });
    input.addEventListener('blur', () => {
      this.#commit();
      this.#touched = true;
      this.update(new Map());
    });
    input.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('invalid', () => {
      this.#touched = true;
      this.toggleState('user-invalid', true);
    });
    this.$('.increment').addEventListener('click', () => this.#press(1));
    this.$('.decrement').addEventListener('click', () => this.#press(-1));
    // A press on a step button must not take focus out of the field.
    this.$('.steppers').addEventListener('mousedown', (event) => event.preventDefault());
  }

  update() {
    const input = this.#input;
    const value = this.value;
    setAttr(input, 'placeholder', this.placeholder);
    setAttr(input, 'aria-label', this.#name());
    setAttr(input, 'aria-valuenow', value);
    setAttr(input, 'aria-valuemin', this.min);
    setAttr(input, 'aria-valuemax', this.max);
    input.readOnly = this.readonly;
    input.required = this.required;
    input.disabled = this.isDisabled;
    this.#show();

    const locked = this.isDisabled || this.readonly;
    const up = this.$('.increment');
    const down = this.$('.decrement');
    setAttr(up, 'aria-label', this.labelIncrement);
    setAttr(down, 'aria-label', this.labelDecrement);
    up.disabled = locked || (value != null && this.max != null && value >= this.max);
    down.disabled = locked || (value != null && this.min != null && value <= this.min);

    this.setFormValue(value == null ? '' : String(value));
    this.setValidity(value == null ? flagsOf(input.validity) : {}, input.validationMessage, input);
    this.toggleState('user-invalid', this.#touched && !this.validity.valid);
  }

  formReset() {
    this.#touched = false;
    const attr = this.getAttribute('value');
    const n = attr === null || attr.trim() === '' ? NaN : Number(attr);
    this.value = Number.isNaN(n) ? null : n;
    this.requestUpdate();
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state === '' ? null : Number(state);
  }

  /** Moves focus to the field. */
  focus(options) {
    this.#input.focus(options);
  }

  /** Selects all the text in the field. */
  select() {
    this.#input.select();
  }

  /** Raises the value by `n` steps, 1 by default. Fires nothing. */
  stepUp(n = 1) {
    this.value = this.#stepped(n);
  }

  /** Lowers the value by `n` steps, 1 by default. Fires nothing. */
  stepDown(n = 1) {
    this.value = this.#stepped(-n);
  }

  #name() {
    if (this.label) return this.label;
    const text = [...this.labels].map((l) => l.textContent.trim()).filter(Boolean);
    return text.length ? text.join(' ') : null;
  }

  #lang() {
    return this.closest('[lang]')?.lang || navigator.language;
  }

  /** The decimal and group separators of the element's language. */
  #separators() {
    let parts;
    try {
      parts = new Intl.NumberFormat(this.#lang()).formatToParts(12345.6);
    } catch {
      parts = new Intl.NumberFormat().formatToParts(12345.6);
    }
    return {
      decimal: parts.find((p) => p.type === 'decimal')?.value || '.',
      group: parts.find((p) => p.type === 'group')?.value || ''
    };
  }

  /** @returns {number | null} */
  #parse(text) {
    const { decimal, group } = this.#separators();
    let plain = text.trim().replace(/[\s\u00a0\u202f]/g, '');
    if (group) plain = plain.split(group).join('');
    if (decimal !== '.') plain = plain.split(decimal).join('.');
    plain = plain.replace(/^\u2212/, '-');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(plain)) return null;
    return Number(plain);
  }

  #format(value, editing) {
    if (value == null) return '';
    if (editing) {
      const { decimal } = this.#separators();
      const text = String(value);
      return /e/i.test(text) ? text : text.replace('.', decimal);
    }
    try {
      return new Intl.NumberFormat(this.#lang(), {
        maximumFractionDigits: 20,
        ...(this.formatOptions || {})
      }).format(value);
    } catch {
      return String(value);
    }
  }

  /** Writes the value into the input, unless the input already says it. */
  #show() {
    const input = this.#input;
    const focused = this.shadowRoot.activeElement === input;
    if (focused) {
      // Never rewrite what is being typed while it still means the value.
      if (this.#parse(input.value) !== this.value) input.value = this.#format(this.value, true);
    } else {
      const text = this.#format(this.value, false);
      if (input.value !== text) input.value = text;
    }
  }

  #clamp(value) {
    if (this.min != null && value < this.min) value = this.min;
    if (this.max != null && value > this.max) value = this.max;
    return value;
  }

  /** The value `n` steps away, on the step grid that starts at `min`. */
  #stepped(n) {
    const step = this.step > 0 ? this.step : 1;
    const base = this.min ?? 0;
    const current = this.value ?? this.#clamp(0);
    const places = Math.max(decimals(step), decimals(base), decimals(current));
    const ratio = Number(((current - base) / step).toFixed(8));
    // Off the grid, a step goes to the next grid line in its direction.
    const index = Number.isInteger(ratio) ? ratio + n : n > 0 ? Math.floor(ratio) + n : Math.ceil(ratio) + n;
    return this.#clamp(Number((base + index * step).toFixed(places)));
  }

  /** Takes a number from the user: sets it and fires both events. */
  #set(value) {
    if (value === this.value) return;
    this.value = value;
    this.#committed = value;
    this.#input.value = this.#format(value, this.shadowRoot.activeElement === this.#input);
    this.update(new Map());
    this.emit('input', { value });
    this.emit('change', { value });
  }

  /** The end of an edit: clamp, drop what is not a number, say what changed. */
  #commit() {
    const before = this.value;
    if (before != null) {
      const clamped = this.#clamp(before);
      if (clamped !== before) {
        this.value = clamped;
        this.emit('input', { value: clamped });
      }
    }
    if (this.value !== this.#committed) {
      this.#committed = this.value;
      this.update(new Map());
      this.emit('change', { value: this.value });
    }
  }

  #press(direction) {
    if (this.isDisabled || this.readonly) return;
    this.#input.focus();
    this.#set(this.#stepped(direction));
  }

  #onKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter' && !event.isComposing) {
      this.#commit();
      this.#input.value = this.#format(this.value, true);
      submitForm(this.form);
      return;
    }
    if (this.readonly) return;
    let next;
    switch (event.key) {
      case 'ArrowUp':
        next = this.#stepped(1);
        break;
      case 'ArrowDown':
        next = this.#stepped(-1);
        break;
      case 'PageUp':
        next = this.#stepped(10);
        break;
      case 'PageDown':
        next = this.#stepped(-10);
        break;
      case 'Home':
        if (this.min == null) return;
        next = this.min;
        break;
      case 'End':
        if (this.max == null) return;
        next = this.max;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.#set(next);
  }
}

define('punica-number-input', PunicaNumberInput);
