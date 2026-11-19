import { PunicaElement, define } from '../../core/element.js';
import styles from './badge.css';

/**
 * A count or a dot at the corner of what it wraps: unread messages on an
 * icon, a state on an avatar.
 *
 * @element punica-badge
 *
 * @attr {string} content - What the badge says, usually a count. A number above `max` reads `max+`.
 * @attr {number} max - The largest count shown as it is, `99` by default.
 * @attr {boolean} dot - A small disc with no text.
 * @attr {boolean} show-zero - Shows a count of 0, which is hidden otherwise.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Colour of the badge, `primary` by default.
 * @attr {'block-start-inline-end' | 'block-start-inline-start' | 'block-end-inline-end' | 'block-end-inline-start'} placement - The corner, `block-start-inline-end` by default.
 * @attr {string} label - What assistive technology reads in place of the bare count, `3 unread messages`.
 *
 * @slot - What the badge is attached to. With nothing slotted the badge sits in the text line.
 *
 * @csspart badge - The count or the dot.
 *
 * @cssprop --punica-badge-background - Background of the badge.
 * @cssprop --punica-badge-color - Text colour of the badge.
 * @cssprop --punica-badge-size - Height of a count badge.
 * @cssprop --punica-badge-dot-size - Diameter of a dot.
 *
 * @cssstate standalone - Nothing is slotted.
 */
export class PunicaBadge extends PunicaElement {
  static properties = {
    content: {},
    color: {},
    placement: {},
    label: {},
    max: { type: Number, default: 99 },
    dot: { type: Boolean },
    showZero: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot><span part="badge" class="badge" hidden><span class="count"></span><span class="label"></span></span>`;

  #slot = this.$('slot');
  #badge = this.$('.badge');
  #count = this.$('.count');
  #label = this.$('.label');

  constructor() {
    super();
    this.#slot.addEventListener('slotchange', () => this.#standalone());
  }

  update() {
    const raw = this.content?.trim() ?? '';
    const count = raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : null;
    const zero = count === 0 && !this.showZero;

    let text = '';
    if (!this.dot && !zero) {
      if (count === null) text = raw;
      else {
        const language = this.closest('[lang]')?.lang || navigator.language;
        const format = new Intl.NumberFormat(language);
        const max = this.max >= 0 ? this.max : 99;
        text = count > max ? `${format.format(max)}+` : format.format(count);
      }
    }
    const shown = this.dot ? !zero : text !== '';

    this.#badge.hidden = !shown;
    this.#count.textContent = text;
    // With a label the bare count is for the eye only.
    this.#label.textContent = shown ? this.label ?? '' : '';
    if (this.label) this.#count.setAttribute('aria-hidden', 'true');
    else this.#count.removeAttribute('aria-hidden');
    this.#standalone();
  }

  #standalone() {
    const filled = this.#slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim() !== '');
    this.toggleState('standalone', !filled);
  }
}

define('punica-badge', PunicaBadge);
