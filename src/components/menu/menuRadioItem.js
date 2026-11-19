import { define } from '../../core/element.js';
import { PunicaMenuItem } from './menuItem.js';
import itemStyles from './menuItem.css';
import styles from './menuRadioItem.css';

/**
 * One of several exclusive options in a `punica-menu-radio-group`.
 *
 * @element punica-menu-radio-item
 *
 * @attr {string} value - The value the group takes when this item is chosen.
 * @attr {boolean} checked - This is the chosen option; the group keeps it in line with its `value`.
 * @attr {boolean} disabled - Cannot be chosen and is skipped by the keyboard.
 *
 * @slot - The label.
 * @slot start - Content before the label.
 * @slot end - Content after the label, a keyboard shortcut.
 *
 * @csspart indicator - The dot.
 * @csspart label - The wrapper around the label.
 *
 * @cssprop --punica-menu-radio-item-indicator-color - Colour of the dot.
 *
 * @cssstate checked - This is the chosen option.
 */
export class PunicaMenuRadioItem extends PunicaMenuItem {
  static properties = {
    checked: { type: Boolean }
  };

  static styles = [itemStyles, styles];
  static template = `
    <span part="indicator" class="indicator" aria-hidden="true"></span>
    <slot name="start"></slot>
    <span part="label" class="label"><slot></slot></span>
    <slot name="end"></slot>
  `;

  static role = 'menuitemradio';

  /** Chooses this option, as a click on the item does. */
  activate() {
    const group = /** @type {any} */ (this.closest('punica-menu-radio-group'));
    if (group && typeof group.select === 'function') group.select(this);
    else this.checked = true;
  }

  update() {
    super.update();
    this.internals.ariaChecked = String(this.checked);
    this.toggleState('checked', this.checked);
  }
}

define('punica-menu-radio-item', PunicaMenuRadioItem);
