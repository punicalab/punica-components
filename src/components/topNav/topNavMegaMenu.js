import { PunicaElement, define } from '../../core/element.js';
import styles from './topNavMegaMenu.css';

/**
 * A wide panel of links in columns, for a `punica-top-nav-item`'s `menu`
 * slot: a site's products, its solutions, its resources.
 *
 * Its columns are `punica-top-nav-mega-menu-group` elements; a promotional
 * card goes in the `featured` slot, beside the columns, or under them when
 * the panel is narrow. The item that holds it opens, closes and works it
 * with the keyboard as it does any menu.
 *
 * @element punica-top-nav-mega-menu
 *
 * @slot - The columns: `punica-top-nav-mega-menu-group` elements.
 * @slot featured - A promotional card beside the columns: a `punica-top-nav-mega-menu-card`.
 *
 * @csspart base - The grid of columns and the featured card.
 * @csspart groups - The row of columns.
 * @csspart featured - The wrapper of the `featured` slot.
 *
 * @cssprop --punica-top-nav-mega-menu-width - Inline size of the panel, capped at the viewport.
 * @cssprop --punica-top-nav-mega-menu-column-width - Narrowest a column gets before the columns wrap.
 * @cssprop --punica-top-nav-mega-menu-featured-width - Inline size of the featured card beside the columns.
 * @cssprop --punica-top-nav-mega-menu-gap - Space between columns.
 */
export class PunicaTopNavMegaMenu extends PunicaElement {
  static styles = styles;
  static template = `
    <div part="base" class="base">
      <div part="groups" class="groups"><slot></slot></div>
      <div part="featured" class="featured"><slot name="featured"></slot></div>
    </div>
  `;

  #featured = this.$('.featured');
  #featuredSlot = this.$('slot[name="featured"]');

  constructor() {
    super();
    this.#featuredSlot.addEventListener('slotchange', () => this.requestUpdate());
  }

  update() {
    this.#featured.hidden = !this.#featuredSlot.assignedElements({ flatten: true }).length;
  }
}

define('punica-top-nav-mega-menu', PunicaTopNavMegaMenu);
