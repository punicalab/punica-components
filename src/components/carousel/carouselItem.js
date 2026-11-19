import { PunicaElement, define } from '../../core/element.js';
import styles from './carouselItem.css';

/**
 * One slide of a `punica-carousel`.
 *
 * @element punica-carousel-item
 *
 * @attr {string} label - Accessible name of the slide; its position ("2 of 5") when absent.
 * @attr {boolean} active - The slide is the one showing. Set by `punica-carousel`; the other slides are inert.
 *
 * @prop {string} positionLabel - The slide's position as text. Set by `punica-carousel`.
 * @prop {string} roledescription - How assistive technology calls the slide. Set by `punica-carousel`.
 *
 * @slot - The slide's content.
 *
 * @csspart base - The wrapper around the content.
 *
 * @cssstate active - The slide is the one showing.
 */
export class PunicaCarouselItem extends PunicaElement {
  static properties = {
    label: {},
    active: { type: Boolean },
    positionLabel: { attribute: false },
    roledescription: { attribute: false }
  };

  static styles = styles;
  static template = `<div part="base" class="base"><slot></slot></div>`;

  constructor() {
    super();
    this.internals.role = 'group';
  }

  update() {
    this.internals.ariaLabel = this.label || this.positionLabel || null;
    this.internals.ariaRoleDescription = this.roledescription || null;
    this.toggleState('active', this.active);
    // A slide scrolled out of view takes no focus and is not read.
    this.inert = this.parentElement?.localName === 'punica-carousel' && !this.active;
  }
}

define('punica-carousel-item', PunicaCarouselItem);
