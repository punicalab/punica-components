import { PunicaElement, define } from '../../core/element.js';
import '../skeleton/skeleton.js';
import styles from './thumbnail.css';

const RATIO = /^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?)\s*)?$/;

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * A small preview of an image at a fixed ratio: an attachment, a product, a
 * photo in a grid.
 *
 * While the picture loads a shimmer stands in for it; if it fails, or there
 * is no `src`, a placeholder glyph (or the `fallback` slot) shows. The
 * picture loads lazily by default. With `href` the thumbnail is a link.
 *
 * `alt` is the picture's text alternative. An empty or missing `alt` makes
 * it decorative; a linked thumbnail with no `alt` needs `label`.
 *
 * @element punica-thumbnail
 *
 * @attr {string} src - Address of the picture.
 * @attr {string} srcset - Candidate pictures, as on `<img>`.
 * @attr {string} sizes - Sizes for `srcset`, as on `<img>`.
 * @attr {string} alt - Text alternative; empty or missing makes the picture decorative.
 * @attr {string} ratio - `inline/block` as two positive numbers (`4/3`), or one number; `1/1` by default and for anything else.
 * @attr {'cover' | 'contain'} fit - How the picture fills the box: `cover` crops (the default), `contain` shows all of it.
 * @attr {'small' | 'medium' | 'large'} size - Inline size: 48, 96 (the default) or 160 px.
 * @attr {'none' | 'small' | 'medium' | 'large' | 'full'} radius - Corner radius, `medium` by default.
 * @attr {'lazy' | 'eager'} loading - When the picture loads, `lazy` by default.
 * @attr {string} href - Makes the thumbnail a link to this address.
 * @attr {string} target - Browsing context of the link, as on `<a>`.
 * @attr {string} label - Accessible name of the link, when `alt` does not name it.
 *
 * @slot fallback - Shown when there is no picture or it failed, in place of the placeholder glyph.
 *
 * @fires punica-load - The picture loaded. `detail` is `{ src }`.
 * @fires punica-error - The picture failed to load. `detail` is `{ src }`.
 *
 * @csspart base - The box, a link with `href`.
 * @csspart image - The native img.
 * @csspart skeleton - The shimmer shown while loading.
 * @csspart fallback - The wrapper shown with no picture.
 *
 * @cssprop --punica-thumbnail-size - Inline size; set `100%` to fill the container.
 * @cssprop --punica-thumbnail-radius - Corner radius.
 * @cssprop --punica-thumbnail-background - Background behind a `contain` picture and the fallback.
 *
 * @cssstate loading - The picture is loading.
 * @cssstate loaded - The picture loaded and is showing.
 * @cssstate error - There is no picture or it failed.
 */
export class PunicaThumbnail extends PunicaElement {
  static properties = {
    src: {},
    srcset: {},
    sizes: {},
    alt: {},
    ratio: {},
    fit: {},
    size: {},
    radius: {},
    loading: { default: 'lazy' },
    href: {},
    target: {},
    label: {}
  };

  static styles = styles;
  static template = `
    <a part="base" class="base">
      <img part="image" class="image" decoding="async">
      <punica-skeleton part="skeleton" class="skeleton" variant="rect" width="100%" height="100%"></punica-skeleton>
      <span part="fallback" class="fallback"><slot name="fallback"><svg class="glyph" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg></slot></span>
    </a>
  `;

  #base = this.$('.base');
  #image = this.$('.image');
  #fallback = this.$('.fallback');
  #style = instanceStyle(this.shadowRoot);
  /** @type {'loading' | 'loaded' | 'error'} */
  #state = 'error';

  constructor() {
    super();
    this.#image.addEventListener('load', () => {
      if (!this.#image.getAttribute('src')) return;
      this.#set('loaded');
      this.emit('load', { src: this.#image.currentSrc || this.src });
    });
    this.#image.addEventListener('error', () => {
      if (!this.#image.getAttribute('src')) return;
      this.#set('error');
      this.emit('error', { src: this.src });
    });
  }

  update(changed) {
    const image = this.#image;
    image.loading = this.loading === 'eager' ? 'eager' : 'lazy';
    image.alt = this.alt ?? '';
    for (const name of ['sizes', 'srcset']) {
      if (this[name]) image.setAttribute(name, this[name]);
      else image.removeAttribute(name);
    }
    if (changed.has('src') || changed.has('srcset')) {
      if (this.src || this.srcset) {
        this.#set('loading');
        if (this.src) image.setAttribute('src', this.src);
        else image.removeAttribute('src');
        if (image.complete && image.naturalWidth > 0) this.#set('loaded');
      } else {
        image.removeAttribute('src');
        this.#set('error');
      }
    }

    const base = this.#base;
    if (this.href) {
      base.setAttribute('href', this.href);
      if (this.target) base.setAttribute('target', this.target);
      else base.removeAttribute('target');
    } else {
      base.removeAttribute('href');
      base.removeAttribute('target');
    }
    if (this.href && this.label) base.setAttribute('aria-label', this.label);
    else base.removeAttribute('aria-label');

    const match = RATIO.exec(this.ratio ?? '');
    const inline = match ? Number(match[1]) : 0;
    const block = match ? Number(match[2] ?? 1) : 0;
    if (inline > 0 && block > 0) this.#style.setProperty('--_ratio', `${inline} / ${block}`);
    else this.#style.removeProperty('--_ratio');
    this.#describeFallback();
  }

  /** @param {'loading' | 'loaded' | 'error'} state */
  #set(state) {
    this.#state = state;
    for (const name of ['loading', 'loaded', 'error']) this.toggleState(name, name === state);
    this.#describeFallback();
  }

  /** With the picture gone, its text alternative moves to the fallback. */
  #describeFallback() {
    const fallback = this.#fallback;
    if (this.#state === 'error' && this.alt) {
      fallback.setAttribute('role', 'img');
      fallback.setAttribute('aria-label', this.alt);
      fallback.removeAttribute('aria-hidden');
    } else {
      fallback.removeAttribute('role');
      fallback.removeAttribute('aria-label');
      fallback.setAttribute('aria-hidden', 'true');
    }
  }
}

define('punica-thumbnail', PunicaThumbnail);
