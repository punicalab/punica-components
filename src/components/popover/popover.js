import { PunicaElement, define } from '../../core/element.js';
import { Overlay, overlayCss } from '../../core/overlay.js';
import { firstFocusable, deepActiveElement, composedContains } from '../../core/a11y.js';
import styles from './popover.css';

/**
 * A panel that opens in the top layer beside an anchor.
 *
 * The anchor is the element in the `trigger` slot, which toggles the panel on
 * click, or any element handed to `anchor`. A click outside or Escape closes
 * it and focus goes back to where it was.
 *
 * @element punica-popover
 *
 * @attr {boolean} open - The panel is showing.
 * @attr {'block-end' | 'block-start' | 'inline-end' | 'inline-start'} side - Side of the anchor the panel opens on, `block-end` by default.
 * @attr {'start' | 'center' | 'end'} align - Alignment along that side, `start` by default.
 * @attr {number} offset - Gap between anchor and panel in px, 4 by default.
 * @attr {boolean} match-width - The panel is at least as wide as the anchor.
 * @attr {boolean} manual - Outside clicks and Escape do not close it.
 * @attr {boolean} no-focus - Opening does not move focus into the panel.
 * @attr {string} for - Id of the anchor element, in the same tree.
 * @attr {string} label - Accessible name of the panel.
 * @attr {string} panel-role - ARIA role of the panel, `dialog` by default.
 *
 * @prop {Element | null} anchor - The anchor element; wins over `for` and the trigger slot.
 *
 * @slot - The panel's content.
 * @slot trigger - The element that opens the panel and anchors it.
 *
 * @fires punica-open - The panel opened.
 * @fires {{ reason: 'escape' | 'outside' | 'api' }} punica-close - The panel closed. `detail.reason` is `escape`, `outside` or `api`.
 *
 * @csspart panel - The floating panel.
 *
 * @cssprop --punica-popover-radius - Corner radius.
 * @cssprop --punica-popover-padding - Padding of the panel.
 * @cssprop --punica-popover-background - Panel background.
 * @cssprop --punica-popover-shadow - Panel shadow.
 * @cssprop --punica-popover-max-width - Largest inline size.
 */
export class PunicaPopover extends PunicaElement {
  static properties = {
    open: { type: Boolean },
    side: { default: 'block-end' },
    align: { default: 'start' },
    offset: { type: Number, default: 4 },
    matchWidth: { type: Boolean },
    manual: { type: Boolean },
    noFocus: { type: Boolean },
    for: {},
    label: {},
    panelRole: { default: 'dialog' },
    anchor: { type: Object, attribute: false },
    point: { type: Object, attribute: false }
  };

  static styles = [overlayCss, styles];
  static template = `
    <slot name="trigger"></slot>
    <div part="panel" popover="manual" tabindex="-1"><slot></slot></div>
  `;

  #panel = this.$('[part="panel"]');
  #triggerSlot = this.$('slot[name="trigger"]');
  #overlay = new Overlay(this.#panel);
  /** @type {Element | null} */
  #returnFocus = null;
  /** @type {AbortController | null} */
  #openAbort = null;
  #shown = false;

  constructor() {
    super();
    this.#triggerSlot.addEventListener('click', () => {
      if (!this.#trigger?.hasAttribute('disabled')) this.toggle();
    });
  }

  get #trigger() {
    return this.#triggerSlot.assignedElements({ flatten: true })[0] || null;
  }

  /** The element the panel is placed against. */
  get anchorElement() {
    if (this.anchor) return this.anchor;
    if (this.for) {
      const root = /** @type {Document | ShadowRoot} */ (this.getRootNode());
      const found = root.getElementById?.(this.for);
      if (found) return found;
    }
    return this.#trigger || this;
  }

  /** The floating panel element. */
  get panel() {
    return this.#panel;
  }

  show() {
    this.open = true;
  }

  /** @param {'escape' | 'outside' | 'api'} [reason] */
  hide(reason = 'api') {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  toggle() {
    if (this.open) this.hide();
    else this.show();
  }

  /** Re-measure after the content changed size. */
  reposition() {
    this.#overlay.reposition();
  }

  #reason = 'api';

  disconnected() {
    this.#teardown();
  }

  update(changed) {
    const panel = this.#panel;
    panel.setAttribute('role', this.panelRole);
    if (this.label) panel.setAttribute('aria-label', this.label);
    else panel.removeAttribute('aria-label');
    const trigger = this.#trigger;
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(this.open));
      if (this.panelRole !== 'tooltip') trigger.setAttribute('aria-haspopup', this.panelRole);
    }

    if (this.open && !this.#shown) this.#setup();
    else if (!this.open && this.#shown) this.#teardown(true);
    else if (this.open && (changed.has('side') || changed.has('align') || changed.has('offset') || changed.has('anchor') || changed.has('point'))) {
      this.#place();
    }
  }

  #place() {
    this.#overlay.show(this.point ? null : this.anchorElement, {
      side: /** @type {any} */ (this.side),
      align: /** @type {any} */ (this.align),
      offset: this.offset,
      matchWidth: this.matchWidth,
      point: /** @type {any} */ (this.point) || undefined
    });
  }

  #setup() {
    this.#shown = true;
    this.#returnFocus = deepActiveElement();
    this.#place();
    this.#openAbort = new AbortController();
    const signal = this.#openAbort.signal;
    if (!this.manual) {
      document.addEventListener(
        'pointerdown',
        (event) => {
          const path = event.composedPath();
          if (path.includes(this) || path.includes(this.#panel)) return;
          const anchor = this.anchorElement;
          if (anchor && path.includes(anchor)) return;
          this.hide('outside');
        },
        { capture: true, signal }
      );
      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key !== 'Escape' || event.defaultPrevented) return;
          event.preventDefault();
          this.hide('escape');
        },
        { signal }
      );
    }
    if (!this.noFocus) {
      const target = firstFocusable(this.#panel) || this.#panel;
      target.focus({ preventScroll: true });
    }
    this.emit('open');
  }

  /** @param {boolean} [announce] */
  #teardown(announce) {
    if (!this.#shown) return;
    this.#shown = false;
    this.#openAbort?.abort();
    this.#openAbort = null;
    this.#overlay.hide();
    const back = this.#returnFocus;
    this.#returnFocus = null;
    if (announce) {
      const reason = this.#reason;
      this.#reason = 'api';
      const active = deepActiveElement();
      const inside = active && (composedContains(this, active) || composedContains(this.#panel, active) || active === document.body);
      if (reason !== 'outside' && inside && back instanceof HTMLElement && back.isConnected) {
        back.focus({ preventScroll: true });
      }
      this.emit('close', { reason });
    } else {
      // Disconnected while open: stay open for a reconnect.
      this.#shown = false;
    }
  }

  connected() {
    // Moved while open: open again in the new place.
    if (this.open && !this.#shown) queueMicrotask(() => this.isConnected && this.open && !this.#shown && this.#setup());
  }
}

define('punica-popover', PunicaPopover);
