import { PunicaElement, define } from '../../core/element.js';
import { nextIndex } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import '../popover/popover.js';
import styles from './topNav.css';

/**
 * The navigation of an app, across its top.
 *
 * Items that do not fit move, from the last one back, into a menu behind a
 * "more" button. The element measures itself as it resizes and as its items
 * change.
 *
 * @element punica-top-nav
 *
 * @attr {string} label - Accessible name of the navigation landmark.
 * @attr {string} label-more - Name of the button that opens the items that do not fit, `More` by default.
 *
 * @prop {Element[]} overflowing - The items that are in the menu now (read-only).
 *
 * @slot - `punica-top-nav-item` elements.
 * @slot start - Before the items: the brand.
 * @slot end - After the items: actions, an account.
 *
 * @fires punica-open - The menu of items that do not fit, or an item's own menu, opened.
 * @fires punica-close - That menu closed. `detail` is `{ reason }`.
 *
 * @csspart base - The native `<nav>`.
 * @csspart start - The wrapper of the `start` slot.
 * @csspart items - The row of items.
 * @csspart more-button - The button that opens the items that do not fit.
 * @csspart more-popover - The `punica-popover` holding them.
 * @csspart more-menu - The column of items inside it.
 * @csspart end - The wrapper of the `end` slot.
 *
 * @cssprop --punica-top-nav-height - Minimum block size.
 * @cssprop --punica-top-nav-background - Background.
 * @cssprop --punica-top-nav-padding - Inline padding.
 * @cssprop --punica-top-nav-gap - Space between items.
 */
export class PunicaTopNav extends PunicaElement {
  static properties = {
    label: {},
    labelMore: { default: 'More' }
  };

  static styles = styles;
  // Slots are assigned by hand: which items sit in the row and which in the
  // menu is this element's decision, and it writes nothing on the items.
  static shadowOptions = { slotAssignment: 'manual' };
  static template = `
    <nav part="base">
      <div part="start" class="start"><slot id="start"></slot></div>
      <div part="items" class="items"><slot id="items"></slot></div>
      <button part="more-button" class="more" type="button" aria-expanded="false" hidden>${icons.more}</button>
      <punica-popover part="more-popover" align="end" panel-role="group">
        <div part="more-menu" class="menu"><slot id="overflow"></slot></div>
      </punica-popover>
      <div part="end" class="end"><slot id="end"></slot></div>
    </nav>
  `;

  #nav = this.$('nav');
  #row = this.$('.items');
  #more = this.$('.more');
  #popover = this.$('punica-popover');
  #menu = this.$('.menu');
  #slots = {
    start: this.$('#start'),
    items: this.$('#items'),
    overflow: this.$('#overflow'),
    end: this.$('#end')
  };
  /** @type {Element[]} */
  #items = [];
  /** @type {Element[]} */
  #overflowing = [];
  /** @type {ResizeObserver | null} */
  #resize = null;
  #frame = 0;
  /** @type {MutationObserver | null} */
  #mutation = null;

  constructor() {
    super();
    this.#more.addEventListener('click', () => {
      this.#popover.open = !this.#popover.open;
    });
    this.#more.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      if (this.#popover.open) this.#focusable()[0]?.focus();
      else this.#popover.open = true;
    });
    this.#popover.addEventListener('punica-open', (event) => {
      if (event.target === this.#popover) this.#more.setAttribute('aria-expanded', 'true');
    });
    this.#popover.addEventListener('punica-close', (event) => {
      if (event.target !== this.#popover) return;
      this.#more.setAttribute('aria-expanded', 'false');
      // The popover gives focus back only from content it contains in the
      // DOM; these items reach it through this element's slot.
      if (/** @type {CustomEvent} */ (event).detail?.reason === 'escape') this.#more.focus();
      // Menus opened from inside it go with it.
      for (const item of this.#overflowing) if ('open' in item) /** @type {any} */ (item).open = false;
    });
    this.#menu.addEventListener('keydown', (event) => this.#onMenuKeydown(event));
  }

  get overflowing() {
    return [...this.#overflowing];
  }

  connected() {
    // Laid out in the next frame, never inside the observer's callback: moving
    // items changes the element's size, which would loop the observer.
    this.#resize = new ResizeObserver(() => {
      cancelAnimationFrame(this.#frame);
      this.#frame = requestAnimationFrame(() => this.#layout());
    });
    this.#resize.observe(this);
    this.#mutation = new MutationObserver(() => this.#assign());
    this.#mutation.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['slot', 'hidden']
    });
    this.#assign();
  }

  disconnected() {
    cancelAnimationFrame(this.#frame);
    this.#resize?.disconnect();
    this.#resize = null;
    this.#mutation?.disconnect();
    this.#mutation = null;
  }

  update() {
    if (this.label) this.#nav.setAttribute('aria-label', this.label);
    else this.#nav.removeAttribute('aria-label');
    this.#more.setAttribute('aria-label', this.labelMore);
    this.#more.title = this.labelMore;
    this.#popover.anchor = this.#more;
    this.#popover.label = this.labelMore;
  }

  /** Sorts the children into the slots, then measures. */
  #assign() {
    const children = [...this.children];
    this.#slots.start.assign(...children.filter((el) => el.slot === 'start'));
    this.#slots.end.assign(...children.filter((el) => el.slot === 'end'));
    this.#items = children.filter((el) => !el.slot);
    this.#layout();
  }

  /**
   * Puts every item in the row, measures, and moves the ones past the edge
   * into the menu.
   */
  #layout() {
    const items = this.#items;
    const row = this.#row;
    const more = this.#more;
    this.#slots.items.assign(...items);
    more.hidden = true;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const widths = items.map((item) => /** @type {HTMLElement} */ (item).offsetWidth);
    const total = widths.reduce((sum, width, i) => sum + width + (i ? gap : 0), 0);
    let fit = items.length;
    // Half a pixel of slack: the row's own size is fractional, the sum is not.
    if (total > row.getBoundingClientRect().width + 0.5) {
      more.hidden = false;
      const room = row.getBoundingClientRect().width + 0.5;
      let used = 0;
      fit = 0;
      for (const [i, width] of widths.entries()) {
        used += width + (i ? gap : 0);
        if (used > room) break;
        fit++;
      }
    }
    this.#overflowing = items.slice(fit);
    this.#slots.items.assign(...items.slice(0, fit));
    this.#slots.overflow.assign(...this.#overflowing);
    if (!this.#overflowing.length && this.#popover.open) this.#popover.open = false;
  }

  /** @returns {HTMLElement[]} */
  #focusable() {
    return /** @type {HTMLElement[]} */ (this.#overflowing.filter((item) => !item.hasAttribute('disabled')));
  }

  #onMenuKeydown(event) {
    if (event.defaultPrevented) return;
    const items = this.#focusable();
    const current = items.findIndex((item) => item.matches(':focus-within'));
    const index = nextIndex(event, items.length, current, { orientation: 'vertical' });
    if (index < 0) return;
    event.preventDefault();
    items[index].focus();
  }
}

define('punica-top-nav', PunicaTopNav);
