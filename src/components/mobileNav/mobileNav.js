import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { ModalSurface } from '../dialog/modalSurface.js';
import styles from './mobileNav.css';

/**
 * The navigation of an app on a narrow screen: a panel that slides in from
 * the inline-start edge.
 *
 * It is a native `<dialog>` opened with `showModal()`: the page behind is
 * inert, focus stays inside, Escape closes it and focus returns to the
 * element that opened it. The element in the `trigger` slot opens it on
 * click and carries `aria-expanded`. Activating a link inside closes it, so
 * a single-page app that changes the view without loading a page is left
 * with the view, not the drawer.
 *
 * @element punica-mobile-nav
 *
 * @attr {string} label - Accessible name of the drawer, `Navigation` by default.
 * @attr {boolean} open - The drawer is showing.
 * @attr {'inline-start' | 'inline-end'} side - Edge it slides from, `inline-start` by default.
 * @attr {boolean} no-light-dismiss - A click on the backdrop does not close it.
 * @attr {boolean} no-close-button - Hides the close button.
 * @attr {boolean} keep-open - Activating a link inside does not close it.
 * @attr {string} label-close - Accessible name of the close button, `Close` by default.
 *
 * @prop {string} returnValue - The value given to `hide()` or `requestClose()` when it last closed (read-only).
 *
 * @slot - The navigation: a `punica-side-nav`, a `<nav>` of links.
 * @slot header - Beside the close button: a brand, a title.
 * @slot trigger - The button that opens the drawer.
 *
 * @fires punica-open - The drawer opened.
 * @fires {{ reason: 'escape' | 'backdrop' | 'close-button' | 'navigate' | 'api' | (string & {}) }} punica-request-close - The user asked to close it. `detail` is `{ reason }`. Cancelable: preventing it keeps the drawer open.
 * @fires {{ reason: 'escape' | 'backdrop' | 'close-button' | 'navigate' | 'api' | (string & {}), returnValue: string }} punica-close - The drawer closed. `detail` is `{ reason, returnValue }`; `reason` is `escape`, `backdrop`, `close-button`, `navigate` (a link inside was activated) or `api`.
 *
 * @csspart dialog - The native dialog, the sliding panel.
 * @csspart header - The row holding the header slot and the close button.
 * @csspart body - The scrolling body.
 * @csspart close-button - The close button.
 *
 * @cssprop --punica-mobile-nav-width - Inline size of the panel, capped at 85% of the viewport.
 * @cssprop --punica-mobile-nav-padding - Padding of the header and the body.
 * @cssprop --punica-mobile-nav-background - Background.
 * @cssprop --punica-mobile-nav-backdrop - Colour of the backdrop.
 * @cssprop --punica-mobile-nav-shadow - Shadow.
 */
export class PunicaMobileNav extends ModalSurface(PunicaElement) {
  static properties = {
    label: { default: 'Navigation' },
    side: { default: 'inline-start' },
    noCloseButton: { type: Boolean },
    keepOpen: { type: Boolean },
    labelClose: { default: 'Close' }
  };

  static styles = styles;
  static template = `
    <slot name="trigger"></slot>
    <dialog part="dialog">
      <div part="header">
        <div class="title"><slot name="header"></slot></div>
        <button part="close-button" class="close" type="button">${icons.close}</button>
      </div>
      <div part="body"><slot></slot></div>
    </dialog>
  `;

  #close = this.$('.close');
  #triggerSlot = this.$('slot[name="trigger"]');
  #headerSlot = this.$('slot[name="header"]');

  constructor() {
    super();
    this.#close.addEventListener('click', () => this.requestClose('close-button'));
    this.#triggerSlot.addEventListener('click', () => {
      const trigger = this.#trigger;
      if (!trigger || trigger.hasAttribute('disabled')) return;
      this.open = !this.open;
    });
    this.#triggerSlot.addEventListener('slotchange', () => this.requestUpdate());
    this.#headerSlot.addEventListener('slotchange', () => this.requestUpdate());
    this.dialogElement.addEventListener('click', (event) => {
      if (this.keepOpen || event.defaultPrevented || !this.open) return;
      if (/** @type {MouseEvent} */ (event).button) return;
      const link = event
        .composedPath()
        .find((node) => node instanceof HTMLAnchorElement && node.hasAttribute('href'));
      if (link) this.requestClose('navigate');
    });
  }

  get #trigger() {
    return this.#triggerSlot.assignedElements({ flatten: true })[0] || null;
  }

  update(changed) {
    super.update(changed);
    this.#close.setAttribute('aria-label', this.labelClose);
    const noHeader = !this.#headerSlot.assignedNodes({ flatten: true }).length && this.noCloseButton;
    this.$('[part="header"]').hidden = noHeader;
    const trigger = this.#trigger;
    if (trigger) {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', String(this.open));
    }
  }

  surfaceClosed() {
    // The trigger follows a close the user made.
    this.#trigger?.setAttribute('aria-expanded', 'false');
  }
}

define('punica-mobile-nav', PunicaMobileNav);
