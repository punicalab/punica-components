import { icons } from '../../core/icons.js';
import { PunicaElement, define } from '../../core/element.js';
import '../mobileNav/mobileNav.js';
import styles from './appShell.css';

/** The widths `collapse-below` names, in px: the library's breakpoints. */
const BREAKPOINTS = { small: 600, medium: 900, large: 1200 };

const MENU_ICON = icons.menu;

/**
 * The frame of an app's page: a header across the top, the navigation down
 * the side, the main content, a secondary panel and a footer.
 *
 * The regions are a CSS grid. With `fixed` the shell is as tall as the
 * viewport and each region scrolls on its own; without it the page scrolls
 * and the header, the navigation and the panel stick. Narrower than
 * `collapse-below`, the navigation leaves the side for a drawer opened by a
 * menu button at the start of the header, and the panel moves under the
 * main content. The width is the shell's own, not the window's, so a shell
 * in a pane collapses with the pane.
 *
 * The main content is in a native `<main>` landmark, unless `embedded` says
 * the shell is a part of a larger page that has its own; a "skip to
 * content" button is the first thing in the tab order.
 *
 * @element punica-app-shell
 *
 * @attr {boolean} fixed - The shell is as tall as `--punica-app-shell-height` and each region scrolls on its own.
 * @attr {'small' | 'medium' | 'large' | 'none'} collapse-below - Width under which the navigation becomes a drawer: 600, 900 or 1200 px, `medium` (900 px) by default; `none` never collapses.
 * @attr {boolean} embedded - The shell is part of a page that has its own `<main>`: the content area is a plain element, not a second main landmark.
 * @attr {boolean} nav-open - The navigation drawer is showing; only while collapsed.
 * @attr {string} label-menu - Accessible name of the menu button, `Menu` by default.
 * @attr {string} label-nav - Accessible name of the navigation drawer, `Navigation` by default.
 * @attr {string} label-skip - Text of the skip link, `Skip to content` by default.
 * @attr {string} label-close - Accessible name of the drawer's close button, `Close` by default.
 *
 * @prop {boolean} collapsed - The shell is narrower than `collapse-below` (read-only).
 *
 * @slot - The main content, inside the `<main>` landmark.
 * @slot header - Across the top: a `punica-top-nav`, a `punica-app-bar`.
 * @slot nav - Down the inline-start side, in a drawer while collapsed: a `punica-side-nav`.
 * @slot aside - A secondary panel at the inline-end side, under the main content while collapsed.
 * @slot footer - Under the main content and the panel.
 *
 * @fires punica-open - The navigation drawer opened.
 * @fires {{ reason: 'escape' | 'backdrop' | 'close-button' | 'navigate' | 'resize' | 'api' | (string & {}), returnValue: string }} punica-close - The navigation drawer closed. `detail` is `{ reason, returnValue }`; `reason` is `escape`, `backdrop`, `close-button`, `navigate`, `resize` (the shell grew past `collapse-below`) or `api`.
 *
 * @csspart base - The grid.
 * @csspart skip-link - The skip-to-content button.
 * @csspart header - The header region.
 * @csspart menu-cell - The start of the header holding the menu button, shown while collapsed; it draws the header's bottom line under the button.
 * @csspart menu-button - The button that opens the navigation drawer.
 * @csspart nav - The navigation region.
 * @csspart main - The native `<main>` (a `<div>` while `embedded`).
 * @csspart aside - The panel region.
 * @csspart footer - The footer region.
 * @csspart drawer - The `punica-mobile-nav` the navigation moves into.
 *
 * @cssprop --punica-app-shell-height - Block size while `fixed`, `100dvh` by default.
 * @cssprop --punica-app-shell-nav-width - Inline size of the navigation region.
 * @cssprop --punica-app-shell-aside-width - Inline size of the panel region.
 * @cssprop --punica-app-shell-background - Background of the main content.
 * @cssprop --punica-app-shell-padding - Padding of the main content.
 *
 * @cssstate collapsed - The shell is narrower than `collapse-below`.
 * @cssstate has-nav - There is content in the `nav` slot.
 */
export class PunicaAppShell extends PunicaElement {
  static properties = {
    fixed: { type: Boolean },
    embedded: { type: Boolean },
    collapseBelow: { default: 'medium' },
    navOpen: { type: Boolean },
    labelMenu: { default: 'Menu' },
    labelNav: { default: 'Navigation' },
    labelSkip: { default: 'Skip to content' },
    labelClose: { default: 'Close' }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <button part="skip-link" class="skip" type="button"></button>
      <div part="header" class="header">
        <div part="menu-cell" class="menu-cell">
          <punica-mobile-nav part="drawer" class="drawer">
            <button slot="trigger" part="menu-button" class="menu" type="button">${MENU_ICON}</button>
          </punica-mobile-nav>
        </div>
        <div class="header-content"><slot name="header"></slot></div>
      </div>
      <div part="nav" class="nav"><div class="nav-inner"><slot name="nav"></slot></div></div>
      <main part="main" class="main" tabindex="-1"><slot></slot></main>
      <div part="aside" class="aside"><div class="aside-inner"><slot name="aside"></slot></div></div>
      <div part="footer" class="footer"><slot name="footer"></slot></div>
    </div>
  `;

  #base = this.$('.base');
  #skip = this.$('.skip');
  #header = this.$('.header');
  #navRegion = this.$('.nav');
  #navInner = this.$('.nav-inner');
  #menuCell = this.$('.menu-cell');
  #main = this.$('main');
  #aside = this.$('.aside');
  #asideInner = this.$('.aside-inner');
  #drawer = /** @type {any} */ (this.$('punica-mobile-nav'));
  #menu = this.$('.menu');
  #slots = {
    header: this.$('slot[name="header"]'),
    nav: this.$('slot[name="nav"]'),
    aside: this.$('slot[name="aside"]'),
    footer: this.$('slot[name="footer"]')
  };
  #collapsed = false;
  /** @type {ResizeObserver | null} */
  #resize = null;
  #frame = 0;
  #closeReason = '';

  constructor() {
    super();
    this.#skip.addEventListener('click', () => {
      this.#main.focus();
      this.#main.scrollIntoView({ block: 'start' });
    });
    for (const slot of Object.values(this.#slots)) {
      slot.addEventListener('slotchange', () => this.requestUpdate());
    }
    // The drawer is this shell's; its state is `nav-open`.
    this.#drawer.addEventListener('punica-open', () => {
      this.navOpen = true;
    });
    this.#drawer.addEventListener('punica-close', (event) => {
      const reason = this.#closeReason;
      this.#closeReason = '';
      this.navOpen = false;
      if (reason) {
        // Closed by the shell itself: report its own reason, not `api`.
        event.stopPropagation();
        this.emit('close', { ...event.detail, reason });
      }
    });
  }

  get collapsed() {
    return this.#collapsed;
  }

  connected() {
    // Measured once now, so the first frame is already laid out right.
    this.#setCollapsed(this.#measure());
    // The shell's width decides the layout; the header's height is where
    // sticky regions stop. Applied in the next frame, never inside the
    // observer's callback: moving the navigation changes the shell's height.
    this.#resize = new ResizeObserver(() => {
      cancelAnimationFrame(this.#frame);
      this.#frame = requestAnimationFrame(() => {
        this.#setCollapsed(this.#measure());
        this.#trackHeader();
        this.#tabScrollers();
      });
    });
    this.#resize.observe(this);
    this.#resize.observe(this.#header);
    this.#resize.observe(this.#main);
    this.#resize.observe(this.#asideInner);
  }

  disconnected() {
    cancelAnimationFrame(this.#frame);
    this.#resize?.disconnect();
    this.#resize = null;
  }

  update(changed) {
    if (changed.has('embedded')) this.#setMain();
    if (changed.has('collapseBelow')) {
      this.#collapsed = this.#measure();
      this.toggleState('collapsed', this.#collapsed);
    }
    this.#skip.textContent = this.labelSkip;
    this.#menu.setAttribute('aria-label', this.labelMenu);
    this.#menu.title = this.labelMenu;
    this.#drawer.label = this.labelNav;
    this.#drawer.labelClose = this.labelClose;

    const has = (slot) => slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === 1 || n.textContent.trim());
    const hasNav = has(this.#slots.nav);
    this.toggleState('has-nav', hasNav);
    this.#header.hidden = !has(this.#slots.header) && !(this.#collapsed && hasNav);
    this.#navRegion.hidden = !hasNav || this.#collapsed;
    this.#aside.hidden = !has(this.#slots.aside);
    this.$('.footer').hidden = !has(this.#slots.footer);
    this.#menuCell.hidden = !(this.#collapsed && hasNav);

    // One slot, in the side region or in the drawer.
    const navSlot = this.#slots.nav;
    const home = this.#collapsed ? this.#drawer : this.#navInner;
    if (navSlot.parentNode !== home) home.append(navSlot);

    const open = this.navOpen && this.#collapsed && hasNav;
    // Only while collapsed: a shell that grows wide closes its drawer.
    if (this.navOpen && !open) this.navOpen = false;
    if (!open && this.#drawer.open && !this.#collapsed) this.#closeReason = 'resize';
    this.#drawer.open = open;
    this.#trackHeader();
    this.#tabScrollers();
  }

  /**
   * A region that scrolls on its own is a tab stop while it overflows, so a
   * keyboard can scroll it even when nothing inside takes focus. Call after
   * changing the content in a way that changes whether it overflows.
   */
  refresh() {
    this.#tabScrollers();
  }

  #tabScrollers() {
    for (const region of [this.#main, this.#asideInner]) {
      const scrolls = getComputedStyle(region).overflowY === 'auto' && region.scrollHeight > region.clientHeight + 1;
      if (scrolls) region.setAttribute('tabindex', '0');
      else if (region === this.#main) region.setAttribute('tabindex', '-1');
      else region.removeAttribute('tabindex');
    }
  }

  /** A `<main>`, or a `<div>` while embedded, keeping its content. */
  #setMain() {
    const tag = this.embedded ? 'div' : 'main';
    const old = this.#main;
    if (old.localName === tag) return;
    const next = document.createElement(tag);
    for (const name of ['part', 'class', 'tabindex']) next.setAttribute(name, old.getAttribute(name));
    next.append(...old.childNodes);
    old.replaceWith(next);
    this.#main = next;
    if (this.#resize) {
      this.#resize.unobserve(old);
      this.#resize.observe(next);
    }
  }

  #measure() {
    return this.#isNarrow(this.getBoundingClientRect().width);
  }

  /** @param {number} width */
  #isNarrow(width) {
    const limit = BREAKPOINTS[/** @type {keyof typeof BREAKPOINTS} */ (this.collapseBelow)] ?? (this.collapseBelow === 'none' ? 0 : BREAKPOINTS.medium);
    return width > 0 && width < limit;
  }

  /** @param {boolean} narrow */
  #setCollapsed(narrow) {
    if (narrow === this.#collapsed) return;
    this.#collapsed = narrow;
    this.toggleState('collapsed', narrow);
    this.requestUpdate();
  }

  /** Sticky regions and a skipped-to main stop under the header, not behind it. */
  #trackHeader() {
    const height = this.#header.hidden ? 0 : this.#header.getBoundingClientRect().height;
    this.#base.style.setProperty('--_header', `${Math.round(height)}px`);
  }
}

define('punica-app-shell', PunicaAppShell);
