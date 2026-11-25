import { PunicaElement, define } from '../../core/element.js';
import { Overlay, overlayCss } from '../../core/overlay.js';
import { deepActiveElement } from '../../core/a11y.js';
import styles from './tooltip.css';

/**
 * A short description that appears beside its trigger on hover and on
 * keyboard focus.
 *
 * The trigger is the element in the default slot. The description is the
 * `text` attribute, or the `content` slot for text with markup; it is plain
 * text for assistive technology either way, so nothing a person must click
 * belongs in it (use `punica-hover-card` or `punica-popover`).
 *
 * The trigger is described by the tooltip: through `ariaDescribedByElements`
 * where the browser can point from the trigger at the description, otherwise
 * through `aria-description` holding the same text.
 *
 * @element punica-tooltip
 *
 * @attr {string} text - The description.
 * @attr {boolean} open - The tooltip is showing.
 * @attr {'block-start' | 'block-end' | 'inline-start' | 'inline-end'} side - Side of the trigger it opens on, `block-start` by default.
 * @attr {'start' | 'center' | 'end'} align - Alignment along that side, `center` by default.
 * @attr {number} delay - Milliseconds the pointer rests on the trigger before it opens, 300 by default.
 * @attr {number} offset - Gap between trigger and tooltip in px, 6 by default.
 * @attr {boolean} disabled - Hover and focus do not open it.
 *
 * @slot - The trigger.
 * @slot content - The description, in place of `text`.
 *
 * @fires punica-open - The tooltip opened.
 * @fires {{ reason: 'pointer' | 'blur' | 'escape' | 'api' }} punica-close - The tooltip closed. `detail.reason` is `pointer`, `blur`, `escape` or `api`.
 *
 * @csspart panel - The floating tooltip.
 * @csspart text - The element holding `text`.
 *
 * @cssprop --punica-tooltip-radius - Corner radius.
 * @cssprop --punica-tooltip-padding - Padding.
 * @cssprop --punica-tooltip-background - Background.
 * @cssprop --punica-tooltip-color - Text colour.
 * @cssprop --punica-tooltip-shadow - Shadow.
 * @cssprop --punica-tooltip-max-width - Largest inline size.
 */
export class PunicaTooltip extends PunicaElement {
  static properties = {
    text: {},
    open: { type: Boolean },
    side: { default: 'block-start' },
    align: { default: 'center' },
    delay: { type: Number, default: 300 },
    offset: { type: Number, default: 6 },
    disabled: { type: Boolean }
  };

  static styles = [overlayCss, styles];
  static template = `
    <slot></slot>
    <div part="panel" popover="manual" role="tooltip"><slot name="content"><span part="text"></span></slot></div>
  `;

  #panel = this.$('[part="panel"]');
  #text = this.$('[part="text"]');
  #slot = this.$('slot:not([name])');
  #contentSlot = this.$('slot[name="content"]');
  #overlay = new Overlay(this.#panel);
  #showTimer = 0;
  #hideTimer = 0;
  #shown = false;
  #reason = 'api';
  /** @type {AbortController | null} */
  #openAbort = null;
  /** What was written on which trigger, to take it back. @type {{ el: Element, linked: boolean } | null} */
  #described = null;

  constructor() {
    super();
    const slot = this.#slot;
    slot.addEventListener('slotchange', () => this.#describe());
    this.#contentSlot.addEventListener('slotchange', () => this.#describe());
    slot.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'touch') return;
      this.#schedule(true);
    });
    slot.addEventListener('pointerout', (event) => this.#pointerOut(event));
    slot.addEventListener('focusin', () => {
      // The target is retargeted to a custom-element trigger's host, which
      // never matches :focus-visible; the element inside it that took focus does.
      if (this.disabled || !deepActiveElement()?.matches(':focus-visible')) return;
      clearTimeout(this.#showTimer);
      clearTimeout(this.#hideTimer);
      this.open = true;
    });
    slot.addEventListener('focusout', () => this.hide('blur'));
    // The pointer may rest on the tooltip itself (WCAG 1.4.13).
    this.#panel.addEventListener('pointerover', () => clearTimeout(this.#hideTimer));
    this.#panel.addEventListener('pointerout', (event) => this.#pointerOut(event));
  }

  get #trigger() {
    return this.#slot.assignedElements({ flatten: true })[0] || null;
  }

  /** The floating tooltip element. */
  get panel() {
    return this.#panel;
  }

  /** Shows the tooltip now. */
  show() {
    this.open = true;
  }

  /**
   * Hides the tooltip now.
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
    this.#describe();
    if (this.open && !this.#shown) {
      queueMicrotask(() => this.isConnected && this.open && !this.#shown && this.#setup());
    }
  }

  disconnected() {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    this.#teardown(false);
    this.#undescribe();
  }

  update(changed) {
    this.#text.textContent = this.text ?? '';
    if (changed.has('text')) this.#describe();
    if (this.open && !this.#shown) this.#setup();
    else if (!this.open && this.#shown) this.#teardown(true);
    else if (this.open) {
      if (changed.has('side') || changed.has('align') || changed.has('offset')) this.#place();
      else if (changed.has('text')) this.#overlay.reposition();
    }
  }

  /** @param {boolean} show */
  #schedule(show) {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    if (show) {
      if (this.open || this.disabled) return;
      this.#showTimer = setTimeout(() => (this.open = true), Math.max(0, this.delay));
    } else {
      // Long enough for the pointer to cross the gap to the tooltip.
      this.#hideTimer = setTimeout(() => this.hide('pointer'), 100);
    }
  }

  /** @param {PointerEvent} event */
  #pointerOut(event) {
    const to = /** @type {Node | null} */ (event.relatedTarget);
    const trigger = this.#trigger;
    if (to && (trigger?.contains(to) || this.#panel.contains(to) || this.contains(to))) return;
    this.#schedule(false);
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
        if (event.key === 'Escape') this.hide('escape');
      },
      { capture: true, signal: this.#openAbort.signal }
    );
    this.emit('open');
  }

  /** @param {boolean} announce */
  #teardown(announce) {
    if (!this.#shown) return;
    this.#shown = false;
    this.#openAbort?.abort();
    this.#openAbort = null;
    this.#overlay.hide();
    if (!announce) return;
    const reason = this.#reason;
    this.#reason = 'api';
    this.emit('close', { reason });
  }

  /** Ties the trigger to the description. */
  #describe() {
    if (!this.isConnected) return;
    const trigger = this.#trigger;
    if (this.#described && this.#described.el !== trigger) this.#undescribe();
    if (!trigger) return;
    const content = this.#contentSlot.assignedElements({ flatten: true });
    const targets = content.length ? content : [this.#panel];
    // An author's own aria-describedby stays; the text is added beside it.
    const own = trigger.getAttribute('aria-describedby')?.trim();
    let linked = false;
    if ('ariaDescribedByElements' in trigger && !own) {
      trigger.ariaDescribedByElements = targets;
      // The browser drops a reference it may not follow, such as one into
      // this shadow tree.
      linked = (trigger.ariaDescribedByElements || []).length === targets.length;
      if (!linked) trigger.ariaDescribedByElements = null;
    }
    if (linked) {
      trigger.removeAttribute('aria-description');
    } else {
      const text = content.length ? content.map((el) => el.textContent.trim()).join(' ') : this.text ?? '';
      if (text) trigger.setAttribute('aria-description', text);
      else trigger.removeAttribute('aria-description');
    }
    this.#described = { el: trigger, linked };
  }

  #undescribe() {
    const described = this.#described;
    this.#described = null;
    if (!described) return;
    if (described.linked) /** @type {any} */ (described.el).ariaDescribedByElements = null;
    else described.el.removeAttribute('aria-description');
  }
}

define('punica-tooltip', PunicaTooltip);
