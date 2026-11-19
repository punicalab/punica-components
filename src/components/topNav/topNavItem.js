import { PunicaElement, define } from '../../core/element.js';
import { nextIndex } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import '../popover/popover.js';
import styles from './topNavItem.css';

const FOCUSABLE =
  'a[href],button:not([disabled]),punica-top-nav-item:not([disabled]),punica-top-nav-mega-menu-item:not([disabled]),punica-top-nav-mega-menu-card[href],[tabindex]:not([tabindex="-1"])';

/**
 * One destination or action in a `punica-top-nav`.
 *
 * With `href` it is a native link, without one a native button. Content in
 * its `menu` slot makes it a button that opens that content under it.
 *
 * @element punica-top-nav-item
 *
 * @attr {string} href - Where the item leads; makes it a link. Ignored while there is a menu.
 * @attr {string} target - Browsing context of the link.
 * @attr {string} rel - Link relation of the link.
 * @attr {boolean} current - The item is the page the user is on (`aria-current="page"`).
 * @attr {boolean} disabled - Takes no activation and no focus.
 * @attr {boolean} open - The menu is showing.
 *
 * @slot - The label.
 * @slot start - Before the label: an icon.
 * @slot end - After the label: a badge.
 * @slot menu - The dropdown: links, buttons or further items, or one `punica-top-nav-mega-menu`.
 *
 * @fires punica-open - The menu opened.
 * @fires punica-close - The menu closed. `detail` is `{ reason }`: `escape`, `outside` or `api`.
 *
 * @csspart control - The native `<a>` or `<button>`.
 * @csspart label - The wrapper around the default slot.
 * @csspart chevron - The arrow of an item with a menu.
 * @csspart popover - The `punica-popover` holding the menu.
 * @csspart menu - The column of menu content.
 *
 * @cssprop --punica-top-nav-item-height - Minimum block size.
 * @cssprop --punica-top-nav-item-radius - Corner radius.
 * @cssprop --punica-top-nav-item-padding - Inline padding.
 * @cssprop --punica-top-nav-item-current-background - Background of the current item.
 * @cssprop --punica-top-nav-item-current-color - Text colour of the current item.
 *
 * @cssstate has-menu - There is content in the `menu` slot.
 * @cssstate mega - The `menu` slot holds a `punica-top-nav-mega-menu`; the panel is as wide as it.
 */
export class PunicaTopNavItem extends PunicaElement {
  static properties = {
    href: {},
    target: {},
    rel: {},
    current: { type: Boolean },
    disabled: { type: Boolean },
    open: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <a part="control" class="control" hidden></a>
    <button part="control" class="control" type="button" hidden></button>
    <span class="content">
      <slot name="start"></slot>
      <span part="label" class="label"><slot></slot></span>
      <slot name="end"></slot>
      <span part="chevron" class="chevron" hidden>${icons.chevronDown}</span>
    </span>
    <punica-popover part="popover" panel-role="group">
      <div part="menu" class="menu"><slot name="menu"></slot></div>
    </punica-popover>
  `;

  #link = this.$('a');
  #button = this.$('button');
  #content = this.$('.content');
  #chevron = this.$('.chevron');
  #popover = this.$('punica-popover');
  #menu = this.$('.menu');
  #menuSlot = this.$('slot[name="menu"]');
  #labelSlot = this.$('.label slot');
  #hasMenu = false;
  #mega = false;

  constructor() {
    super();
    this.#menuSlot.addEventListener('slotchange', () => {
      const assigned = this.#menuSlot.assignedElements();
      const has = assigned.length > 0;
      const mega = assigned.some((el) => el.localName === 'punica-top-nav-mega-menu');
      if (has === this.#hasMenu && mega === this.#mega) return;
      this.#hasMenu = has;
      this.#mega = mega;
      this.requestUpdate();
    });
    this.#button.addEventListener('click', () => {
      if (this.#hasMenu && !this.disabled) this.open = !this.open;
    });
    this.#popover.addEventListener('punica-close', (event) => {
      // Closed by itself: Escape or a click outside.
      if (event.target === this.#popover) this.open = false;
    });
    this.shadowRoot.addEventListener('keydown', (event) => this.#onKeydown(/** @type {KeyboardEvent} */ (event)));
  }

  /** The item's label as text. */
  get text() {
    return this.#labelSlot
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  update() {
    const menu = this.#hasMenu;
    const asLink = !!this.href && !menu;
    const control = asLink ? this.#link : this.#button;
    const other = asLink ? this.#button : this.#link;
    this.toggleState('has-menu', menu);
    this.toggleState('mega', menu && this.#mega);

    if (this.#content.parentNode !== control) control.append(this.#content);
    control.hidden = false;
    other.hidden = true;
    other.removeAttribute('aria-current');
    if (this.current) control.setAttribute('aria-current', 'page');
    else control.removeAttribute('aria-current');

    const link = this.#link;
    if (asLink && !this.disabled) {
      link.setAttribute('href', this.href);
      link.removeAttribute('role');
      link.removeAttribute('aria-disabled');
    } else {
      link.removeAttribute('href');
      link.setAttribute('role', 'link');
      link.setAttribute('aria-disabled', 'true');
    }
    for (const name of ['target', 'rel']) {
      if (this[name]) link.setAttribute(name, this[name]);
      else link.removeAttribute(name);
    }

    const button = this.#button;
    const open = menu && this.open && !this.disabled;
    button.disabled = this.disabled;
    // A disclosure, not a menu: what opens is a group of links.
    if (menu) button.setAttribute('aria-expanded', String(open));
    else button.removeAttribute('aria-expanded');
    this.#chevron.hidden = !menu;
    this.#popover.anchor = button;
    this.#popover.label = this.text || null;
    this.#popover.open = open;
  }

  /** @returns {HTMLElement[]} what the arrow keys move between in the menu */
  #focusable() {
    return this.#menuSlot
      .assignedElements({ flatten: true })
      .flatMap((el) => (el.matches(FOCUSABLE) ? [el] : [...el.querySelectorAll(FOCUSABLE)]))
      .filter((el) => el.parentElement?.closest('punica-top-nav-item') === this);
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (!this.#hasMenu || event.defaultPrevented) return;
    const path = event.composedPath();
    if (path.includes(this.#button)) {
      if (event.key !== 'ArrowDown' || this.disabled) return;
      event.preventDefault();
      if (this.open) this.#focusable()[0]?.focus();
      else this.open = true;
      return;
    }
    if (!path.includes(this.#menu)) return;
    if (event.key === 'Escape') {
      // This menu only; the ones around it stay.
      event.preventDefault();
      event.stopPropagation();
      this.#popover.hide('escape');
      this.#button.focus();
      return;
    }
    const items = this.#focusable();
    const current = items.findIndex((item) => item === path[0] || item.matches(':focus-within') || item.matches(':focus'));
    const index = nextIndex(event, items.length, current, { orientation: 'vertical' });
    if (index < 0) return;
    event.preventDefault();
    event.stopPropagation();
    items[index].focus();
  }
}

define('punica-top-nav-item', PunicaTopNavItem);
