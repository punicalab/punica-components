import { PunicaElement, define } from '../../core/element.js';
import { overlayCss } from '../../core/overlay.js';
import './toast.js';
import styles from './toaster.css';

/**
 * The region toasts appear in, at a corner or edge of the viewport.
 *
 * It is a `popover="manual"` element, so it sits in the top layer above the
 * page, and a polite live region, so a toast added to it is announced. Its
 * children are `punica-toast` elements; `toast()` adds one to the page's
 * toaster.
 *
 * @element punica-toaster
 *
 * @attr {'block-end-end' | 'block-end-center' | 'block-end-start' | 'block-start-end' | 'block-start-center' | 'block-start-start'} position - Block edge, then inline alignment; `block-end-end` by default.
 * @attr {string} label - Accessible name of the region, `Notifications` by default.
 *
 * @slot - The toasts.
 *
 * @csspart region - The live region holding the toasts.
 *
 * @cssprop --punica-toaster-gap - Gap between toasts.
 * @cssprop --punica-toaster-offset - Distance from the viewport's edges.
 */
export class PunicaToaster extends PunicaElement {
  static properties = {
    position: { default: 'block-end-end' },
    label: { default: 'Notifications' }
  };

  static styles = [overlayCss, styles];
  static template = `<div part="region" popover="manual" role="region" aria-live="polite" aria-relevant="additions"><slot></slot></div>`;

  #region = this.$('[part="region"]');
  #slot = this.$('slot');

  constructor() {
    super();
    this.#slot.addEventListener('slotchange', () => this.#sync());
  }

  /**
   * Adds a toast holding a text message.
   * @param {string} message set as text, never parsed as markup
   * @param {{ color?: string, duration?: number, labelClose?: string, noCloseButton?: boolean }} [options]
   * @returns {HTMLElement} the `punica-toast`
   */
  add(message, options = {}) {
    const el = /** @type {any} */ (document.createElement('punica-toast'));
    el.textContent = String(message ?? '');
    if (options.color != null) el.color = options.color;
    if (options.duration != null) el.duration = options.duration;
    if (options.labelClose != null) el.labelClose = options.labelClose;
    if (options.noCloseButton != null) el.noCloseButton = options.noCloseButton;
    this.appendChild(el);
    return el;
  }

  connected() {
    queueMicrotask(() => this.#sync());
  }

  update() {
    this.#region.setAttribute('aria-label', this.label);
  }

  /** The region is in the top layer only while it holds a toast. */
  #sync() {
    if (!this.isConnected) return;
    const region = this.#region;
    const want = this.#slot.assignedElements({ flatten: true }).length > 0;
    if (typeof region.showPopover !== 'function') {
      region.toggleAttribute('data-open', want);
      return;
    }
    const open = region.matches(':popover-open');
    if (want && !open) region.showPopover();
    else if (!want && open) region.hidePopover();
  }
}

define('punica-toaster', PunicaToaster);

/**
 * Shows a toast in the page's toaster.
 *
 * The toaster is the first `punica-toaster` in the document; when the page
 * has none, one is created and appended to `<body>`. That element is the one
 * thing this library ever adds to the body, and only on this call.
 *
 * @param {string} message set as text, never parsed as markup
 * @param {{ color?: string, duration?: number, labelClose?: string, noCloseButton?: boolean, toaster?: HTMLElement }} [options]
 *   `toaster` names the toaster to use instead.
 * @returns {HTMLElement} the `punica-toast`; listen on it for `punica-dismiss`
 */
export function toast(message, options = {}) {
  let toaster = /** @type {any} */ (options.toaster || document.querySelector('punica-toaster'));
  if (!toaster) {
    toaster = document.createElement('punica-toaster');
    // audit-allow: portal-to-body (toast() makes the page's one toaster when the page has none)
    document.body.appendChild(toaster);
  }
  return toaster.add(message, options);
}
