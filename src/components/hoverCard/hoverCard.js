import { PunicaElement, define } from '../../core/element.js';
import { Overlay, overlayCss } from '../../core/overlay.js';
import { deepActiveElement, composedContains } from '../../core/a11y.js';
import styles from './hoverCard.css';

/**
 * A panel of rich content that opens while the pointer or keyboard focus
 * rests on its trigger, and stays open while either is inside the panel.
 *
 * Unlike a tooltip the panel may hold links and buttons: it is a non-modal
 * `role=dialog` named by `label`, and Tab moves from the trigger into it.
 * Escape closes it and puts focus back on the trigger.
 *
 * @element punica-hover-card
 *
 * @attr {string} label - Accessible name of the panel.
 * @attr {boolean} open - The panel is showing.
 * @attr {'block-end' | 'block-start' | 'inline-end' | 'inline-start'} side - Side of the trigger it opens on, `block-end` by default.
 * @attr {'start' | 'center' | 'end'} align - Alignment along that side, `start` by default.
 * @attr {number} delay - Milliseconds the pointer rests on the trigger before it opens, 400 by default.
 * @attr {number} close-delay - Milliseconds after the pointer left before it closes, 200 by default.
 * @attr {number} offset - Gap between trigger and panel in px, 8 by default.
 * @attr {boolean} disabled - Hover and focus do not open it.
 *
 * @slot - The panel's content.
 * @slot trigger - The element the card belongs to.
 *
 * @fires punica-open - The panel opened.
 * @fires {{ reason: 'pointer' | 'blur' | 'escape' | 'api' }} punica-close - The panel closed. `detail.reason` is `pointer`, `blur`, `escape` or `api`.
 *
 * @csspart panel - The floating panel.
 *
 * @cssprop --punica-hover-card-radius - Corner radius.
 * @cssprop --punica-hover-card-padding - Padding.
 * @cssprop --punica-hover-card-background - Background.
 * @cssprop --punica-hover-card-shadow - Shadow.
 * @cssprop --punica-hover-card-max-width - Largest inline size.
 */
export class PunicaHoverCard extends PunicaElement {
  static properties = {
    label: {},
    open: { type: Boolean },
    side: { default: 'block-end' },
    align: { default: 'start' },
    delay: { type: Number, default: 400 },
    closeDelay: { type: Number, default: 200 },
    offset: { type: Number, default: 8 },
    disabled: { type: Boolean }
  };

  static styles = [overlayCss, styles];
  static template = `
    <slot name="trigger"></slot>
    <div part="panel" popover="manual" role="dialog" tabindex="-1"><slot></slot></div>
  `;

  #panel = this.$('[part="panel"]');
  #triggerSlot = this.$('slot[name="trigger"]');
  #overlay = new Overlay(this.#panel);
  #showTimer = 0;
  #hideTimer = 0;
  #shown = false;
  #reason = 'api';
  #restoring = false;
  /** @type {AbortController | null} */
  #openAbort = null;

  constructor() {
    super();
    const trigger = this.#triggerSlot;
    const panel = this.#panel;
    trigger.addEventListener('slotchange', () => this.requestUpdate());
    trigger.addEventListener('pointerover', (event) => {
      if (event.pointerType !== 'touch') this.#schedule(true);
    });
    panel.addEventListener('pointerover', () => clearTimeout(this.#hideTimer));
    trigger.addEventListener('focusin', () => {
      // Focus put back on the trigger by Escape does not open it again. The
      // element that took focus is read, not the event target: a custom-element
      // trigger's host never matches :focus-visible.
      if (this.#restoring || this.disabled || !deepActiveElement()?.matches(':focus-visible')) return;
      clearTimeout(this.#showTimer);
      clearTimeout(this.#hideTimer);
      this.open = true;
    });
    for (const part of [trigger, panel]) {
      part.addEventListener('pointerout', (event) => {
        if (!this.#inside(/** @type {Node | null} */ (event.relatedTarget))) this.#schedule(false);
      });
      part.addEventListener('focusout', (event) => {
        if (!this.#inside(/** @type {Node | null} */ (event.relatedTarget))) this.hide('blur');
      });
    }
  }

  get #trigger() {
    return this.#triggerSlot.assignedElements({ flatten: true })[0] || null;
  }

  /** The floating panel element. */
  get panel() {
    return this.#panel;
  }

  /** Shows the panel now. */
  show() {
    this.open = true;
  }

  /**
   * Hides the panel now.
   * @param {'pointer' | 'blur' | 'escape' | 'api'} [reason]
   */
  hide(reason = 'api') {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  connected() {
    if (this.open && !this.#shown) {
      queueMicrotask(() => this.isConnected && this.open && !this.#shown && this.#setup());
    }
  }

  disconnected() {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    this.#teardown(false);
  }

  update(changed) {
    const panel = this.#panel;
    if (this.label) panel.setAttribute('aria-label', this.label);
    else panel.removeAttribute('aria-label');
    const trigger = this.#trigger;
    if (trigger) {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', String(this.open));
    }
    if (this.open && !this.#shown) this.#setup();
    else if (!this.open && this.#shown) this.#teardown(true);
    else if (this.open && ['side', 'align', 'offset'].some((name) => changed.has(name))) this.#place();
  }

  /** @param {Node | null} node */
  #inside(node) {
    return !!node && (composedContains(this, node) || composedContains(this.#panel, node));
  }

  /** @param {boolean} show */
  #schedule(show) {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    if (show) {
      if (this.open || this.disabled) return;
      this.#showTimer = setTimeout(() => (this.open = true), Math.max(0, this.delay));
    } else {
      this.#hideTimer = setTimeout(() => this.hide('pointer'), Math.max(0, this.closeDelay));
    }
  }

  #place() {
    this.#overlay.show(this.#trigger || this, {
      side: /** @type {any} */ (this.side),
      align: /** @type {any} */ (this.align),
      offset: this.offset
    });
  }

  #setup() {
    this.#shown = true;
    this.#place();
    this.#openAbort = new AbortController();
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        // Escape inside the panel is the card's alone.
        if (this.#inside(deepActiveElement())) event.preventDefault();
        this.hide('escape');
      },
      { signal: this.#openAbort.signal }
    );
    this.emit('open');
  }

  /** @param {boolean} announce */
  #teardown(announce) {
    if (!this.#shown) return;
    const active = deepActiveElement();
    const focusInPanel = !!active && composedContains(this.#panel, active);
    this.#shown = false;
    this.#openAbort?.abort();
    this.#openAbort = null;
    this.#overlay.hide();
    if (!announce) return;
    const reason = this.#reason;
    this.#reason = 'api';
    const trigger = this.#trigger;
    if (focusInPanel && trigger instanceof HTMLElement) {
      this.#restoring = true;
      trigger.focus({ preventScroll: true });
      this.#restoring = false;
    }
    this.emit('close', { reason });
  }
}

define('punica-hover-card', PunicaHoverCard);
