import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './option.css';

/**
 * One row of a select, an autocomplete or a tokenizer's suggestions.
 *
 * It is a dumb row: the parent decides what is selected and which row the
 * keyboard is on, and listens for the click itself.
 *
 * @element punica-option
 *
 * @attr {string} value - What the parent submits for this row; its text when absent.
 * @attr {string} label - Text used for display and filtering; the row's text content when absent.
 * @attr {boolean} disabled - The row cannot be picked.
 * @attr {boolean} selected - The row is part of the value. In markup, the default selection.
 *
 * @prop {boolean} active - The keyboard is on this row. Set by the parent.
 *
 * @slot - The row's content.
 * @slot start - Content before the label, an icon.
 * @slot end - Content after the label.
 *
 * @csspart label - The wrapper around the default slot.
 * @csspart check - The mark shown on a selected row.
 *
 * @cssprop --punica-option-padding - Padding of the row.
 * @cssprop --punica-option-active-background - Background of the row the keyboard or pointer is on.
 * @cssprop --punica-option-selected-background - Background of a selected row.
 *
 * @cssstate active - The keyboard is on this row.
 */
export class PunicaOption extends PunicaElement {
  static properties = {
    value: {},
    label: {},
    disabled: { type: Boolean },
    selected: { type: Boolean },
    active: { type: Boolean, attribute: false }
  };

  static styles = styles;
  static template = `
    <slot name="start"></slot>
    <span part="label" class="label"><slot><span class="fallback"></span></slot></span>
    <slot name="end"></slot>
    <span part="check" class="check">${icons.check}</span>
  `;

  #fallback = this.$('.fallback');

  /** The text shown for this row: `label`, else its text content. */
  get text() {
    return this.label ?? this.textContent.trim().replace(/\s+/g, ' ');
  }

  /** The value this row stands for: `value`, else its text. */
  get optionValue() {
    return this.value ?? this.text;
  }

  update() {
    const internals = this.internals;
    internals.role = 'option';
    internals.ariaSelected = String(this.selected);
    internals.ariaDisabled = this.disabled ? 'true' : null;
    this.toggleState('active', this.active);
    this.#fallback.textContent = this.label ?? '';
  }
}

define('punica-option', PunicaOption);
