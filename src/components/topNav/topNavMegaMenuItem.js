import { PunicaElement, define } from '../../core/element.js';
import styles from './topNavMegaMenuItem.css';

/**
 * One link of a `punica-top-nav-mega-menu`: a title, a line that says what
 * is behind it, and an icon.
 *
 * With `href` it is a native link, without one a native button. Its
 * accessible name is its visible text: the title, then the line under it.
 *
 * @element punica-top-nav-mega-menu-item
 *
 * @attr {string} href - Where the item leads; makes it a link.
 * @attr {string} target - Browsing context of the link.
 * @attr {string} rel - Link relation of the link.
 * @attr {string} description - A line under the title.
 * @attr {boolean} current - The item is the page the user is on (`aria-current="page"`).
 * @attr {boolean} disabled - Takes no activation and no focus.
 *
 * @slot - The title.
 * @slot start - Before the title: an icon.
 * @slot description - The line under the title, in place of the `description` attribute.
 *
 * @csspart control - The native `<a>` or `<button>`.
 * @csspart icon - The wrapper of the `start` slot.
 * @csspart label - The title.
 * @csspart description - The line under it.
 *
 * @cssprop --punica-top-nav-mega-menu-item-radius - Corner radius.
 * @cssprop --punica-top-nav-mega-menu-item-padding - Padding.
 * @cssprop --punica-top-nav-mega-menu-item-icon-background - Background of the icon's tile.
 * @cssprop --punica-top-nav-mega-menu-item-icon-color - Colour of the icon.
 */
export class PunicaTopNavMegaMenuItem extends PunicaElement {
  static properties = {
    href: {},
    target: {},
    rel: {},
    description: {},
    current: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <a part="control" class="control" hidden></a>
    <button part="control" class="control" type="button" hidden></button>
    <span class="content">
      <span part="icon" class="icon"><slot name="start"></slot></span>
      <span class="text">
        <span part="label" class="label"><slot></slot></span>
        <span part="description" class="description"><slot name="description"><span class="description-text"></span></slot></span>
      </span>
    </span>
  `;

  #link = this.$('a');
  #button = this.$('button');
  #content = this.$('.content');
  #icon = this.$('.icon');
  #description = this.$('.description');
  #descriptionText = this.$('.description-text');
  #startSlot = this.$('slot[name="start"]');
  #descriptionSlot = this.$('slot[name="description"]');

  constructor() {
    super();
    this.#startSlot.addEventListener('slotchange', () => this.requestUpdate());
    this.#descriptionSlot.addEventListener('slotchange', () => this.requestUpdate());
  }

  update() {
    const asLink = !!this.href;
    const control = asLink ? this.#link : this.#button;
    const other = asLink ? this.#button : this.#link;
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
    this.#button.disabled = this.disabled;

    this.#descriptionText.textContent = this.description ?? '';
    const hasDescription = !!this.description || this.#descriptionSlot.assignedNodes().length > 0;
    this.#description.hidden = !hasDescription;

    this.#icon.hidden = !this.#startSlot.assignedNodes({ flatten: true }).length;
  }
}

define('punica-top-nav-mega-menu-item', PunicaTopNavMegaMenuItem);
