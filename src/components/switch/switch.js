import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import styles from './switch.css';

/** The browser's own "tick this box" message, in the user's language. */
const missingMessage = () => {
  const probe = document.createElement('input');
  probe.type = 'checkbox';
  probe.required = true;
  return probe.validationMessage;
};

/**
 * An on/off switch: a native `<button role="switch">`.
 *
 * `checked` follows the state in both directions. The state the element
 * first rendered with is what `form.reset()` goes back to.
 *
 * @element punica-switch
 *
 * @attr {boolean} checked - On.
 * @attr {string} value - Submitted with `name` while on, `on` by default.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name, for a switch with no text.
 * @attr {string} label-on - Text shown after the track, highlighted while on.
 * @attr {string} label-off - Text shown before the track, highlighted while off.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} required - Has to be on before the form submits.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent of the on state, `primary` by default.
 * @attr {'small' | 'medium' | 'large'} size - Track size, `medium` by default.
 *
 * @slot - The label.
 *
 * @fires {{ checked: boolean, value: string }} punica-change - The user flipped the switch; `detail: { checked, value }`.
 *
 * @csspart base - The native button.
 * @csspart track - The lever's track.
 * @csspart thumb - The handle.
 * @csspart label-on - The on text.
 * @csspart label-off - The off text.
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop --punica-switch-width - Inline size of the track.
 * @cssprop --punica-switch-height - Block size of the track.
 * @cssprop --punica-switch-track-color - Track while off.
 * @cssprop --punica-switch-track-color-checked - Track while on.
 * @cssprop --punica-switch-thumb-color - Handle.
 * @cssprop --punica-switch-gap - Space between the texts, the track and the label.
 *
 * @cssstate checked - On.
 * @cssstate invalid - Required and off.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaSwitch extends FormControl(PunicaElement) {
  static properties = {
    checked: { type: Boolean },
    value: { default: 'on' },
    label: {},
    labelOn: {},
    labelOff: {},
    color: {},
    size: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <button part="base" type="button" role="switch" aria-checked="false">
      <span part="label-off" class="text off" aria-hidden="true" hidden></span>
      <span part="track" class="track"><span part="thumb" class="thumb"></span></span>
      <span part="label-on" class="text on" aria-hidden="true" hidden></span>
      <span part="label" class="label" hidden><slot></slot></span>
    </button>
  `;

  #button = this.$('button');
  #default = false;

  constructor() {
    super();
    const button = this.#button;
    // Space and Enter reach a native button as a click.
    button.addEventListener('click', () => {
      if (this.isDisabled) return;
      this.checked = !this.checked;
      this.emit('change', { checked: this.checked, value: this.value });
    });
    // A <label for> outside clicks the host itself; hand it to the button.
    this.addEventListener('click', (event) => {
      if (event.composedPath()[0] === this && !this.isDisabled) button.click();
    });
    const slot = this.$('slot');
    slot.addEventListener('slotchange', () => {
      const filled = slot.assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
      this.$('.label').hidden = !filled;
    });
  }

  update() {
    const button = this.#button;
    button.disabled = this.isDisabled;
    button.setAttribute('aria-checked', String(this.checked));
    const name = this.#name();
    if (name) button.setAttribute('aria-label', name);
    else button.removeAttribute('aria-label');
    if (this.required) button.setAttribute('aria-required', 'true');
    else button.removeAttribute('aria-required');

    const on = this.$('.on');
    const off = this.$('.off');
    on.textContent = this.labelOn ?? '';
    on.hidden = !this.labelOn;
    off.textContent = this.labelOff ?? '';
    off.hidden = !this.labelOff;

    this.toggleState('checked', this.checked);
    this.setFormValue(this.checked ? this.value ?? 'on' : null, String(this.checked));
    const missing = this.required && !this.checked;
    this.setValidity(missing ? { valueMissing: true } : {}, missing ? missingMessage() : '', button);
  }

  firstUpdated() {
    this.#default = this.checked;
  }

  formReset() {
    this.checked = this.#default;
  }

  formRestore(state) {
    this.checked = state === 'true';
  }

  /** Moves focus to the switch. */
  focus(options) {
    this.#button.focus(options);
  }

  /** Flips the switch the way a user would, firing `punica-change`. */
  click() {
    this.#button.click();
  }

  #name() {
    if (this.label) return this.label;
    const text = [...this.labels].map((l) => l.textContent.trim()).filter(Boolean);
    return text.length ? text.join(' ') : null;
  }
}

define('punica-switch', PunicaSwitch);
