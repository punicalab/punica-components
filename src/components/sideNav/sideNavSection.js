import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './sideNavSection.css';

/**
 * A named group of items in a `punica-side-nav`.
 *
 * @element punica-side-nav-section
 *
 * @attr {string} label - The group's heading and accessible name.
 * @attr {boolean} collapsible - The heading is a button that hides and shows the items.
 * @attr {boolean} collapsed - The items are hidden; only with `collapsible`.
 *
 * @slot - `punica-side-nav-item` elements.
 *
 * @fires {{ open: boolean }} punica-toggle - The user hid or showed the items. `detail` is `{ open }`.
 *
 * @csspart base - The group.
 * @csspart heading - The heading of a section that is not collapsible.
 * @csspart toggle - The heading button of a collapsible section.
 * @csspart items - The wrapper around the items.
 *
 * @cssprop --punica-side-nav-section-gap - Space above the section.
 * @cssprop --punica-side-nav-section-color - Colour of the heading.
 *
 * @cssstate rail - The navigation around it is collapsed.
 */
export class PunicaSideNavSection extends PunicaElement {
  static properties = {
    label: {},
    collapsible: { type: Boolean },
    collapsed: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base" role="group">
      <div part="heading" class="heading" id="heading" hidden></div>
      <button part="toggle" class="heading toggle" id="toggle" type="button" aria-controls="items" hidden>
        <span class="text"></span>${icons.chevronDown}
      </button>
      <div part="items" class="items" id="items"><slot></slot></div>
    </div>
  `;

  #base = this.$('.base');
  #heading = this.$('#heading');
  #toggle = this.$('#toggle');
  #text = this.$('.text');
  #items = this.$('#items');

  constructor() {
    super();
    this.#toggle.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      this.emit('toggle', { open: !this.collapsed });
    });
  }

  update() {
    const rail = !!(/** @type {any} */ (this.closest('punica-side-nav'))?.collapsed);
    const label = this.label || '';
    const button = this.collapsible && !!label;
    this.toggleState('rail', rail);
    this.#heading.textContent = label;
    this.#text.textContent = label;
    this.#heading.hidden = !label || button;
    this.#toggle.hidden = !button;
    this.#toggle.setAttribute('aria-expanded', String(!this.collapsed));
    if (label) this.#base.setAttribute('aria-labelledby', button ? 'toggle' : 'heading');
    else this.#base.removeAttribute('aria-labelledby');
    // A rail has no heading to press, so its items always show.
    this.#items.hidden = button && this.collapsed && !rail;
  }
}

define('punica-side-nav-section', PunicaSideNavSection);
