import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import styles from './iconButton.css';

/**
 * A button that shows only an icon. `label` is its accessible name and is
 * required: an icon says nothing to a screen reader.
 *
 * @element punica-icon-button
 *
 * @attr {string} label - Accessible name. Required.
 * @attr {'filled' | 'outlined' | 'text'} variant - Visual weight, `text` by default.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `neutral` by default.
 * @attr {'xsmall' | 'small' | 'medium' | 'large'} size - Control size, `medium` by default. `xsmall` is for a row of a dense list or a toolbar inside one.
 * @attr {'button' | 'submit' | 'reset'} type - What a click does to the owning form, `button` by default.
 * @attr {boolean} disabled - Takes no clicks and no focus.
 * @attr {boolean} required - Part of the form control contract; this control always has a value, so it never blocks a form.
 * @attr {boolean} loading - Shows a spinner in place of the icon, keeps focus, ignores clicks.
 * @attr {string} name - Submitted with `value` when this button submits the form.
 * @attr {string} value - Submitted with `name`.
 *
 * @slot - The icon.
 *
 * @csspart base - The native button.
 * @csspart spinner - The loading indicator.
 *
 * @cssprop --punica-icon-button-size - Inline and block size.
 * @cssprop --punica-icon-button-radius - Corner radius, round by default.
 * @cssprop --punica-icon-button-icon-size - Font size the icon scales with.
 */
export class PunicaIconButton extends FormControl(PunicaElement) {
  static properties = {
    label: {},
    variant: {},
    color: {},
    size: {},
    type: { default: 'button' },
    loading: { type: Boolean },
    value: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `<button part="base" type="button"><slot></slot><span part="spinner" class="spinner" aria-hidden="true"></span></button>`;

  #button = this.$('button');

  constructor() {
    super();
    this.#button.addEventListener('click', () => this.#onClick());
    // A click that lands on the host while it cannot act goes nowhere.
    this.addEventListener(
      'click',
      (event) => {
        if (this.isDisabled || this.loading) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true }
    );
  }

  update() {
    const button = this.#button;
    button.disabled = this.isDisabled;
    button.setAttribute('aria-busy', String(this.loading));
    if (this.loading) button.setAttribute('aria-disabled', 'true');
    else button.removeAttribute('aria-disabled');
    if (this.label) button.setAttribute('aria-label', this.label);
    else button.removeAttribute('aria-label');
  }

  /** Moves focus to the button. */
  focus(options) {
    this.#button.focus(options);
  }

  /** Clicks the button the way a user would. */
  click() {
    this.#button.click();
  }

  #onClick() {
    if (this.isDisabled || this.loading) return;
    if (this.type === 'submit') {
      // A native submitter carries its name and value into the form data.
      this.internals.setFormValue(this.value ?? '');
      this.formAction('submit');
      this.internals.setFormValue(null);
    } else if (this.type === 'reset') {
      this.formAction('reset');
    }
  }
}

define('punica-icon-button', PunicaIconButton);
