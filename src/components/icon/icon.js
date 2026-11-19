import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './icon.css';

/** Parsed glyphs of the static table, by name. @type {Map<string, Element>} */
const parsed = new Map();

/**
 * A fresh copy of a glyph of the static table, or null for a name that is
 * not in it. The name only ever selects; it is never read as markup.
 * @param {string | null} name
 * @returns {Element | null}
 */
function glyph(name) {
  if (!name || !Object.hasOwn(icons, name)) return null;
  let source = parsed.get(name);
  if (!source) {
    source = new DOMParser().parseFromString(icons[name], 'text/html').body.firstElementChild;
    parsed.set(name, source);
  }
  return document.importNode(source, true);
}

/**
 * An icon: a glyph of the library by `name`, or whatever is slotted, an
 * icon-font element or an inline SVG.
 *
 * @element punica-icon
 *
 * @attr {string} name - A glyph of `src/core/icons.js`: `close`, `check`, `search`, `info`, `warning` and the rest; an unknown name draws nothing.
 * @attr {string} label - Accessible name; the icon is then an image. Without it the icon is hidden from assistive technology.
 * @attr {'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge'} size - Size relative to the surrounding text, `medium` (1em) by default.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Colour; the text colour while unset.
 *
 * @slot - An icon of your own, `<i class="fa-solid fa-user">` or an `<svg>`.
 *
 * @csspart icon - The SVG of a named glyph.
 *
 * @cssprop --punica-icon-size - Size of the icon.
 * @cssprop --punica-icon-color - Colour of the icon.
 */
export class PunicaIcon extends PunicaElement {
  static properties = {
    name: {},
    label: {},
    size: {},
    color: {}
  };

  static styles = styles;
  static template = `<span class="glyph"></span><slot></slot>`;

  #glyph = this.$('.glyph');

  update(changed) {
    if (changed.has('name')) {
      const svg = glyph(this.name);
      if (svg) this.#glyph.replaceChildren(svg);
      else this.#glyph.replaceChildren();
    }
    const internals = this.internals;
    if (this.label) {
      internals.role = 'img';
      internals.ariaLabel = this.label;
      internals.ariaHidden = null;
    } else {
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaHidden = 'true';
    }
  }
}

define('punica-icon', PunicaIcon);
