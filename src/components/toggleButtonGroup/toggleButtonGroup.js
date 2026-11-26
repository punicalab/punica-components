import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { nextIndex, setRovingTabindex, isRtl } from '../../core/a11y.js';
import '../toggleButton/toggleButton.js';
import styles from './toggleButtonGroup.css';

/** The browser's own "select one of these" message, in the user's language. */
const missingMessage = () => {
  const probe = document.createElement('input');
  probe.type = 'radio';
  probe.name = 'punica-probe';
  probe.required = true;
  return probe.validationMessage;
};

const valueOf = (button) => button.value ?? button.textContent.trim();

/**
 * A row of `<punica-toggle-button>`s that share one value.
 *
 * One button is in the tab order; arrow keys, Home and End move between
 * them and Space or Enter presses. Without `multiple` at most one button is
 * pressed and `value` is its value, or empty. With `multiple`, `value` is
 * the pressed values separated by spaces, and each is submitted as its own
 * entry under `name`.
 *
 * @element punica-toggle-button-group
 *
 * @attr {string} value - Default value. The property holds the current value.
 * @attr {boolean} multiple - More than one button may be pressed.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name of the group.
 * @attr {'horizontal' | 'vertical'} orientation - Layout and arrow-key axis, `horizontal` by default.
 * @attr {boolean} disabled - Disables every button and submits nothing.
 * @attr {boolean} required - A button has to be pressed before the form submits.
 * @attr {boolean} full-width - Fills its container; the buttons share the space.
 *
 * @prop {string[]} values - The pressed values as a list.
 *
 * @slot - The `<punica-toggle-button>` elements.
 *
 * @fires {{ value: string | null, values: string[] }} punica-change - The user pressed or released a button; `detail: { value, values }`.
 *
 * @cssstate invalid - Required and nothing is pressed.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaToggleButtonGroup extends FormControl(PunicaElement) {
  static properties = {
    value: { reflect: false, default: '' },
    multiple: { type: Boolean },
    label: {},
    orientation: { default: 'horizontal' },
    fullWidth: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  /** @type {string | null} */
  #initial = null;
  /** @type {HTMLElement | null} */
  #active = null;
  #adopted = false;

  constructor() {
    super();
    this.$('slot').addEventListener('slotchange', () => this.#adopt());
    this.addEventListener('punica-change', (event) => this.#onChildChange(event));
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('focusin', (event) => {
      const button = this.#buttons().find((b) => b === event.target);
      if (button) {
        this.#active = button;
        this.#rove();
      }
    });
  }

  /** The pressed values as a list. */
  get values() {
    const value = this.value ?? '';
    if (!value) return [];
    return this.multiple ? value.split(/\s+/).filter(Boolean) : [value];
  }
  set values(list) {
    this.value = [...(list || [])].join(' ');
  }

  update() {
    const internals = this.internals;
    internals.role = 'toolbar';
    internals.ariaLabel = this.label || null;
    internals.ariaOrientation = this.orientation === 'vertical' ? 'vertical' : 'horizontal';
    internals.ariaDisabled = this.isDisabled ? 'true' : null;

    const values = this.values;
    const buttons = this.#buttons();
    for (const button of buttons) {
      // Until the buttons were read once, their own `pressed` stands.
      if (this.#adopted) button.pressed = values.includes(valueOf(button));
      button.requestUpdate?.();
    }
    this.#rove();

    if (this.multiple && this.name) {
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.setFormValue(values.length ? data : null, this.value ?? '');
    } else {
      this.setFormValue(values.length ? values[0] : null, this.value ?? '');
    }
    const missing = this.required && !values.length;
    this.setValidity(
      missing ? { valueMissing: true } : {},
      missing ? missingMessage() : '',
      buttons[0]
    );
  }

  formReset() {
    this.value = this.getAttribute('value') ?? this.#initial ?? '';
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state;
  }

  /** Moves focus to the button that is in the tab order. */
  focus(options) {
    const buttons = this.#enabled();
    (buttons.find((b) => b.tabIndex === 0) || buttons[0])?.focus(options);
  }

  /** @returns {any[]} */
  #buttons() {
    return this.$('slot')
      .assignedElements()
      .filter((el) => el.localName === 'punica-toggle-button');
  }

  #enabled() {
    return this.isDisabled ? [] : this.#buttons().filter((b) => !b.disabled);
  }

  #rove() {
    const buttons = this.#enabled();
    const active =
      (this.#active && buttons.includes(this.#active) && this.#active) ||
      buttons.find((b) => b.pressed) ||
      null;
    setRovingTabindex(buttons, active);
  }

  /** Buttons arrived: with no value of its own the group takes theirs. */
  #adopt() {
    if (!this.value) {
      const pressed = this.#buttons().filter((b) => b.pressed).map(valueOf);
      const value = (this.multiple ? pressed : pressed.slice(0, 1)).join(' ');
      this.#initial ??= value;
      if (value) this.value = value;
    }
    this.#adopted = true;
    if (this.isConnected) this.update(new Map());
  }

  #onChildChange(event) {
    const target = event.target;
    if (target === this || !this.#buttons().includes(target)) return;
    // The group speaks for its buttons: one change event, from the group.
    event.stopImmediatePropagation();
    let pressed = this.#buttons().filter((b) => b.pressed);
    if (!this.multiple) pressed = pressed.filter((b) => b === target);
    this.value = pressed.map(valueOf).join(' ');
    this.update(new Map());
    this.emit('change', { value: this.value, values: this.values });
  }

  #onKeydown(event) {
    const buttons = this.#enabled();
    const current = buttons.findIndex((b) => b.matches(':focus'));
    if (current < 0) return;
    const index = nextIndex(event, buttons.length, current, {
      orientation: this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      rtl: isRtl(this)
    });
    if (index < 0) return;
    event.preventDefault();
    buttons[index].focus();
  }
}

define('punica-toggle-button-group', PunicaToggleButtonGroup);
