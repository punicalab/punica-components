import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './accordion.css';

/**
 * One disclosure section: a summary button that shows and hides a region.
 *
 * Put several inside a `punica-accordion-group` to let one close the others.
 *
 * @element punica-accordion
 *
 * @attr {boolean} open - The region is showing.
 * @attr {boolean} disabled - The summary takes no clicks and no focus.
 * @attr {boolean} rounded - Rounded corners.
 * @attr {number} heading-level - Makes the summary a heading of this level (1 to 6) for assistive technology.
 *
 * @slot - The content of the region.
 * @slot summary - The summary, inside the button.
 * @slot start - Content before the summary, an icon.
 * @slot indicator - The expand indicator, a chevron by default.
 * @slot end - Actions beside the summary, outside the button.
 *
 * @fires punica-toggle - The user expanded or collapsed the section. `detail.open` is the new state.
 *
 * @csspart header - The row holding the summary button and the `end` slot.
 * @csspart summary - The native button.
 * @csspart label - The wrapper around the `summary` slot.
 * @csspart indicator - The wrapper around the expand indicator.
 * @csspart region - The animated region.
 * @csspart content - The padded wrapper around the default slot.
 *
 * @cssprop --punica-accordion-radius - Corner radius when `rounded`.
 * @cssprop --punica-accordion-background - Background of the section.
 * @cssprop --punica-accordion-summary-padding - Padding of the summary button.
 * @cssprop --punica-accordion-content-padding - Padding of the content.
 * @cssprop --punica-accordion-duration - Duration of the height animation.
 *
 * @cssstate open - The region is showing.
 */
export class PunicaAccordion extends PunicaElement {
  static properties = {
    open: { type: Boolean },
    disabled: { type: Boolean },
    rounded: { type: Boolean },
    headingLevel: { type: Number }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="header" class="header">
      <div class="heading">
        <button part="summary" id="summary" type="button" aria-expanded="false" aria-controls="region">
          <slot name="start"></slot>
          <span part="label" class="label"><slot name="summary"></slot></span>
          <span part="indicator" class="indicator"><slot name="indicator">${icons.chevronDown}</slot></span>
        </button>
      </div>
      <slot name="end"></slot>
    </div>
    <div part="region" id="region" class="region" role="region" aria-labelledby="summary">
      <div class="clip"><div part="content" class="content"><slot></slot></div></div>
    </div>
  `;

  #button = this.$('button');
  #heading = this.$('.heading');

  constructor() {
    super();
    this.#button.addEventListener('click', () => {
      if (this.disabled) return;
      this.open = !this.open;
      this.emit('toggle', { open: this.open });
    });
  }

  /** Expands the section. Fires nothing. */
  show() {
    this.open = true;
  }

  /** Collapses the section. Fires nothing. */
  hide() {
    this.open = false;
  }

  /** Expands when collapsed and collapses when expanded. Fires nothing. */
  toggle() {
    this.open = !this.open;
  }

  /** Moves focus to the summary button. */
  focus(options) {
    this.#button.focus(options);
  }

  update() {
    this.toggleState('open', this.open);
    this.#button.disabled = this.disabled;
    this.#button.setAttribute('aria-expanded', String(this.open));
    const level = this.headingLevel;
    if (level >= 1 && level <= 6) {
      this.#heading.setAttribute('role', 'heading');
      this.#heading.setAttribute('aria-level', String(Math.round(level)));
    } else {
      this.#heading.removeAttribute('role');
      this.#heading.removeAttribute('aria-level');
    }
  }
}

define('punica-accordion', PunicaAccordion);
