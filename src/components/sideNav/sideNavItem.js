import { PunicaElement, define } from '../../core/element.js';
import { Overlay, overlayCss } from '../../core/overlay.js';
import { icons } from '../../core/icons.js';
import styles from './sideNavItem.css';

/**
 * One destination or action in a `punica-side-nav`.
 *
 * With `href` it is a native link, without one a native button. Items in its
 * `children` slot make it a disclosure: a button item expands on activation, a
 * link item gets a second button for it. In a collapsed navigation only the
 * `start` content shows and the label opens beside it on hover and focus.
 *
 * @element punica-side-nav-item
 *
 * @attr {string} href - Where the item leads; makes it a link.
 * @attr {string} target - Browsing context of the link.
 * @attr {string} rel - Link relation of the link.
 * @attr {boolean} current - The item is the page the user is on (`aria-current="page"`).
 * @attr {boolean} disabled - Takes no activation and no focus.
 * @attr {boolean} open - The nested items are showing.
 * @attr {string} label-toggle - Start of the name of a link item's expand button, `Toggle` by default; the item's text follows it.
 *
 * @slot - The label.
 * @slot start - Before the label: an icon.
 * @slot end - After the label: a badge.
 * @slot children - Nested `punica-side-nav-item` elements.
 *
 * @fires {{ open: boolean }} punica-toggle - The user expanded or collapsed the nested items. `detail` is `{ open }`.
 *
 * @csspart base - The row with the control.
 * @csspart control - The native `<a>` or `<button>`.
 * @csspart label - The wrapper around the default slot.
 * @csspart chevron - The disclosure arrow of a button item.
 * @csspart toggle - The expand button of a link item.
 * @csspart children - The group of nested items.
 * @csspart tooltip - The label shown beside a rail item.
 *
 * @cssprop --punica-side-nav-item-height - Minimum block size.
 * @cssprop --punica-side-nav-item-radius - Corner radius.
 * @cssprop --punica-side-nav-item-padding - Inline padding.
 * @cssprop --punica-side-nav-item-indent - Indentation of nested items.
 * @cssprop --punica-side-nav-item-current-background - Background of the current item.
 * @cssprop --punica-side-nav-item-current-color - Text colour of the current item.
 *
 * @cssstate rail - The navigation around it is collapsed.
 * @cssstate has-children - There are nested items.
 */
export class PunicaSideNavItem extends PunicaElement {
  static properties = {
    href: {},
    target: {},
    rel: {},
    current: { type: Boolean },
    disabled: { type: Boolean },
    open: { type: Boolean },
    labelToggle: { default: 'Toggle' }
  };

  static styles = [overlayCss, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base">
      <a part="control" class="control" hidden></a>
      <button part="control" class="control" type="button" hidden></button>
      <span class="content">
        <slot name="start"></slot>
        <span part="label" class="label" id="label"><slot></slot></span>
        <slot name="end"></slot>
        <span part="chevron" class="chevron" hidden>${icons.chevronDown}</span>
      </span>
      <button part="toggle" class="toggle" type="button" aria-controls="children" aria-labelledby="toggle-text label" hidden>
        <span id="toggle-text" class="toggle-text"></span>${icons.chevronDown}
      </button>
    </div>
    <div part="children" class="children" id="children" role="group" aria-labelledby="label" hidden>
      <slot name="children"></slot>
    </div>
    <div part="tooltip" class="tooltip" popover="manual" aria-hidden="true"></div>
  `;

  #link = this.$('a');
  #button = this.$('button.control');
  #content = this.$('.content');
  #chevron = this.$('.chevron');
  #toggle = this.$('.toggle');
  #toggleText = this.$('#toggle-text');
  #children = this.$('.children');
  #childSlot = this.$('slot[name="children"]');
  #labelSlot = this.$('.label slot');
  #tooltip = this.$('.tooltip');
  #overlay = new Overlay(this.#tooltip);
  #hasChildren = false;
  #rail = false;

  constructor() {
    super();
    this.#childSlot.addEventListener('slotchange', () => {
      const has = this.#childSlot.assignedElements().length > 0;
      if (has === this.#hasChildren) return;
      this.#hasChildren = has;
      this.requestUpdate();
    });
    this.#button.addEventListener('click', () => {
      if (this.#hasChildren && !this.#rail) this.#userToggle();
    });
    this.#toggle.addEventListener('click', () => this.#userToggle());
    for (const control of [this.#link, this.#button]) {
      control.addEventListener('pointerenter', () => this.#showTooltip(control));
      control.addEventListener('pointerleave', () => this.#overlay.hide());
      control.addEventListener('focus', () => {
        if (control.matches(':focus-visible')) this.#showTooltip(control);
      });
      control.addEventListener('blur', () => this.#overlay.hide());
      control.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.#overlay.hide();
      });
    }
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

  disconnected() {
    this.#overlay.hide();
  }

  update() {
    const rail = !!(/** @type {any} */ (this.closest('punica-side-nav'))?.collapsed);
    const has = this.#hasChildren;
    const asLink = !!this.href;
    const control = asLink ? this.#link : this.#button;
    const other = asLink ? this.#button : this.#link;
    this.#rail = rail;
    this.toggleState('rail', rail);
    this.toggleState('has-children', has);
    if (!rail) this.#overlay.hide();

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
      // A link with nowhere to go: still a link to assistive technology.
      link.removeAttribute('href');
      link.setAttribute('role', 'link');
      link.setAttribute('aria-disabled', 'true');
    }
    for (const name of ['target', 'rel']) {
      if (this[name]) link.setAttribute(name, this[name]);
      else link.removeAttribute(name);
    }

    const button = this.#button;
    const disclosure = has && !asLink && !rail;
    button.disabled = this.disabled;
    if (disclosure) {
      button.setAttribute('aria-expanded', String(this.open));
      button.setAttribute('aria-controls', 'children');
    } else {
      button.removeAttribute('aria-expanded');
      button.removeAttribute('aria-controls');
    }
    this.#chevron.hidden = !disclosure;

    this.#toggle.hidden = !(has && asLink && !rail);
    this.#toggle.disabled = this.disabled;
    this.#toggle.setAttribute('aria-expanded', String(this.open));
    this.#toggleText.textContent = this.labelToggle;
    this.#children.hidden = !has || !this.open || rail;
  }

  #userToggle() {
    if (this.disabled) return;
    this.open = !this.open;
    this.emit('toggle', { open: this.open });
  }

  /** @param {HTMLElement} control */
  #showTooltip(control) {
    if (!this.#rail || !this.isConnected) return;
    const text = this.text;
    if (!text) return;
    this.#tooltip.textContent = text;
    this.#overlay.show(control, { side: 'inline-end', align: 'center', offset: 8 });
  }
}

define('punica-side-nav-item', PunicaSideNavItem);
