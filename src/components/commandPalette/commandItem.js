import { PunicaElement, define } from '../../core/element.js';
import styles from './commandItem.css';

/**
 * One command of a `punica-command-palette`.
 *
 * @element punica-command-item
 *
 * @attr {string} value - Reported in `punica-select`; the item's text when absent.
 * @attr {string} keywords - More words the item is found by, not shown.
 * @attr {boolean} disabled - Cannot be chosen and is skipped by the keyboard.
 *
 * @prop {boolean} active - The palette's active option; set by the palette.
 * @prop {boolean} filteredOut - Hidden because it does not match the query; set by the palette.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 * @slot shortcut - The command's keyboard shortcut.
 *
 * @csspart label - The wrapper around the label.
 *
 * @cssprop --punica-command-item-radius - Corner radius.
 * @cssprop --punica-command-item-padding - Padding.
 * @cssprop --punica-command-item-highlight - Background of the active item.
 *
 * @cssstate active - The item Enter would choose.
 * @cssstate filtered-out - The item does not match the query.
 */
export class PunicaCommandItem extends PunicaElement {
  static properties = {
    value: {},
    keywords: {},
    disabled: { type: Boolean },
    active: { type: Boolean, attribute: false },
    filteredOut: { type: Boolean, attribute: false }
  };

  static styles = styles;
  static template = `
    <slot name="start"></slot>
    <span part="label" class="label"><slot></slot></span>
    <slot name="shortcut"></slot>
  `;

  connected() {
    this.internals.role = 'option';
  }

  update() {
    this.internals.ariaDisabled = this.disabled ? 'true' : null;
    this.internals.ariaSelected = String(this.active);
    this.toggleState('active', this.active);
    this.toggleState('filtered-out', this.filteredOut);
  }
}

define('punica-command-item', PunicaCommandItem);
