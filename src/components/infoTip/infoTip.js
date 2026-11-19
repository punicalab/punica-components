import { PunicaElement, define } from '../../core/element.js';
import { Overlay, overlayCss } from '../../core/overlay.js';
import { icons } from '../../core/icons.js';
import { deepActiveElement, composedContains } from '../../core/a11y.js';
import styles from './infoTip.css';

/**
 * A small "i" button that shows a short explanation beside it: the
 * definition of a metric, a note on a permission, help for a field.
 *
 * A click, a tap, Enter or Space pins the explanation open (the button
 * reports `aria-expanded="true"`); a second press, Escape, a press outside or
 * focus leaving closes it. Resting the pointer on the button previews it.
 * Unlike a tooltip it works on touch and from the keyboard. The explanation
 * is also the button's accessible description, so a screen reader reads it
 * with the button. Keep it short and plain: for links and buttons use
 * `punica-popover`, and for something the user must read put it inline.
 *
 * @element punica-info-tip
 *
 * @attr {string} label - Accessible name of the button, `More information` by default.
 * @attr {boolean} open - The explanation is showing.
 * @attr {'block-start' | 'block-end' | 'inline-start' | 'inline-end'} side - Side of the button it opens on, `block-start` by default.
 * @attr {'start' | 'center' | 'end'} align - Alignment along that side, `center` by default.
 * @attr {'small' | 'medium' | 'large'} size - Size of the icon, `medium` (16 px) by default.
 * @attr {number} delay - Milliseconds the pointer rests on the button before the preview, 300 by default.
 *
 * @slot - The explanation.
 *
 * @fires punica-open - The explanation opened.
 * @fires punica-close - The explanation closed. `detail.reason` is `button`, `escape`, `outside`, `blur`, `pointer` or `api`.
 *
 * @csspart button - The native button.
 * @csspart icon - The "i" glyph.
 * @csspart panel - The floating explanation.
 *
 * @cssprop --punica-info-tip-color - Colour of the icon.
 * @cssprop --punica-info-tip-size - Size of the icon.
 * @cssprop --punica-info-tip-radius - Corner radius of the panel.
 * @cssprop --punica-info-tip-padding - Padding of the panel.
 * @cssprop --punica-info-tip-background - Background of the panel.
 * @cssprop --punica-info-tip-shadow - Shadow of the panel.
 * @cssprop --punica-info-tip-max-width - Largest inline size of the panel.
 *
 * @cssstate pinned - Opened by a press, not by the pointer resting on it.
 */
export class PunicaInfoTip extends PunicaElement {
  static properties = {
    label: { default: 'More information' },
    open: { type: Boolean },
    side: { default: 'block-start' },
    align: { default: 'center' },
    size: {},
    delay: { type: Number, default: 300 }
  };

  static styles = [overlayCss, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <button part="button" class="button" type="button" aria-expanded="false" aria-controls="panel">${icons.info}</button>
    <div part="panel" class="panel" id="panel" popover="manual"><slot></slot></div>
  `;

  #button = this.$('.button');
  #panel = this.$('.panel');
  #overlay = new Overlay(this.#panel);
  #shown = false;
  #pinned = false;
  #reason = 'api';
  #showTimer = 0;
  #hideTimer = 0;
  /** @type {AbortController | null} */
  #openAbort = null;

  constructor() {
    super();
    const button = this.#button;
    const panel = this.#panel;
    button.addEventListener('click', () => {
      if (this.open && this.#pinned) {
        this.hide('button');
        return;
      }
      clearTimeout(this.#showTimer);
      clearTimeout(this.#hideTimer);
      this.#pin(true);
      this.open = true;
    });
    for (const part of [button, panel]) {
      part.addEventListener('pointerover', (event) => {
        if (event.pointerType === 'touch') return;
        clearTimeout(this.#hideTimer);
        if (!this.open && part === button) {
          clearTimeout(this.#showTimer);
          this.#showTimer = setTimeout(() => {
            this.#pin(false);
            this.open = true;
          }, Math.max(0, this.delay));
        }
      });
      part.addEventListener('pointerout', (event) => {
        if (this.#inside(/** @type {Node | null} */ (event.relatedTarget))) return;
        clearTimeout(this.#showTimer);
        if (this.open && !this.#pinned) {
          // Long enough for the pointer to cross the gap to the panel.
          this.#hideTimer = setTimeout(() => this.hide('pointer'), 150);
        }
      });
    }
    this.shadowRoot.addEventListener('focusout', (event) => {
      const to = /** @type {Node | null} */ (/** @type {FocusEvent} */ (event).relatedTarget);
      if (to && !this.#inside(to)) this.hide('blur');
    });
  }

  /** The floating explanation. */
  get panel() {
    return this.#panel;
  }

  /** Shows the explanation, pinned. */
  show() {
    this.#pin(true);
    this.open = true;
  }

  /**
   * Hides the explanation.
   * @param {'button' | 'escape' | 'outside' | 'blur' | 'pointer' | 'api'} [reason]
   */
  hide(reason = 'api') {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  /** Moves focus to the button. */
  focus(options) {
    this.#button.focus(options);
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
    const button = this.#button;
    button.setAttribute('aria-label', this.label ?? '');
    // The explanation describes the button whether or not it is showing.
    if ('ariaDescribedByElements' in button) button.ariaDescribedByElements = [this.#panel];
    else button.setAttribute('aria-describedby', 'panel');
    button.setAttribute('aria-expanded', String(this.open && this.#pinned));
    if (this.open && !this.#shown) this.#setup();
    else if (!this.open && this.#shown) this.#teardown(true);
    else if (this.open && ['side', 'align'].some((name) => changed.has(name))) this.#place();
  }

  /** @param {boolean} on */
  #pin(on) {
    this.#pinned = on;
    this.toggleState('pinned', on);
    this.#button.setAttribute('aria-expanded', String(this.open && on));
    this.requestUpdate();
  }

  /** @param {Node | null} node */
  #inside(node) {
    return !!node && (composedContains(this, node) || composedContains(this.#panel, node));
  }

  #place() {
    this.#overlay.show(this.#button, {
      side: /** @type {any} */ (this.side),
      align: /** @type {any} */ (this.align),
      offset: 6
    });
  }

  #setup() {
    this.#shown = true;
    this.#place();
    this.#openAbort = new AbortController();
    const signal = this.#openAbort.signal;
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        if (this.#inside(deepActiveElement())) event.preventDefault();
        this.hide('escape');
      },
      { signal }
    );
    document.addEventListener(
      'pointerdown',
      (event) => {
        const path = event.composedPath();
        if (path.includes(this) || path.includes(this.#panel)) return;
        this.hide('outside');
      },
      { capture: true, signal }
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
    this.#pin(false);
    if (focusInPanel || (reason === 'escape' && active && composedContains(this, active))) {
      this.#button.focus({ preventScroll: true });
    }
    this.emit('close', { reason });
  }
}

define('punica-info-tip', PunicaInfoTip);
