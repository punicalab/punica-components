import { PunicaElement, define } from '../../core/element.js';
import styles from './menuRadioGroup.css';

/**
 * A set of `punica-menu-radio-item` of which one is chosen.
 *
 * @element punica-menu-radio-group
 *
 * @attr {string} value - Value of the chosen item.
 * @attr {string} label - Accessible name, shown above the items.
 *
 * @slot - The radio items.
 *
 * @fires {{ value: string }} punica-change - The user chose another item. `detail` is `{ value }`.
 *
 * @csspart label - The visible label.
 */
export class PunicaMenuRadioGroup extends PunicaElement {
  static properties = {
    label: {},
    value: {}
  };

  static styles = styles;
  static template = `<div part="label" class="label" aria-hidden="true"></div><slot></slot>`;

  constructor() {
    super();
    this.$('slot').addEventListener('slotchange', () => this.update());
  }

  get #radios() {
    return /** @type {any[]} */ ([...this.querySelectorAll('punica-menu-radio-item')]);
  }

  /**
   * Chooses an item, as a click on it does.
   * @param {HTMLElement & { value: string | null }} item
   */
  select(item) {
    if (item.value === this.value) return;
    this.value = item.value;
    this.emit('change', { value: this.value });
  }

  connected() {
    this.internals.role = 'group';
  }

  update() {
    this.$('.label').textContent = this.label ?? '';
    this.internals.ariaLabel = this.label || null;
    const radios = this.#radios;
    // With no value yet, an item marked `checked` in the markup sets it.
    if (this.value == null) {
      const checked = radios.find((radio) => radio.hasAttribute('checked'));
      if (checked?.getAttribute('value') != null) this.value = checked.getAttribute('value');
    }
    if (this.value == null) return;
    for (const radio of radios) {
      const on = radio.getAttribute('value') === this.value;
      if (radio.hasAttribute('checked') !== on) {
        if ('checked' in radio) radio.checked = on;
        else radio.toggleAttribute('checked', on);
      }
    }
  }
}

define('punica-menu-radio-group', PunicaMenuRadioGroup);
