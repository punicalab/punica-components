import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './listboxItem.css';

/**
 * One option of a `punica-listbox`.
 *
 * @element punica-listbox-item
 *
 * @attr {string} value - The value the option stands for; its text when absent.
 * @attr {boolean} selected - The option is selected. In markup it marks a default selection; afterwards `punica-listbox` sets it from its value.
 * @attr {boolean} disabled - The option cannot be focused or selected.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 * @slot end - Content after the label.
 *
 * @csspart base - The row.
 * @csspart label - The wrapper around the default slot.
 * @csspart check - The mark shown on a selected option.
 *
 * @cssprop --punica-listbox-item-padding - Padding of the option.
 * @cssprop --punica-listbox-item-hover-background - Background under the pointer.
 * @cssprop --punica-listbox-item-selected-background - Background of a selected option.
 *
 * @cssstate selected - The option is selected.
 */
export class PunicaListboxItem extends PunicaElement {
  static properties = {
    value: {},
    selected: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <slot name="start"></slot>
      <span part="label" class="label"><slot></slot></span>
      <slot name="end"></slot>
      <span part="check" class="check">${icons.check}</span>
    </div>
  `;

  constructor() {
    super();
    this.internals.role = 'option';
  }

  update(changed) {
    this.internals.ariaSelected = String(this.selected);
    this.internals.ariaDisabled = this.disabled ? 'true' : null;
    this.toggleState('selected', this.selected);
    if (changed.has('value') || changed.has('disabled')) {
      /** @type {any} */ (this.parentElement)?.requestUpdate?.();
    }
  }
}

define('punica-listbox-item', PunicaListboxItem);
