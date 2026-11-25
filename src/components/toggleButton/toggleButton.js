import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import styles from './toggleButton.css';

/** The browser's own "tick this box" message, in the user's language. */
const missingMessage = () => {
  const probe = document.createElement('input');
  probe.type = 'checkbox';
  probe.required = true;
  return probe.validationMessage;
};

/**
 * A button that stays pressed: a native `<button aria-pressed>`.
 *
 * On its own it is a form control that submits `value` under `name` while
 * pressed. Inside a `<punica-toggle-button-group>` the group owns the value
 * and the button submits nothing.
 *
 * @element punica-toggle-button
 *
 * @attr {boolean} pressed - Pressed.
 * @attr {string} value - What the button stands for; submitted while pressed, `on` by default.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name, for a button with no text.
 * @attr {boolean} disabled - Takes no clicks and no focus.
 * @attr {boolean} required - Has to be pressed before the form submits.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent of the pressed state, `primary` by default.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 * @slot end - Content after the label.
 *
 * @fires {{ pressed: boolean, checked: boolean, value: string }} punica-change - The user pressed or released the button; `detail: { pressed, checked, value }`, where `checked` equals `pressed`.
 *
 * @csspart base - The native button.
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop --punica-toggle-button-height - Minimum block size.
 * @cssprop --punica-toggle-button-padding - Inline padding.
 * @cssprop --punica-toggle-button-radius - Corner radius of all four corners.
 * @cssprop --punica-toggle-button-radius-start-start - Block-start, inline-start corner; the radius by default.
 * @cssprop --punica-toggle-button-radius-start-end - Block-start, inline-end corner; the radius by default.
 * @cssprop --punica-toggle-button-radius-end-start - Block-end, inline-start corner; the radius by default.
 * @cssprop --punica-toggle-button-radius-end-end - Block-end, inline-end corner; the radius by default.
 * @cssprop --punica-toggle-button-border-color - Border while not pressed.
 *
 * @cssstate pressed - Pressed.
 * @cssstate invalid - Required and not pressed.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaToggleButton extends FormControl(PunicaElement) {
  static properties = {
    pressed: { type: Boolean },
    value: {},
    label: {},
    color: {},
    size: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <button part="base" type="button" aria-pressed="false">
      <slot name="start"></slot>
      <span part="label" class="label"><slot></slot></span>
      <slot name="end"></slot>
    </button>
  `;

  #button = this.$('button');
  #default = false;

  constructor() {
    super();
    this.#button.addEventListener('click', () => {
      if (this.#off()) return;
      this.pressed = !this.pressed;
      this.emit('change', { pressed: this.pressed, checked: this.pressed, value: this.value });
    });
    // A click that lands on the host while it cannot act goes nowhere.
    this.addEventListener(
      'click',
      (event) => {
        if (this.#off()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true }
    );
  }

  update() {
    const button = this.#button;
    const group = this.#group();
    button.disabled = this.#off();
    button.setAttribute('aria-pressed', String(this.pressed));
    if (this.label) button.setAttribute('aria-label', this.label);
    else button.removeAttribute('aria-label');

    this.toggleState('pressed', this.pressed);
    this.setFormValue(this.pressed && !group ? this.value ?? 'on' : null, String(this.pressed));
    const missing = this.required && !this.pressed && !group;
    this.setValidity(missing ? { valueMissing: true } : {}, missing ? missingMessage() : '', button);
  }

  firstUpdated() {
    this.#default = this.pressed;
  }

  formReset() {
    if (!this.#group()) this.pressed = this.#default;
  }

  formRestore(state) {
    if (!this.#group()) this.pressed = state === 'true';
  }

  /** Moves focus to the button. */
  focus(options) {
    this.#button.focus(options);
  }

  /** Clicks the button the way a user would, firing `punica-change`. */
  click() {
    this.#button.click();
  }

  #group() {
    return /** @type {any} */ (this.closest('punica-toggle-button-group'));
  }

  #off() {
    return this.isDisabled || !!this.#group()?.isDisabled;
  }
}

define('punica-toggle-button', PunicaToggleButton);
