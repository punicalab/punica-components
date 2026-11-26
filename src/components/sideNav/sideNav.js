import { PunicaElement, define } from '../../core/element.js';
import { nextIndex } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import styles from './sideNav.css';

/**
 * The navigation of an app, down its side.
 *
 * It holds `punica-side-nav-item` elements, alone or grouped in
 * `punica-side-nav-section`. Collapsed, it is a rail of icons and each item
 * shows its label beside it on hover and focus.
 *
 * @element punica-side-nav
 *
 * @attr {string} label - Accessible name of the navigation landmark.
 * @attr {boolean} collapsed - Rail mode: icons only.
 * @attr {boolean} no-collapse - No collapse button, for a navigation that is always full width, such as one inside a mobile drawer.
 * @attr {string} label-collapse - Name of the collapse button while expanded, `Collapse navigation` by default.
 * @attr {string} label-expand - Name of the collapse button while collapsed, `Expand navigation` by default.
 *
 * @slot - Items and sections.
 * @slot header - Above the items: a brand, a workspace switcher.
 * @slot footer - Under the items: an account, settings.
 *
 * @fires {{ open: boolean }} punica-toggle - The user collapsed or expanded the navigation. `detail` is `{ open }`. Items and sections fire the same event for their own disclosure, so check `event.target`.
 *
 * @csspart base - The native `<nav>`.
 * @csspart header - The header row.
 * @csspart collapse-button - The collapse button.
 * @csspart items - The scrolling list of items.
 * @csspart footer - The footer.
 *
 * @cssprop --punica-side-nav-width - Inline size while expanded.
 * @cssprop --punica-side-nav-rail-width - Inline size while collapsed.
 * @cssprop --punica-side-nav-background - Background.
 * @cssprop --punica-side-nav-padding - Padding around the items.
 */
export class PunicaSideNav extends PunicaElement {
  static properties = {
    label: {},
    collapsed: { type: Boolean },
    noCollapse: { type: Boolean },
    labelCollapse: { default: 'Collapse navigation' },
    labelExpand: { default: 'Expand navigation' }
  };

  static styles = styles;
  static template = `
    <nav part="base">
      <div part="header" class="header">
        <slot name="header"></slot>
        <button part="collapse-button" class="collapse" type="button">${icons.chevronStart}</button>
      </div>
      <div part="items" class="items"><slot></slot></div>
      <div part="footer" class="footer"><slot name="footer"></slot></div>
    </nav>
  `;

  #nav = this.$('nav');
  #button = this.$('.collapse');

  constructor() {
    super();
    this.#button.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      this.emit('toggle', { open: !this.collapsed });
    });
    this.#nav.addEventListener('keydown', (event) => this.#onKeydown(event));
  }

  update(changed) {
    if (this.label) this.#nav.setAttribute('aria-label', this.label);
    else this.#nav.removeAttribute('aria-label');
    this.#button.setAttribute('aria-label', this.collapsed ? this.labelExpand : this.labelCollapse);
    this.#button.setAttribute('aria-expanded', String(!this.collapsed));
    if (changed.has('collapsed')) {
      for (const el of this.querySelectorAll('punica-side-nav-item, punica-side-nav-section')) {
        /** @type {any} */ (el).requestUpdate?.();
      }
    }
  }

  /** Arrow keys, Home and End move between the items that are showing. */
  #onKeydown(event) {
    const current = event.target instanceof Element ? event.target.closest('punica-side-nav-item') : null;
    if (!current || event.defaultPrevented) return;
    const items = /** @type {HTMLElement[]} */ (
      [...this.querySelectorAll('punica-side-nav-item:not([disabled])')].filter((item) => item.checkVisibility())
    );
    const index = nextIndex(event, items.length, items.indexOf(/** @type {HTMLElement} */ (current)), {
      orientation: 'vertical'
    });
    if (index < 0) return;
    event.preventDefault();
    items[index].focus();
  }
}

define('punica-side-nav', PunicaSideNav);
