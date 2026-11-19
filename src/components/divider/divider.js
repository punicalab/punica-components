import { PunicaElement, define } from '../../core/element.js';
import styles from './divider.css';

/**
 * A line between two groups of content, with an optional label on it.
 *
 * @element punica-divider
 *
 * @attr {'horizontal' | 'vertical'} orientation - Direction of the line, `horizontal` by default.
 * @attr {boolean} decorative - The line is ornament: `role=presentation` in place of `separator`.
 * @attr {boolean} inset - Indents the line from both inline edges.
 *
 * @slot - A label drawn in the middle of the line.
 *
 * @csspart line - Each half of the line.
 * @csspart label - The wrapper around the label.
 *
 * @cssprop --punica-divider-color - Colour of the line.
 * @cssprop --punica-divider-width - Thickness of the line.
 * @cssprop --punica-divider-spacing - Margin on the axis the line separates.
 * @cssprop --punica-divider-inset - Indent of an inset line.
 *
 * @cssstate labelled - The default slot has content.
 */
export class PunicaDivider extends PunicaElement {
  static properties = {
    orientation: {},
    decorative: { type: Boolean },
    inset: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <span part="line" class="line"></span>
    <span part="label" class="label"><slot></slot></span>
    <span part="line" class="line"></span>
  `;

  #slot = this.$('slot');

  constructor() {
    super();
    this.#slot.addEventListener('slotchange', () => this.#label());
  }

  update() {
    const internals = this.internals;
    internals.role = this.decorative ? 'presentation' : 'separator';
    internals.ariaOrientation = this.decorative ? null : this.orientation === 'vertical' ? 'vertical' : 'horizontal';
    this.#label();
  }

  #label() {
    const text = this.#slot
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent)
      .join('')
      .trim();
    const labelled = text !== '' || this.#slot.assignedElements({ flatten: true }).length > 0;
    this.toggleState('labelled', labelled);
    this.internals.ariaLabel = labelled && text && !this.decorative ? text : null;
  }
}

define('punica-divider', PunicaDivider);
