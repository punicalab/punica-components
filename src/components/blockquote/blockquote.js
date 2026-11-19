import { PunicaElement, define } from '../../core/element.js';
import styles from './blockquote.css';

/**
 * A quotation set apart from the text around it: a testimonial, an excerpt,
 * a line from an interview.
 *
 * It is a native `<blockquote>` inside a `<figure>`; the `attribution` slot is
 * the figure's `<figcaption>`, so the source is tied to the quote without
 * becoming part of it. A rule on the inline-start edge marks it, on the
 * right in right-to-left text. For a callout or a note use `punica-banner`.
 *
 * @element punica-blockquote
 *
 * @attr {string} cite - Address of the source, set as the blockquote's `cite`.
 * @attr {'default' | 'emphasis'} variant - `emphasis` sets the quote larger with an accent rule, for a pull quote or a testimonial.
 *
 * @slot - The quotation.
 * @slot attribution - Who said it and where: a name, a `<cite>` with the work's title.
 *
 * @csspart base - The figure.
 * @csspart quote - The native blockquote.
 * @csspart attribution - The figcaption.
 *
 * @cssprop --punica-blockquote-rule-width - Width of the rule.
 * @cssprop --punica-blockquote-rule-color - Colour of the rule.
 * @cssprop --punica-blockquote-padding - Padding between the rule and the text.
 * @cssprop --punica-blockquote-color - Colour of the quotation.
 * @cssprop --punica-blockquote-font-size - Type size of the quotation.
 *
 * @cssstate attributed - The attribution slot has content.
 */
export class PunicaBlockquote extends PunicaElement {
  static properties = {
    cite: {},
    variant: {}
  };

  static styles = styles;
  static template = `
    <figure part="base" class="base">
      <blockquote part="quote" class="quote"><slot></slot></blockquote>
      <figcaption part="attribution" class="attribution" hidden><slot name="attribution"></slot></figcaption>
    </figure>
  `;

  #quote = this.$('blockquote');
  #caption = this.$('figcaption');
  #attribution = this.$('slot[name="attribution"]');

  constructor() {
    super();
    this.#attribution.addEventListener('slotchange', () => this.#sync());
  }

  update() {
    if (this.cite) this.#quote.setAttribute('cite', this.cite);
    else this.#quote.removeAttribute('cite');
    this.#sync();
  }

  #sync() {
    const has = this.#attribution.assignedNodes({ flatten: true }).some((n) => n.textContent.trim() || n.nodeType === 1);
    this.#caption.hidden = !has;
    this.toggleState('attributed', has);
  }
}

define('punica-blockquote', PunicaBlockquote);
