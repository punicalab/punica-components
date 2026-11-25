import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import '../checkbox/checkbox.js';
import styles from './checkboxGroup.css';

/** The browser's own "choose one of these" message, in the user's language. */
const missingMessage = () => {
  const probe = document.createElement('input');
  probe.type = 'radio';
  probe.name = 'punica-probe';
  probe.required = true;
  return probe.validationMessage || ' ';
};

/** @param {any} box a checkbox that may not be upgraded yet */
const valueOf = (box) => box.value ?? box.getAttribute('value') ?? 'on';

/**
 * A set of `<punica-checkbox>`es under one name, of which any number is
 * ticked. The group is the form control: it submits one entry per ticked
 * box under its own `name`, validates `required`, `min` and `max`, and
 * resets. The boxes inside carry no `name` of their own; a box with a name
 * would submit itself as well.
 *
 * Each box stays its own tab stop and toggles with Space, as native
 * checkboxes do.
 *
 * @element punica-checkbox-group
 *
 * @attr {string} value - Default value: the ticked boxes' values, space-separated. Without it, the boxes ticked in the markup are the default.
 * @attr {string} name - Name each ticked value is submitted under.
 * @attr {string} label - Accessible name of the group, shown as its legend.
 * @attr {boolean} label-hidden - The legend is not drawn; `label` still names the group. Implied inside a `punica-field`, which draws its own label.
 * @attr {'horizontal' | 'vertical'} orientation - Layout, `vertical` by default.
 * @attr {boolean} disabled - Disables every box and submits nothing.
 * @attr {boolean} required - At least one box has to be ticked before the form submits.
 * @attr {number} min - Fewest boxes that may be ticked, when any is.
 * @attr {number} max - Most boxes that may be ticked.
 * @attr {string} label-too-few - Message while fewer than `min` are ticked; `{min}` is replaced. `Choose at least {min}.` by default.
 * @attr {string} label-too-many - Message while more than `max` are ticked; `{max}` is replaced. `Choose no more than {max}.` by default.
 *
 * @prop {string[]} value - The ticked boxes' values, in document order.
 * @prop {any[]} items - The `punica-checkbox` children, in order.
 *
 * @slot - The `<punica-checkbox>` elements.
 * @slot label - Rich legend content, in place of `label`.
 *
 * @fires {{ value: string[] }} punica-change - The user ticked or cleared a box; `detail: { value }` with the new array. The box's own `punica-change` does not travel past the group.
 *
 * @csspart label - The legend.
 * @csspart items - The wrapper around the boxes.
 *
 * @cssprop --punica-checkbox-group-gap - Space between the boxes.
 * @cssprop --punica-checkbox-group-label-color - Colour of the legend.
 *
 * @cssstate invalid - A constraint is broken.
 * @cssstate valid - Every constraint is met.
 * @cssstate disabled - Disabled by itself or by a fieldset around it.
 */
export class PunicaCheckboxGroup extends FormControl(PunicaElement) {
  static properties = {
    defaultValue: { attribute: 'value', reflect: false },
    value: { type: Array, attribute: false },
    label: {},
    labelHidden: { type: Boolean },
    orientation: { default: 'vertical' },
    min: { type: Number },
    max: { type: Number },
    labelTooFew: { default: 'Choose at least {min}.' },
    labelTooMany: { default: 'Choose no more than {max}.' }
  };

  static styles = styles;
  static template = `
    <div part="label" class="label" hidden><slot name="label"><span class="label-text"></span></slot></div>
    <div part="items" class="items"><slot></slot></div>
  `;

  #slot = this.$('slot:not([name])');
  #labelSlot = this.$('slot[name="label"]');
  /** Boxes the group disabled, to be given back when it is enabled. */
  #disabledByGroup = new WeakSet();
  /** Boxes ticked in the markup when first seen. */
  #defaults = new WeakSet();
  #seen = new WeakSet();
  #initialised = false;

  constructor() {
    super();
    this.#slot.addEventListener('slotchange', () => this.#sync());
    this.#labelSlot.addEventListener('slotchange', () => this.requestUpdate());
    this.addEventListener('punica-change', (event) => {
      const box = /** @type {any} */ (event.target);
      if (box === this || !this.items.includes(box)) return;
      // The group speaks for its boxes, to its own listeners too.
      event.stopImmediatePropagation();
      this.value = this.items.filter((item) => item.checked).map(valueOf);
      this.update(new Map());
      this.emit('change', { value: this.value });
    });
  }

  /** @returns {any[]} */
  get items() {
    return this.#slot.assignedElements({ flatten: true }).filter((el) => el.localName === 'punica-checkbox');
  }

  connected() {
    // Children inserted with the element are upgraded after it.
    queueMicrotask(() => this.isConnected && this.#sync());
  }

  /** @returns {string[]} */
  #values() {
    return Array.isArray(this.value) ? this.value.map(String) : [];
  }

  #defaultValue() {
    if (this.defaultValue != null) return this.defaultValue.split(/\s+/).filter(Boolean);
    return this.items.filter((box) => this.#defaults.has(box)).map(valueOf);
  }

  #sync() {
    let fresh = false;
    for (const box of this.items) {
      if (this.#seen.has(box)) continue;
      this.#seen.add(box);
      fresh = true;
      if (box.hasAttribute('checked')) this.#defaults.add(box);
    }
    if (!this.#initialised || (fresh && this.value == null)) {
      this.#initialised = true;
      if (this.value == null) this.value = this.#defaultValue();
    }
    if (this.isConnected) this.update(new Map());
  }

  update(changed) {
    if (changed.has('defaultValue') && this.#initialised && changed.get('defaultValue') !== undefined) {
      this.value = this.#defaultValue();
    }
    const internals = this.internals;
    const disabled = this.isDisabled;
    internals.role = 'group';
    internals.ariaLabel = this.label || null;
    internals.ariaRequired = this.required ? 'true' : null;
    internals.ariaDisabled = disabled ? 'true' : null;
    this.toggleState('disabled', disabled);

    const labelled = this.#labelSlot.assignedElements();
    if ('ariaLabelledByElements' in internals) {
      /** @type {any} */ (internals).ariaLabelledByElements = labelled.length && !this.label ? labelled : null;
    }
    this.$('.label-text').textContent = this.label ?? '';
    const inField = this.parentElement?.localName === 'punica-field';
    this.$('.label').hidden = this.labelHidden || inField || (!this.label && !labelled.length);

    const items = this.items;
    const values = this.#values();
    for (const box of items) {
      if (this.#initialised) box.checked = values.includes(valueOf(box));
      if (disabled && !box.disabled) {
        box.disabled = true;
        this.#disabledByGroup.add(box);
      } else if (!disabled && this.#disabledByGroup.has(box)) {
        this.#disabledByGroup.delete(box);
        box.disabled = false;
      }
    }

    if (this.name && values.length) {
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.setFormValue(data);
    } else {
      this.setFormValue(null);
    }

    const count = values.length;
    // The browser focuses the anchor of an invalid control: the first box's
    // own input, since the box's host is not focusable itself.
    const first = items.find((box) => !box.disabled);
    const anchor = first?.shadowRoot?.querySelector('input') || first || undefined;
    const format = (n) => new Intl.NumberFormat(this.closest('[lang]')?.lang || navigator.language).format(n);
    if (this.required && count === 0) {
      this.setValidity({ valueMissing: true }, missingMessage(), anchor);
    } else if (this.min != null && count > 0 && count < this.min) {
      this.setValidity({ rangeUnderflow: true }, this.labelTooFew.replace('{min}', format(this.min)), anchor);
    } else if (this.max != null && count > this.max) {
      this.setValidity({ rangeOverflow: true }, this.labelTooMany.replace('{max}', format(this.max)), anchor);
    } else {
      this.setValidity({});
    }
  }

  formReset() {
    this.value = this.#defaultValue();
  }

  formRestore(state) {
    if (state instanceof FormData) this.value = state.getAll(this.name).map(String);
  }

  /** Moves focus to the first box that can take it. */
  focus(options) {
    this.items.find((box) => !box.disabled)?.focus(options);
  }
}

define('punica-checkbox-group', PunicaCheckboxGroup);
