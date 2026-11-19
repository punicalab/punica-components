import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './topNavMegaMenuCard.css';

/**
 * A promotional card for the `featured` slot of a
 * `punica-top-nav-mega-menu`: an image, a title, a line of text and a link.
 *
 * The image is decorative unless `image-alt` says what it shows; the title
 * and the text already say what the card is about.
 *
 * @element punica-top-nav-mega-menu-card
 *
 * @attr {string} heading - The card's title.
 * @attr {string} image - Address of an image over the title.
 * @attr {string} image-alt - What the image shows, when it says more than the title; decorative without it.
 * @attr {string} href - Where the card's link leads.
 * @attr {string} link-label - Text of the link; the title by default.
 *
 * @slot - The text under the title.
 *
 * @csspart base - The card.
 * @csspart image - The native `<img>`.
 * @csspart body - The column holding the title, the text and the link.
 * @csspart heading - The title.
 * @csspart link - The native `<a>`.
 *
 * @cssprop --punica-top-nav-mega-menu-card-background - Background.
 * @cssprop --punica-top-nav-mega-menu-card-radius - Corner radius.
 * @cssprop --punica-top-nav-mega-menu-card-image-ratio - Aspect ratio of the image.
 */
export class PunicaTopNavMegaMenuCard extends PunicaElement {
  static properties = {
    heading: {},
    image: {},
    imageAlt: {},
    href: {},
    linkLabel: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base">
      <img part="image" class="image" alt="" hidden>
      <div part="body" class="body">
        <div part="heading" class="heading"></div>
        <div class="text"><slot></slot></div>
        <a part="link" class="link" hidden><span class="link-text"></span>${icons.chevronEnd}</a>
      </div>
    </div>
  `;

  #image = /** @type {HTMLImageElement} */ (this.$('img'));
  #heading = this.$('.heading');
  #link = this.$('a');
  #linkText = this.$('.link-text');

  update() {
    const image = this.#image;
    if (this.image) {
      image.src = this.image;
      image.alt = this.imageAlt ?? '';
      image.hidden = false;
    } else {
      image.removeAttribute('src');
      image.hidden = true;
    }
    this.#heading.textContent = this.heading ?? '';
    this.#heading.hidden = !this.heading;
    const link = this.#link;
    if (this.href) {
      link.setAttribute('href', this.href);
      link.hidden = false;
    } else {
      link.removeAttribute('href');
      link.hidden = true;
    }
    this.#linkText.textContent = this.linkLabel || this.heading || '';
  }
}

define('punica-top-nav-mega-menu-card', PunicaTopNavMegaMenuCard);
