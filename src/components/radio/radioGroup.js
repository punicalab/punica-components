import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { nextIndex, setRovingTabindex, isRtl } from '../../core/a11y.js';
import './radio.js';
import styles from './radioGroup.css';

/** The browser's own "select one of these" message, in the user's language. */
const missingMessage = () => {
  const probe = document.createElement('input');
  probe.type = 'radio';
  probe.name = 'punica-probe';
  probe.required = true;
  return probe.validationMessage;
};

const valueOf = (item) => item.value ?? item.textContent.trim();

/**
 * A set of `<punica-radio>`s of which one is chosen. The group is the form
 * control: it holds `value`, submits it, validates `required` and resets.
 *
 * One radio is in the tab order. Arrow keys, Home and End move focus and
 * choose in one step; Space chooses the focused radio.
 *
 * @element punica-radio-group
 *
 * @attr {string} value - Default value. The property holds the current value.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name of the group.
 * @attr {'horizontal' | 'vertical'} orientation - Layout, `vertical` by default.
 * @attr {boolean} disabled - Disables every radio and submits nothing.
 * @attr {boolean} required - A radio has to be chosen before the form submits.
 *
 * @slot - The `<punica-radio>` elements.
 *
 * @fires punica-change - The user chose another radio; `detail: { value }`.
 *
 * @cssprop --punica-radio-group-gap - Space between the radios.
 *
 * @cssstate invalid - Required and nothing is chosen.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaRadioGroup extends FormControl(PunicaElement) {
  static properties = {
    value: { reflect: false, default: '' },
    label: {},
    orientation: { default: 'vertical' }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  /** Tag of the elements the group chooses between. */
  static itemTag = 'punica-radio';
  /** Boolean property of an item that marks it as the chosen one. */
  static itemFlag = 'checked';

  /** @type {string | null} */
  #initial = null;
  #adopted = false;

  constructor() {
    super();
    this.$('slot').addEventListener('slotchange', () => this.#adopt());
    this.addEventListener('click', (event) => {
      const item = this.#itemOf(event);
      if (item) this.#choose(item);
    });
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
  }

  /**
   * The items of the group, in document order.
   * @returns {any[]}
   */
  get items() {
    const tag = /** @type {typeof PunicaRadioGroup} */ (this.constructor)
      .itemTag;
    return this.$('slot')
      .assignedElements({ flatten: true })
      .filter((el) => el.localName === tag);
  }

  update() {
    const flag = /** @type {typeof PunicaRadioGroup} */ (this.constructor)
      .itemFlag;
    const internals = this.internals;
    internals.role = 'radiogroup';
    internals.ariaLabel = this.label || null;
    internals.ariaOrientation =
      this.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    internals.ariaRequired = this.required ? 'true' : null;
    internals.ariaDisabled = this.isDisabled ? 'true' : null;

    const value = this.value ?? '';
    const items = this.items;
    for (const item of items) {
      // Until the items were read once, their own flag stands.
      // An item whose value is the empty string is a choice like any other ("All").
      if (this.#adopted) item[flag] = valueOf(item) === value;
      item.requestUpdate?.();
    }
    const enabled = this.#enabled();
    for (const item of items)
      if (!enabled.includes(item)) item.removeAttribute('tabindex');
    setRovingTabindex(enabled, enabled.find((item) => item[flag]) || null);

    const chosen = items.find((item) => item[flag]) || null;
    this.setFormValue(chosen ? value : null, value);
    const missing = this.required && !chosen;
    this.setValidity(
      missing ? { valueMissing: true } : {},
      missing ? missingMessage() : '',
      enabled[0]
    );
    this.selectionChanged(chosen);
  }

  /**
   * Runs after every update with the chosen item, for a subclass that draws
   * something for it.
   * @param {HTMLElement | null} item
   */
  // eslint-disable-next-line no-unused-vars
  selectionChanged(item) {}

  formReset() {
    this.value = this.getAttribute('value') ?? this.#initial ?? '';
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state;
  }

  /** Moves focus to the item that is in the tab order. */
  focus(options) {
    const enabled = this.#enabled();
    (enabled.find((item) => item.tabIndex === 0) || enabled[0])?.focus(options);
  }

  #enabled() {
    return this.isDisabled ? [] : this.items.filter((item) => !item.disabled);
  }

  #itemOf(event) {
    const enabled = this.#enabled();
    return event.composedPath().find((node) => enabled.includes(node)) || null;
  }

  /** Items arrived: with no value of its own the group takes theirs. */
  #adopt() {
    const flag = /** @type {typeof PunicaRadioGroup} */ (this.constructor)
      .itemFlag;
    if (!this.value) {
      const chosen = this.items.find((item) => item[flag]);
      const value = chosen ? valueOf(chosen) : '';
      this.#initial ??= value;
      if (value) this.value = value;
    }
    this.#adopted = true;
    if (this.isConnected) this.update(new Map());
  }

  #choose(item) {
    const value = valueOf(item);
    if (value === this.value) return;
    this.value = value;
    this.update(new Map());
    this.emit('change', { value });
  }

  #onKeydown(event) {
    const item = this.#itemOf(event);
    if (!item || event.target !== item) return;
    if (event.key === ' ') {
      event.preventDefault();
      this.#choose(item);
      return;
    }
    const enabled = this.#enabled();
    // Every arrow moves, whatever the layout: the APG radio group pattern.
    const index = nextIndex(event, enabled.length, enabled.indexOf(item), {
      orientation: 'both',
      rtl: isRtl(this)
    });
    if (index < 0) return;
    event.preventDefault();
    enabled[index].focus();
    this.#choose(enabled[index]);
  }
}

define('punica-radio-group', PunicaRadioGroup);
