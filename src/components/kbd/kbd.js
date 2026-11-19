import { PunicaElement, define } from '../../core/element.js';
import styles from './kbd.css';

const APPLE = /mac|iphone|ipad|ipod/i;
/** Stands for a literal plus key while the string is split on plus signs. */
const PLUS = '';

/**
 * A key or a shortcut, as the user's keyboard names it.
 *
 * @element punica-kbd
 *
 * @attr {string} keys - A shortcut, its keys joined by `+` (`Mod+Shift+K`). `Mod` is ⌘ on Apple platforms and `label-mod` elsewhere. A trailing `++` is the plus key.
 * @attr {string} label-mod - What `Mod` reads as off Apple platforms, `Ctrl` by default.
 *
 * @slot - One key, when `keys` is not set.
 *
 * @csspart base - The outer `<kbd>`.
 * @csspart key - Each key, a `<kbd>` of its own.
 *
 * @cssprop --punica-kbd-background - Background of a key.
 * @cssprop --punica-kbd-border-color - Border of a key.
 * @cssprop --punica-kbd-radius - Corner radius of a key.
 */
export class PunicaKbd extends PunicaElement {
  static properties = {
    keys: {},
    labelMod: { default: 'Ctrl' }
  };

  static styles = styles;
  static template = `<kbd part="base"><span class="keys"></span><kbd part="key" class="key own"><slot></slot></kbd></kbd>`;

  #keys = this.$('.keys');
  #own = this.$('.own');
  #apple = false;

  connected() {
    const platform = /** @type {any} */ (navigator).userAgentData?.platform || navigator.platform || '';
    const apple = APPLE.test(platform);
    if (apple !== this.#apple) {
      this.#apple = apple;
      this.requestUpdate();
    }
  }

  update() {
    const names = (this.keys ?? '')
      .replace(/\+\+$|^\+$/, `+${PLUS}`)
      .split('+')
      .map((key) => (key === PLUS ? '+' : key.trim()))
      .filter(Boolean);
    this.#own.hidden = names.length > 0;
    this.#keys.replaceChildren(
      ...names.map((name) => {
        const key = document.createElement('kbd');
        key.className = 'key';
        key.part.add('key');
        key.textContent = name.toLowerCase() === 'mod' ? (this.#apple ? '⌘' : this.labelMod) : name;
        return key;
      })
    );
  }
}

define('punica-kbd', PunicaKbd);
