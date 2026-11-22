import { PunicaElement, define } from '../../core/element.js';
import styles from './emptyState.css';

/**
 * What a place shows while it has nothing to show: what is missing and what
 * to do about it.
 *
 * @element punica-empty-state
 *
 * @attr {string} heading - The one line that says what is missing.
 * @attr {number} heading-level - Rank of the heading in the outline, 1 to 6; `3` by default.
 * @attr {'panel' | 'section'} size - `panel` fills and centres in a whole panel; `section` is compact, for one part of a view. `panel` by default.
 *
 * @slot - A sentence that explains or tells what to do.
 * @slot icon - A picture above the heading.
 * @slot actions - Buttons under the description.
 *
 * @csspart icon - The wrapper around the icon.
 * @csspart heading - The heading.
 * @csspart description - The wrapper around the description.
 * @csspart actions - The wrapper around the actions.
 *
 * @cssprop --punica-empty-state-padding - Padding.
 * @cssprop --punica-empty-state-gap - Space between the parts.
 * @cssprop --punica-empty-state-max-width - Largest inline size of the text.
 * @cssprop --punica-empty-state-icon-size - Size of the icon.
 */
export class PunicaEmptyState extends PunicaElement {
  static properties = {
    heading: {},
    size: {},
    headingLevel: { type: Number, default: 3 }
  };

  static styles = styles;
  static template = `
    <div part="icon" class="icon"><slot name="icon"></slot></div>
    <div part="heading" class="heading" role="heading" aria-level="3" hidden></div>
    <div part="description" class="description"><slot></slot></div>
    <div part="actions" class="actions"><slot name="actions"></slot></div>
  `;

  #heading = this.$('.heading');

  constructor() {
    super();
    // A part with nothing in its slot takes no place: it would add the gap around it.
    for (const name of ['icon', 'description', 'actions']) {
      const slot = this.$(`.${name} slot`);
      slot.addEventListener('slotchange', () => this.#fill(name, slot));
    }
  }

  connected() {
    for (const name of ['icon', 'description', 'actions']) this.#fill(name, this.$(`.${name} slot`));
  }

  /** Hides a part whose slot holds nothing but white space. */
  #fill(name, slot) {
    const filled = slot.assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
    this.$(`.${name}`).hidden = !filled;
  }

  update() {
    const level = Number.isInteger(this.headingLevel) && this.headingLevel >= 1 && this.headingLevel <= 6 ? this.headingLevel : 3;
    this.#heading.textContent = this.heading ?? '';
    this.#heading.hidden = !this.heading;
    this.#heading.setAttribute('aria-level', String(level));
  }
}

define('punica-empty-state', PunicaEmptyState);
