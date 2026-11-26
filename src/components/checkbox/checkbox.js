import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { icons } from '../../core/icons.js';
import styles from './checkbox.css';

// A ValidityState keeps its flags on the prototype; copy the set ones out.
const flagsOf = (validity) => {
  const flags = {};
  for (const key in validity)
    if (key !== 'valid' && validity[key]) flags[key] = true;
  return flags;
};

/**
 * A checkbox over a native `<input type="checkbox">`.
 *
 * `checked` follows the state in both directions: the attribute is present
 * exactly while the box is ticked. The state the element first rendered
 * with is what `form.reset()` goes back to.
 *
 * @element punica-checkbox
 *
 * @attr {boolean} checked - Ticked.
 * @attr {boolean} indeterminate - Neither ticked nor empty; the next user toggle clears it.
 * @attr {string} value - Submitted with `name` while ticked, `on` by default.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name, for a checkbox with no text. An `aria-label` on the element names it too; `label` wins.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} required - Has to be ticked before the form submits.
 * @attr {string} description - Read by assistive technology after the control's name; a `punica-field` around it sets it to its help and its error.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `primary` by default.
 *
 * @slot - The label.
 *
 * @fires {{ checked: boolean, value: string }} punica-change - The user toggled the box; `detail: { checked, value }`.
 *
 * @csspart base - The label element around everything.
 * @csspart input - The native checkbox, laid invisibly over the box.
 * @csspart control - The drawn box.
 * @csspart icon - The check and the indeterminate dash.
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop --punica-checkbox-size - Size of the box.
 * @cssprop --punica-checkbox-radius - Corner radius of the box.
 * @cssprop --punica-checkbox-border-color - Border of the empty box.
 * @cssprop --punica-checkbox-color - Fill of the ticked box.
 * @cssprop --punica-checkbox-gap - Space between the box and the label.
 *
 * @cssstate checked - Ticked.
 * @cssstate indeterminate - Indeterminate.
 * @cssstate invalid - Required and not ticked.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaCheckbox extends FormControl(PunicaElement) {
  static properties = {
    // A name written on the element the usual way names the control too; `label` wins.
    ariaLabel: { attribute: 'aria-label', reflect: false },
    checked: { type: Boolean },
    indeterminate: { type: Boolean },
    value: { default: 'on' },
    label: {},
    /** Read after the name by assistive technology; a punica-field around the control sets it. */
    description: {},
    color: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <label part="base" class="base">
      <input part="input" type="checkbox" />
      <span part="control" class="control">${icons.check}${icons.minus}</span>
      <span part="label" class="label" hidden><slot></slot></span>
    </label>
  `;

  #input = this.$('input');
  #default = { checked: false, indeterminate: false };
  /** Toggled by the user, or reported invalid. */
  #touched = false;

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('change', () => {
      this.#touched = true;
      this.checked = input.checked;
      this.indeterminate = false;
      this.emit('change', { checked: this.checked, value: this.value });
    });
    this.addEventListener('invalid', () => {
      this.#touched = true;
      this.requestUpdate();
    });
    const slot = this.$('slot');
    slot.addEventListener('slotchange', () => {
      const filled = slot
        .assignedNodes()
        .some((n) => n.nodeType === 1 || n.textContent.trim());
      this.$('.label').hidden = !filled;
    });
    // A <label for> outside clicks the host itself; hand it to the box.
    this.addEventListener('click', (event) => {
      if (event.composedPath()[0] === this && !this.isDisabled) input.click();
    });
  }

  update() {
    const input = this.#input;
    input.checked = this.checked;
    input.indeterminate = this.indeterminate;
    input.required = this.required;
    input.disabled = this.isDisabled;
    const name = this.#name();
    if (name) input.setAttribute('aria-label', name);
    else input.removeAttribute('aria-label');

    this.toggleState('checked', this.checked);
    this.toggleState('indeterminate', this.indeterminate);
    this.setFormValue(
      this.checked ? this.value ?? 'on' : null,
      String(this.checked)
    );
    this.setValidity(flagsOf(input.validity), input.validationMessage, input);
    if (this.#touched && !this.validity.valid)
      input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    if (this.description)
      input.setAttribute('aria-description', this.description);
    else input.removeAttribute('aria-description');
  }

  firstUpdated() {
    this.#default = {
      checked: this.checked,
      indeterminate: this.indeterminate
    };
  }

  formReset() {
    this.#touched = false;
    this.checked = this.#default.checked;
    this.indeterminate = this.#default.indeterminate;
  }

  formRestore(state) {
    this.checked = state === 'true';
  }

  #name() {
    if (this.label) return this.label;
    if (this.ariaLabel) return this.ariaLabel;
    const text = [...this.labels]
      .map((l) => l.textContent.trim())
      .filter(Boolean);
    return text.length ? text.join(' ') : null;
  }

  /** Moves focus to the checkbox. */
  focus(options) {
    this.#input.focus(options);
  }

  /** Toggles the checkbox the way a user would, firing `punica-change`. */
  click() {
    this.#input.click();
  }
}

define('punica-checkbox', PunicaCheckbox);
