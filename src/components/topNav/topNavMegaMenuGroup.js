import { PunicaElement, define } from '../../core/element.js';
import styles from './topNavMegaMenuGroup.css';

/**
 * One column of a `punica-top-nav-mega-menu`: a heading over a list of
 * links. It is a group named by its heading.
 *
 * @element punica-top-nav-mega-menu-group
 *
 * @attr {string} heading - The column's title and the group's accessible name.
 *
 * @slot - `punica-top-nav-mega-menu-item` elements.
 *
 * @csspart heading - The title.
 * @csspart items - The column of items.
 *
 * @cssprop --punica-top-nav-mega-menu-group-heading-color - Colour of the title.
 */
export class PunicaTopNavMegaMenuGroup extends PunicaElement {
  static properties = {
    heading: {}
  };

  static styles = styles;
  static template = `
    <div part="heading" class="heading" aria-hidden="true"></div>
    <div part="items" class="items"><slot></slot></div>
  `;

  #heading = this.$('.heading');

  update() {
    this.internals.role = 'group';
    this.internals.ariaLabel = this.heading || null;
    this.#heading.textContent = this.heading ?? '';
    this.#heading.hidden = !this.heading;
  }
}

define('punica-top-nav-mega-menu-group', PunicaTopNavMegaMenuGroup);
