import { PunicaElement, define } from '../../core/element.js';
import styles from './avatar.css';

/**
 * The first letter of the first word and of the last, upper-cased in the
 * given language.
 * @param {string | null} name
 * @param {string} language
 */
function initials(name, language) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = [...words[0]][0];
  const last = words.length > 1 ? [...words[words.length - 1]][0] : '';
  return (first + last).toLocaleUpperCase(language);
}

/**
 * A person or a thing as a picture, or as initials when there is none.
 *
 * @element punica-avatar
 *
 * @attr {string} src - Address of the picture.
 * @attr {string} name - Whose avatar it is. Gives the initials shown while the picture is missing or fails, and the accessible name.
 * @attr {string} label - Accessible name; wins over `alt` and `name`.
 * @attr {string} alt - Accessible name, as on `<img>`; wins over `name`.
 * @attr {'small' | 'medium' | 'large'} size - Diameter, `medium` by default.
 * @attr {'circle' | 'square'} shape - Outline, `circle` by default.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Background behind initials, `neutral` by default.
 *
 * @slot - What to show with no picture and no name, an icon.
 * @slot status - A mark at the corner, a `punica-status-dot`.
 *
 * @csspart base - The clipped shape.
 * @csspart image - The picture.
 * @csspart initials - The initials.
 * @csspart status - The wrapper at the corner.
 *
 * @cssprop --punica-avatar-size - Diameter.
 * @cssprop --punica-avatar-radius - Corner radius of a square avatar.
 * @cssprop --punica-avatar-background - Background behind initials.
 * @cssprop --punica-avatar-color - Colour of the initials.
 *
 * @cssstate image - The picture loaded and is showing.
 * @cssstate initials - Initials are showing.
 */
export class PunicaAvatar extends PunicaElement {
  static properties = {
    src: {},
    name: {},
    label: {},
    alt: {},
    size: {},
    shape: {},
    color: {}
  };

  static styles = styles;
  static template = `
    <span part="base" class="base">
      <img part="image" class="image" alt="" hidden>
      <span part="initials" class="initials" aria-hidden="true"></span>
      <slot></slot>
    </span>
    <span part="status" class="status"><slot name="status"></slot></span>
  `;

  #image = this.$('.image');
  #initials = this.$('.initials');
  #loaded = false;

  constructor() {
    super();
    this.#image.addEventListener('load', () => this.#show(true));
    this.#image.addEventListener('error', () => this.#show(false));
  }

  update(changed) {
    if (changed.has('src')) {
      this.#show(false);
      if (this.src) this.#image.setAttribute('src', this.src);
      else this.#image.removeAttribute('src');
    }
    const language = this.closest('[lang]')?.lang || navigator.language;
    this.#initials.textContent = initials(this.name, language);
    this.#states();

    const name = this.label || this.alt || this.name;
    this.internals.role = name ? 'img' : null;
    this.internals.ariaLabel = name || null;
  }

  #show(loaded) {
    this.#loaded = loaded;
    this.#image.hidden = !loaded;
    this.#states();
  }

  #states() {
    this.toggleState('image', this.#loaded);
    this.toggleState('initials', !this.#loaded && this.#initials.textContent !== '');
  }
}

define('punica-avatar', PunicaAvatar);
