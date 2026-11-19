import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './menuItem.css';

/**
 * One action of a `punica-menu`.
 *
 * A `punica-menu` in its `submenu` slot makes it a submenu's parent: it then
 * opens that menu instead of being chosen.
 *
 * @element punica-menu-item
 *
 * @attr {string} value - Reported in `punica-select`; the item's text when absent.
 * @attr {boolean} disabled - Cannot be chosen and is skipped by the keyboard.
 *
 * @prop {HTMLElement | null} submenu - The `punica-menu` in the `submenu` slot (read-only).
 * @prop {string} labelText - The item's own text, used by type-ahead (read-only).
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 * @slot end - Content after the label, a keyboard shortcut.
 * @slot submenu - A `punica-menu` this item opens.
 *
 * @csspart label - The wrapper around the label.
 * @csspart submenu-icon - The arrow of an item with a submenu.
 *
 * @cssprop --punica-menu-item-radius - Corner radius.
 * @cssprop --punica-menu-item-padding - Padding.
 * @cssprop --punica-menu-item-highlight - Background while hovered or focused.
 *
 * @cssstate has-submenu - The item opens a submenu.
 * @cssstate submenu-open - Its submenu is showing.
 */
export class PunicaMenuItem extends PunicaElement {
  static properties = {
    value: {},
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <slot name="start"></slot>
    <span part="label" class="label"><slot></slot></span>
    <slot name="end"></slot>
    <span part="submenu-icon" class="chevron" aria-hidden="true">${icons.chevronEnd}</span>
    <slot name="submenu"></slot>
  `;

  /** ARIA role of the item. */
  static role = 'menuitem';

  #submenuSlot = this.$('slot[name="submenu"]');

  constructor() {
    super();
    const slot = this.#submenuSlot;
    if (!slot) return;
    slot.addEventListener('slotchange', () => this.requestUpdate());
    for (const type of ['punica-open', 'punica-close']) {
      slot.addEventListener(type, (event) => {
        if (event.target !== this.submenu) return;
        const open = type === 'punica-open';
        this.internals.ariaExpanded = String(open);
        this.toggleState('submenu-open', open);
      });
    }
  }

  /** The menu this item opens, if it has one. */
  get submenu() {
    const el = this.#submenuSlot?.assignedElements()[0];
    return el && el.localName === 'punica-menu' ? /** @type {any} */ (el) : null;
  }

  /** The item's own text, without its submenu's. */
  get labelText() {
    return this.$('.label slot')
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent)
      .join('')
      .trim();
  }

  /** What choosing the item does to the item itself: nothing for a plain one. */
  activate() {}

  connected() {
    this.internals.role = /** @type {typeof PunicaMenuItem} */ (this.constructor).role;
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  update() {
    this.internals.ariaDisabled = this.disabled ? 'true' : null;
    const sub = this.submenu;
    this.toggleState('has-submenu', !!sub);
    this.internals.ariaHasPopup = sub ? 'menu' : null;
    if (!sub) this.internals.ariaExpanded = null;
    else if (this.internals.ariaExpanded == null) this.internals.ariaExpanded = 'false';
  }
}

define('punica-menu-item', PunicaMenuItem);
