import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import '../menu/menu.js';
import styles from './splitButton.css';

/**
 * A button for the usual action joined to a menu button for the others.
 *
 * It looks like a `punica-button` and takes the same `variant`, `color` and
 * `size`. The menu is a `punica-menu`: its items are the children given
 * `slot="menu"`.
 *
 * @element punica-split-button
 *
 * @attr {'filled' | 'outlined' | 'text'} variant - Visual weight, `filled` by default.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `primary` by default.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} disabled - Neither button takes clicks or focus.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label - Accessible name of the primary button, for one with no text.
 * @attr {string} label-menu - Accessible name of the menu button, `More options` by default.
 *
 * @slot - The primary button's label.
 * @slot menu - The menu's items: `punica-menu-item` and its siblings.
 *
 * @fires punica-action - The primary button was activated. `detail` is `{}`.
 * @fires punica-select - A menu item was chosen. `detail` is `{ value, item }`. Cancelable: preventing it keeps the menu open.
 * @fires punica-open - The menu opened.
 * @fires punica-close - The menu closed. `detail.reason` is `select`, `escape`, `outside`, `tab` or `api`.
 *
 * @csspart base - The wrapper around both buttons.
 * @csspart primary - The primary button.
 * @csspart toggle - The menu button.
 * @csspart menu - The `punica-menu`.
 *
 * @cssprop --punica-split-button-radius - Corner radius of the outer corners.
 * @cssprop --punica-split-button-height - Minimum block size.
 * @cssprop --punica-split-button-padding - Inline padding of the primary button.
 */
export class PunicaSplitButton extends PunicaElement {
  static properties = {
    variant: {},
    color: {},
    size: {},
    disabled: { type: Boolean },
    fullWidth: { type: Boolean },
    label: {},
    labelMenu: { default: 'More options' }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="group" role="group">
      <button part="primary" type="button"><slot></slot></button>
      <punica-menu part="menu" align="end">
        <button slot="trigger" part="toggle" type="button">${icons.chevronDown}</button>
        <slot name="menu"></slot>
      </punica-menu>
    </div>
  `;

  #primary = this.$('[part="primary"]');
  #toggle = this.$('[part="toggle"]');

  constructor() {
    super();
    this.#primary.addEventListener('click', () => this.emit('action', {}));
  }

  /** The `punica-menu` that holds the other actions. */
  get menu() {
    return this.$('punica-menu');
  }

  /** Moves focus to the primary button. */
  focus(options) {
    this.#primary.focus(options);
  }

  update() {
    this.#primary.disabled = this.disabled;
    this.#toggle.disabled = this.disabled;
    if (this.label) this.#primary.setAttribute('aria-label', this.label);
    else this.#primary.removeAttribute('aria-label');
    this.#toggle.setAttribute('aria-label', this.labelMenu);
    this.menu.label = this.labelMenu;
    if (this.disabled) this.menu.hide?.();
  }
}

define('punica-split-button', PunicaSplitButton);
