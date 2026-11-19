import { define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { PunicaOption } from '../select/option.js';
import optionStyles from '../select/option.css';
import styles from './complexOption.css';

/**
 * A row of a `punica-complex-selector` with a second line: a
 * `punica-option` that also shows a description, and an icon or avatar in
 * its `start` slot. The parent decides what is selected and which row the
 * keyboard is on.
 *
 * @element punica-complex-option
 *
 * @attr {string} value - What the selector submits for this row; its text when absent.
 * @attr {string} label - Text used for display and filtering; the row's own text when absent.
 * @attr {string} description - Second line under the label; also matched by the search.
 * @attr {boolean} disabled - The row cannot be picked.
 * @attr {boolean} selected - The row is part of the value. In markup, the default selection.
 *
 * @prop {boolean} active - The keyboard is on this row. Set by the parent.
 *
 * @slot - The row's label.
 * @slot start - An icon or an avatar before the label.
 * @slot end - Content after the label.
 * @slot description - Rich second line, in place of `description`.
 *
 * @csspart label - The wrapper around the label and the description.
 * @csspart description - The second line.
 * @csspart check - The mark shown on a selected row.
 *
 * @cssprop --punica-option-padding - Padding of the row.
 * @cssprop --punica-option-active-background - Background of the row the keyboard or pointer is on.
 * @cssprop --punica-option-selected-background - Background of a selected row.
 *
 * @cssstate active - The keyboard is on this row.
 */
export class PunicaComplexOption extends PunicaOption {
  static properties = {
    description: {}
  };

  static styles = [optionStyles, styles];
  static template = `
    <slot name="start"></slot>
    <span part="label" class="label">
      <span class="text"><slot><span class="fallback"></span></slot></span>
      <span part="description" class="description" hidden><slot name="description"><span class="description-text"></span></slot></span>
    </span>
    <slot name="end"></slot>
    <span part="check" class="check">${icons.check}</span>
  `;

  constructor() {
    super();
    this.$('slot[name="description"]').addEventListener('slotchange', () => this.requestUpdate());
  }

  /** The text shown for this row: `label`, else its own text, without the description. */
  get text() {
    if (this.label != null) return this.label;
    return [...this.childNodes]
      .filter((n) => !(n.nodeType === 1 && /** @type {Element} */ (n).hasAttribute('slot')))
      .map((n) => n.textContent)
      .join('')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /** The second line as text, for filtering. */
  get descriptionText() {
    if (this.description != null) return this.description;
    const node = this.querySelector(':scope > [slot="description"]');
    return node ? node.textContent.trim() : '';
  }

  update(changed) {
    super.update(changed);
    this.$('.description-text').textContent = this.description ?? '';
    this.$('.description').hidden = !this.descriptionText;
  }
}

define('punica-complex-option', PunicaComplexOption);
