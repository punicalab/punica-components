import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { icons } from '../../core/icons.js';
import styles from './input.css';

const setAttr = (el, name, value) => {
  if (value == null || value === false) el.removeAttribute(name);
  else el.setAttribute(name, value === true ? '' : String(value));
};

// A ValidityState keeps its flags on the prototype; copy the set ones out.
const flagsOf = (validity) => {
  const flags = {};
  for (const key in validity)
    if (key !== 'valid' && validity[key]) flags[key] = true;
  return flags;
};

/**
 * A single-line text field over a native `<input>`.
 *
 * The `value` attribute is the default value; the `value` property is what
 * the field holds now. Validity is the inner input's own, so `required`,
 * `pattern`, `minlength`, `maxlength`, `min`, `max`, `step` and `type` are
 * checked by the browser and reported through the owning form.
 *
 * @element punica-input
 *
 * @attr {string} type - Any text-like input type, `text` by default.
 * @attr {string} value - Default value. The property holds the current value.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name, when no `<label>` points at the field. An `aria-label` on the element names it too; `label` wins.
 * @attr {string} placeholder - Shown while the field is empty.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no edits.
 * @attr {boolean} required - A value is needed before the form submits.
 * @attr {string} description - Read by assistive technology after the control's name; a `punica-field` around it sets it to its help and its error.
 * @attr {string} pattern - Regular expression the value must match.
 * @attr {number} minlength - Fewest characters allowed.
 * @attr {number} maxlength - Most characters allowed.
 * @attr {string} min - Lowest value, for number and date types.
 * @attr {string} max - Highest value, for number and date types.
 * @attr {string} step - Granularity, for number and date types.
 * @attr {string} autocomplete - Passed to the native input.
 * @attr {string} inputmode - Virtual keyboard hint, passed to the native input.
 * @attr {boolean} clearable - Shows a button that empties the field.
 * @attr {string} label-clear - Name of the clear button, `Clear` by default.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 *
 * @slot start - Content before the text, an icon.
 * @slot end - Content after the text.
 *
 * @fires punica-input - The value changed while the user is editing; `detail: { value }`.
 * @fires punica-change - The user committed a new value; `detail: { value }`.
 *
 * @csspart base - The bordered box around the slots and the input.
 * @csspart input - The native input.
 * @csspart clear - The clear button.
 * @csspart icon - The glyph inside the clear button.
 *
 * @cssprop --punica-input-height - Block size.
 * @cssprop --punica-input-padding - Inline padding.
 * @cssprop --punica-input-radius - Corner radius.
 * @cssprop --punica-input-border-color - Border colour at rest.
 * @cssprop --punica-input-background - Background.
 * @cssprop --punica-input-color - Text colour.
 *
 * @cssstate invalid - The value breaks a constraint.
 * @cssstate valid - The value meets every constraint.
 * @cssstate user-invalid - Invalid, and the user has left the field or tried to submit.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaInput extends FormControl(PunicaElement) {
  static properties = {
    // A name written on the element the usual way names the control too; `label` wins.
    ariaLabel: { attribute: 'aria-label', reflect: false },
    type: { default: 'text' },
    value: { reflect: false, default: '' },
    label: {},
    /** Read after the name by assistive technology; a punica-field around the control sets it. */
    description: {},
    placeholder: {},
    readonly: { type: Boolean },
    pattern: {},
    minlength: { type: Number },
    maxlength: { type: Number },
    min: {},
    max: {},
    step: {},
    autocomplete: {},
    inputmode: {},
    clearable: { type: Boolean },
    labelClear: { default: 'Clear' },
    size: {},
    fullWidth: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base">
      <slot name="start"></slot>
      <input part="input" />
      <button part="clear" class="clear" type="button" tabindex="-1" hidden>${icons.close}</button>
      <slot name="end"></slot>
    </div>
  `;

  #input = this.$('input');
  #clear = this.$('.clear');
  #touched = false;

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('input', () => {
      this.value = input.value;
      // Validity can change while the value does not: a half-typed number or date reads as "" throughout.
      this.requestUpdate();
      this.emit('input', { value: this.value });
    });
    input.addEventListener('change', () => {
      this.value = input.value;
      this.emit('change', { value: this.value });
    });
    input.addEventListener('keydown', (event) => {
      if (
        event.key === 'Enter' &&
        !event.isComposing &&
        !event.defaultPrevented
      ) {
        submitForm(this.form);
      }
    });
    input.addEventListener('blur', () => this.#touch());
    this.addEventListener('invalid', () => this.#touch());
    this.#clear.addEventListener('click', () => this.#onClear());
    // A press on the padding or an adornment puts the caret in the field.
    this.$('.base').addEventListener('mousedown', (event) => {
      if (
        event.target === input ||
        event.target === this.#clear ||
        this.isDisabled
      )
        return;
      if (
        event.target.closest?.('button, a, input, select, textarea, [tabindex]')
      )
        return;
      event.preventDefault();
      input.focus();
    });
  }

  update() {
    const input = this.#input;
    setAttr(input, 'type', this.type || 'text');
    setAttr(input, 'placeholder', this.placeholder);
    setAttr(input, 'pattern', this.pattern);
    setAttr(input, 'minlength', this.minlength);
    setAttr(input, 'maxlength', this.maxlength);
    setAttr(input, 'min', this.min);
    setAttr(input, 'max', this.max);
    setAttr(input, 'step', this.step);
    setAttr(input, 'autocomplete', this.autocomplete);
    setAttr(input, 'inputmode', this.inputmode);
    setAttr(input, 'aria-label', this.#name());
    input.readOnly = this.readonly;
    input.required = this.required;
    input.disabled = this.isDisabled;

    const value = this.value ?? '';
    if (input.value !== value) input.value = value;

    setAttr(this.#clear, 'aria-label', this.labelClear);
    this.#clear.hidden =
      !this.clearable || !input.value || this.readonly || this.isDisabled;

    this.setFormValue(input.value);
    this.setValidity(flagsOf(input.validity), input.validationMessage, input);
    const userInvalid = this.#touched && !this.validity.valid;
    this.toggleState('user-invalid', userInvalid);
    setAttr(input, 'aria-invalid', userInvalid ? 'true' : null);
    setAttr(input, 'aria-description', this.description || null);
  }

  formReset() {
    this.#touched = false;
    this.value = this.getAttribute('value') ?? '';
    this.requestUpdate();
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state;
  }

  /** Moves focus to the field. */
  focus(options) {
    this.#input.focus(options);
  }

  /** Selects all the text in the field. */
  select() {
    this.#input.select();
  }

  /**
   * Selects a range of the text.
   * @param {number} start
   * @param {number} end
   * @param {'forward' | 'backward' | 'none'} [direction]
   */
  setSelectionRange(start, end, direction) {
    this.#input.setSelectionRange(start, end, direction);
  }

  #name() {
    if (this.label) return this.label;
    if (this.ariaLabel) return this.ariaLabel;
    const text = [...this.labels]
      .map((l) => l.textContent.trim())
      .filter(Boolean);
    return text.length ? text.join(' ') : null;
  }

  #touch() {
    this.#touched = true;
    this.toggleState('user-invalid', !this.validity.valid);
  }

  #onClear() {
    if (this.isDisabled || this.readonly) return;
    this.value = '';
    this.#input.value = '';
    this.#input.focus();
    this.emit('input', { value: '' });
    this.emit('change', { value: '' });
  }
}

define('punica-input', PunicaInput);
