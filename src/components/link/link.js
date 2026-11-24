import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './link.css';

/** Schemes that run script when followed; such an `href` is dropped. */
const SCRIPT_SCHEME = /^(javascript|vbscript):$/i;

/**
 * A hyperlink: a native `<a>` with the library's type and focus ring.
 *
 * @element punica-link
 *
 * @attr {string} href - Where the link goes. A `javascript:` URL is dropped.
 * @attr {string} target - Browsing context, as on `<a>`.
 * @attr {string} rel - Link types, as on `<a>`; `noopener` is added for `target="_blank"`.
 * @attr {string} download - Downloads the target; the value is the suggested file name.
 * @attr {'default' | 'subtle'} variant - `subtle` takes the colour of the surrounding text.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `primary` by default.
 * @attr {'always' | 'hover' | 'none'} underline - When the underline shows, `always` by default.
 * @attr {boolean} external - Marks a link that leaves the site with an icon and a hidden text.
 * @attr {string} label-external - What assistive technology reads after an external link, `external link` by default.
 * @attr {boolean} disabled - Goes nowhere and takes no focus.
 * @attr {string} label - Accessible name, for a link with no text.
 *
 * @slot - The link text.
 *
 * @csspart base - The native anchor.
 * @csspart external-icon - The icon of an external link.
 *
 * @cssstate focus-visible - The native anchor has focus the browser would show a ring for (the keyboard's). The
 *   element itself does not match `:focus-visible`; a page that draws the link with its own class (a card, a row)
 *   puts its ring on the element with `punica-link.x:state(focus-visible)`.
 *
 * @cssprop --punica-link-color - Text colour.
 * @cssprop --punica-link-color-hover - Text colour under the pointer.
 */
export class PunicaLink extends PunicaElement {
  static properties = {
    href: {},
    target: {},
    rel: {},
    download: {},
    variant: {},
    color: {},
    underline: {},
    label: {},
    labelExternal: { default: 'external link' },
    external: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <a part="base"><slot></slot><span class="external" hidden><span part="external-icon" class="external-icon">${icons.externalLink}</span><span class="hidden-text"></span></span></a>
  `;

  #anchor = this.$('a');
  #external = this.$('.external');
  #externalText = this.$('.hidden-text');

  constructor() {
    super();
    // The host matches :focus, never :focus-visible, while its anchor has focus: the state says which focus it is.
    this.#anchor.addEventListener('focus', () => this.toggleState('focus-visible', this.#anchor.matches(':focus-visible')));
    this.#anchor.addEventListener('blur', () => this.toggleState('focus-visible', false));
  }

  update() {
    const a = this.#anchor;
    const href = this.disabled ? null : this.#safeHref();
    set(a, 'href', href);
    set(a, 'target', this.target);
    set(a, 'download', this.download);
    set(a, 'rel', this.#rel());
    set(a, 'aria-label', this.label);
    // A link that goes nowhere is still announced as one, and as unavailable.
    set(a, 'role', this.disabled ? 'link' : null);
    set(a, 'aria-disabled', this.disabled ? 'true' : null);
    this.#external.hidden = !this.external;
    this.#externalText.textContent = this.external ? ` (${this.labelExternal})` : '';
  }

  /** Moves focus to the link. */
  focus(options) {
    this.#anchor.focus(options);
  }

  /** Follows the link the way a click would. */
  click() {
    this.#anchor.click();
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

function set(el, name, value) {
  if (value == null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

define('punica-link', PunicaLink);
