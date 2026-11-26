import { define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { PunicaMenuItem } from './menuItem.js';
import itemStyles from './menuItem.css';
import styles from './menuCheckboxItem.css';

/**
 * A menu item that switches an option on and off.
 *
 * @element punica-menu-checkbox-item
 *
 * @attr {boolean} checked - The option is on.
 * @attr {string} value - Reported in `punica-select` and `punica-change`; the item's text when absent.
 * @attr {boolean} disabled - Cannot be chosen and is skipped by the keyboard.
 *
 * @slot - The label.
 * @slot start - Content before the label.
 * @slot end - Content after the label, a keyboard shortcut.
 *
 * @fires {{ value: string, checked: boolean }} punica-change - The user switched the option. `detail` is `{ value, checked }`.
 *
 * @csspart indicator - The check mark.
 * @csspart label - The wrapper around the label.
 *
 * @cssprop --punica-menu-checkbox-item-indicator-color - Colour of the check mark.
 *
 * @cssstate checked - The option is on.
 */
export class PunicaMenuCheckboxItem extends PunicaMenuItem {
  static properties = {
    checked: { type: Boolean }
  };

  static styles = [itemStyles, styles];
  static template = `
    <span part="indicator" class="indicator" aria-hidden="true">${icons.check}</span>
    <slot name="start"></slot>
    <span part="label" class="label"><slot></slot></span>
    <slot name="end"></slot>
  `;

  static role = 'menuitemcheckbox';

  /** Switches the option, as a click on the item does. */
  activate() {
    this.checked = !this.checked;
    this.emit('change', { value: this.value ?? this.labelText, checked: this.checked });
  }

  update() {
    super.update();
    this.internals.ariaChecked = String(this.checked);
    this.toggleState('checked', this.checked);
  }
}

define('punica-menu-checkbox-item', PunicaMenuCheckboxItem);
