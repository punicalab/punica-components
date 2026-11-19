import { PunicaElement, define } from '../../core/element.js';
import styles from './card.css';

/** Schemes that run script when followed; such an `href` is dropped. */
const SCRIPT_SCHEME = /^(javascript|vbscript):$/i;

function set(el, name, value) {
  if (value == null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

/**
 * A surface that groups what belongs to one thing: a header, media, content
 * and actions.
 *
 * An `interactive` card is one control: a native button, or a native link
 * when it has an `href`. Put no other control inside an interactive card.
 *
 * @element punica-card
 *
 * @attr {'elevated' | 'outlined' | 'filled'} variant - How the card stands off the page, `elevated` by default.
 * @attr {boolean} interactive - The whole card is one button, or one link with `href`.
 * @attr {string} href - Where an interactive card goes. A `javascript:` URL is dropped.
 * @attr {string} target - Browsing context of the link.
 * @attr {string} rel - Link types; `noopener` is added for `target="_blank"`.
 * @attr {boolean} disabled - An interactive card takes no clicks and no focus.
 * @attr {string} label - Accessible name of an interactive card, in place of its whole content.
 *
 * @slot - `punica-card-header`, `punica-card-media`, `punica-card-content`, `punica-card-actions`, or anything else.
 *
 * @csspart base - The surface: a `div`, or the native `button` or `a` of an interactive card.
 *
 * @cssprop --punica-card-radius - Corner radius.
 * @cssprop --punica-card-background - Background.
 * @cssprop --punica-card-shadow - Shadow of an elevated card.
 * @cssprop --punica-card-border-color - Border of an outlined card.
 */
export class PunicaCard extends PunicaElement {
  static properties = {
    variant: {},
    href: {},
    target: {},
    rel: {},
    label: {},
    interactive: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `<div part="base" class="base"><slot></slot></div>`;

  #base = this.$('.base');

  update() {
    const href = this.interactive && !this.disabled ? this.#safeHref() : null;
    const tag = !this.interactive ? 'div' : href != null ? 'a' : 'button';
    if (this.#base.localName !== tag) {
      const next = document.createElement(tag);
      next.className = 'base';
      next.part.add('base');
      next.append(...this.#base.childNodes);
      this.#base.replaceWith(next);
      this.#base = next;
    }
    const base = this.#base;
    if (tag === 'a') {
      set(base, 'href', href);
      set(base, 'target', this.target);
      set(base, 'rel', this.#rel());
    } else if (tag === 'button') {
      /** @type {HTMLButtonElement} */ (base).type = 'button';
      /** @type {HTMLButtonElement} */ (base).disabled = this.disabled;
    }
    set(base, 'aria-label', this.interactive ? this.label : null);
  }

  /** Moves focus to an interactive card. */
  focus(options) {
    if (this.interactive) this.#base.focus(options);
  }

  /** Activates an interactive card the way a click would. */
  click() {
    if (this.interactive) this.#base.click();
    else super.click();
  }

  #safeHref() {
    const href = this.href;
    if (href == null) return null;
    try {
      if (SCRIPT_SCHEME.test(new URL(href, document.baseURI).protocol)) return null;
    } catch {
      return null;
    }
    return href;
  }

  #rel() {
    const types = (this.rel ?? '').split(/\s+/).filter(Boolean);
    if (this.target?.toLowerCase() === '_blank' && !types.some((t) => t.toLowerCase() === 'noopener')) {
      types.push('noopener');
    }
    return types.length ? types.join(' ') : null;
  }
}

define('punica-card', PunicaCard);
