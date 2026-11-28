import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import styles from './textarea.css';

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
 * A multi-line text field over a native `<textarea>`.
 *
 * The `value` attribute is the default value; the `value` property is what
 * the field holds now. Validity is the inner textarea's own.
 *
 * @element punica-textarea
 *
 * @attr {string} value - Default value. The property holds the current value.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name, when no `<label>` points at the field. An `aria-label` on the element names it too; `label` wins.
 * @attr {string} placeholder - Shown while the field is empty.
 * @attr {number} rows - Visible lines, 3 by default; the least height when `resize` is `auto`.
 * @attr {'none' | 'vertical' | 'auto'} resize - `none` by default; `vertical` shows a drag handle, `auto` grows with the content.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no edits.
 * @attr {boolean} required - A value is needed before the form submits.
 * @attr {string} description - Read by assistive technology after the control's name; a `punica-field` around it sets it to its help and its error.
 * @attr {number} minlength - Fewest characters allowed.
 * @attr {number} maxlength - Most characters allowed.
 * @attr {string} autocomplete - Passed to the native textarea.
 * @attr {string} inputmode - Virtual keyboard hint, passed to the native textarea.
 * @attr {boolean} mono - Draws the text in the fixed-width face: code, JSON, a key.
 * @attr {boolean} full-width - Fills its container's inline size.
 *
 * @fires {{ value: string }} punica-input - The value changed while the user is editing; `detail: { value }`.
 * @fires {{ value: string }} punica-change - The user committed a new value; `detail: { value }`.
 *
 * @csspart base - The bordered box around the textarea.
 * @csspart textarea - The native textarea.
 *
 * @cssprop --punica-textarea-padding - Padding inside the border.
 * @cssprop --punica-textarea-radius - Corner radius.
 * @cssprop --punica-textarea-border-color - Border colour at rest.
 * @cssprop --punica-textarea-background - Background.
 * @cssprop --punica-textarea-color - Text colour.
 * @cssprop --punica-textarea-max-height - Height `resize="auto"` stops growing at; none by default.
 *
 * @cssstate invalid - The value breaks a constraint.
 * @cssstate valid - The value meets every constraint.
 * @cssstate user-invalid - Invalid, and the user has left the field or tried to submit.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaTextarea extends FormControl(PunicaElement) {
  static properties = {
    // A name written on the element the usual way names the control too; `label` wins.
    ariaLabel: { attribute: 'aria-label', reflect: false },
    value: { reflect: false, default: '' },
    label: {},
    /** Read after the name by assistive technology; a punica-field around the control sets it. */
    description: {},
    placeholder: {},
    rows: { type: Number, default: 3 },
    resize: { default: 'none' },
    readonly: { type: Boolean },
    minlength: { type: Number },
    maxlength: { type: Number },
    autocomplete: {},
    inputmode: {},
    fullWidth: { type: Boolean },
    mono: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `<div part="base" class="base"><textarea part="textarea"></textarea></div>`;

  #textarea = this.$('textarea');
  #touched = false;
  /** @type {ResizeObserver | null} */
  #observer = null;

  constructor() {
    super();
    const textarea = this.#textarea;
    textarea.addEventListener('input', () => {
      this.value = textarea.value;
      this.#fit();
      this.emit('input', { value: this.value });
    });
    textarea.addEventListener('change', () => {
      this.value = textarea.value;
      this.emit('change', { value: this.value });
    });
    textarea.addEventListener('blur', () => this.#touch());
    this.addEventListener('invalid', () => this.#touch());
  }

  connected() {
    // The fallback for `resize="auto"` also has to follow a width change.
    if (!CSS.supports('field-sizing', 'content')) {
      this.#observer = new ResizeObserver(() => this.#fit());
      this.#observer.observe(this);
    }
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  update() {
    const textarea = this.#textarea;
    setAttr(textarea, 'placeholder', this.placeholder);
    setAttr(textarea, 'rows', this.rows ?? 3);
    textarea.style.setProperty('--_rows', String(this.rows ?? 3));
    setAttr(textarea, 'minlength', this.minlength);
    setAttr(textarea, 'maxlength', this.maxlength);
    setAttr(textarea, 'autocomplete', this.autocomplete);
    setAttr(textarea, 'inputmode', this.inputmode);
    setAttr(textarea, 'aria-label', this.#name());
    textarea.readOnly = this.readonly;
    textarea.required = this.required;
    textarea.disabled = this.isDisabled;

    const value = this.value ?? '';
    if (textarea.value !== value) textarea.value = value;
    this.#fit();

    this.setFormValue(textarea.value);
    this.setValidity(
      flagsOf(textarea.validity),
      textarea.validationMessage,
      textarea
    );
    const userInvalid = this.#touched && !this.validity.valid;
    this.toggleState('user-invalid', userInvalid);
    setAttr(textarea, 'aria-invalid', userInvalid ? 'true' : null);
    setAttr(textarea, 'aria-description', this.description || null);
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
    this.#textarea.focus(options);
  }

  /** Selects all the text in the field. */
  select() {
    this.#textarea.select();
  }

  /**
   * Selects a range of the text.
   * @param {number} start
   * @param {number} end
   * @param {'forward' | 'backward' | 'none'} [direction]
   */
  setSelectionRange(start, end, direction) {
    this.#textarea.setSelectionRange(start, end, direction);
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
    // The inner control says so too (aria-invalid), in the update: an update already run this turn
    // (a submit reads the validity first) would leave it unsaid.
    this.requestUpdate();
  }

  /** Grows the textarea to its content where `field-sizing` is missing. */
  #fit() {
    const textarea = this.#textarea;
    if (this.resize !== 'auto' || CSS.supports('field-sizing', 'content')) {
      if (textarea.style.blockSize) textarea.style.blockSize = '';
      return;
    }
    textarea.style.blockSize = 'auto';
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.blockSize = `${textarea.scrollHeight + borders}px`;
  }
}

define('punica-textarea', PunicaTextarea);
