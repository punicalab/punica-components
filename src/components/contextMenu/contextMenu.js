import { PunicaElement, define } from '../../core/element.js';
import { deepActiveElement } from '../../core/a11y.js';
import '../menu/menu.js';
import styles from './contextMenu.css';

/**
 * A menu that opens where the user asks for a context menu.
 *
 * The default slot is the target area. The menu's items are the children
 * given `slot="menu"`: the same `punica-menu-item`, `punica-menu-checkbox-item`,
 * `punica-menu-radio-group`, `punica-menu-group` and `punica-menu-divider` a
 * `punica-menu` takes, submenus included. It opens at the pointer on
 * `contextmenu` (right click, long press) and beside the focused element on
 * Shift+F10 or the ContextMenu key, and is then operated like any menu.
 *
 * @element punica-context-menu
 *
 * @attr {string} label - Accessible name of the menu.
 * @attr {boolean} open - The menu is showing.
 * @attr {boolean} disabled - The platform's own context menu opens instead.
 *
 * @slot - The area the menu belongs to.
 * @slot menu - The menu's items.
 *
 * @fires punica-select - An item was chosen. `detail` is `{ value, item }`. Cancelable: preventing it keeps the menu open.
 * @fires punica-open - The menu opened.
 * @fires punica-close - The menu closed. `detail.reason` is `select`, `escape`, `outside`, `tab` or `api`.
 *
 * @csspart menu - The `punica-menu` that shows the items; style its panel with `::part(menu)` and the `--punica-menu-*` properties.
 */
export class PunicaContextMenu extends PunicaElement {
  static properties = {
    label: {},
    open: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <slot></slot>
    <punica-menu part="menu" exportparts="panel"><slot name="menu"></slot></punica-menu>
  `;

  #menu;
  #keyboardAt = -Infinity;

  constructor() {
    super();
    this.#menu = this.$('punica-menu');
    const area = this.$('slot:not([name])');
    area.addEventListener('contextmenu', (event) => {
      if (this.disabled) return;
      event.preventDefault();
      // The browser follows Shift+F10 with a contextmenu event of its own.
      if (event.timeStamp - this.#keyboardAt < 200) return;
      this.showAt({ x: event.clientX, y: event.clientY });
    });
    area.addEventListener('keydown', (event) => {
      if (this.disabled) return;
      if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
      event.preventDefault();
      this.#keyboardAt = event.timeStamp;
      const menu = this.#menu;
      menu.point = null;
      menu.anchor = deepActiveElement() || this;
      menu.show({ focus: 'first' });
    });
    // The menu's own surface has no context menu.
    this.#menu.addEventListener('contextmenu', (event) => event.preventDefault());
    for (const type of ['punica-open', 'punica-close']) {
      this.#menu.addEventListener(type, (event) => {
        if (event.target === this.#menu) this.open = type === 'punica-open';
      });
    }
  }

  /**
   * Opens the menu at a viewport point.
   * @param {{ x: number, y: number }} point
   */
  showAt(point) {
    const menu = this.#menu;
    menu.anchor = null;
    menu.point = point;
    menu.show({ focus: 'panel' });
  }

  /** Closes the menu. */
  hide() {
    this.#menu.hide();
  }

  update() {
    const menu = this.#menu;
    menu.label = this.label;
    menu.offset = 0;
    if (menu.open !== this.open) {
      if (this.open) menu.show();
      else menu.hide();
    }
  }
}

define('punica-context-menu', PunicaContextMenu);
