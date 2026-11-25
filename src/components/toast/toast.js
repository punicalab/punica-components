import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './toast.css';

/**
 * A short message that goes away by itself.
 *
 * It lives in a `punica-toaster`, which announces it; `toast()` from
 * `toaster.js` creates one. The countdown pauses while the pointer or
 * keyboard focus is on the toast. The close button or Escape dismisses it;
 * a dismissed toast removes itself from the document.
 *
 * @element punica-toast
 *
 * @attr {'neutral' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'} color - Accent, `neutral` by default.
 * @attr {number} duration - Milliseconds before it goes away, 5000 by default; 0 keeps it until dismissed.
 * @attr {boolean} no-close-button - Hides the close button.
 * @attr {string} label-close - Accessible name of the close button, `Close` by default.
 *
 * @slot - The message.
 * @slot start - Content before the message, an icon.
 * @slot action - A button after the message.
 *
 * @fires {{ reason: 'user' | 'timeout' }} punica-dismiss - The toast is going away. `detail.reason` is `user` (close button, Escape) or `timeout`. A call to `dismiss()` fires nothing.
 *
 * @csspart base - The toast's box.
 * @csspart message - The wrapper around the message.
 * @csspart close-button - The close button.
 * @csspart progress - The bar showing the time left.
 *
 * @cssprop --punica-toast-radius - Corner radius.
 * @cssprop --punica-toast-padding - Padding.
 * @cssprop --punica-toast-background - Background; the accent by default.
 * @cssprop --punica-toast-color - Text colour.
 * @cssprop --punica-toast-shadow - Shadow.
 * @cssprop --punica-toast-max-width - Largest inline size.
 *
 * @cssstate paused - The countdown is held.
 * @cssstate leaving - The toast is fading out before it is removed.
 */
export class PunicaToast extends PunicaElement {
  static properties = {
    color: {},
    duration: { type: Number, default: 5000 },
    noCloseButton: { type: Boolean },
    labelClose: { default: 'Close' }
  };

  static styles = styles;
  static template = `
    <div part="base">
      <slot name="start"></slot>
      <div part="message"><slot></slot></div>
      <slot name="action"></slot>
      <button part="close-button" class="close" type="button">${icons.close}</button>
      <span part="progress" hidden></span>
    </div>
  `;

  #base = this.$('[part="base"]');
  #progress = this.$('[part="progress"]');
  #timer = 0;
  #leaveTimer = 0;
  #remaining = 0;
  #startedAt = 0;
  #holds = new Set();
  #leaving = false;

  constructor() {
    super();
    const base = this.#base;
    this.$('.close').addEventListener('click', () => this.#dismiss('user'));
    base.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      this.#dismiss('user');
    });
    base.addEventListener('pointerenter', () => this.#hold('pointer', true));
    base.addEventListener('pointerleave', () => this.#hold('pointer', false));
    base.addEventListener('focusin', () => this.#hold('focus', true));
    base.addEventListener('focusout', () => this.#hold('focus', false));
  }

  /** Whether the countdown is held by the pointer or by focus. */
  get paused() {
    return this.#holds.size > 0;
  }

  /** Removes the toast, after its exit transition. Fires nothing. */
  dismiss() {
    this.#leave();
  }

  connected() {
    this.#leaving = false;
    this.#holds.clear();
    this.toggleState('leaving', false);
    this.toggleState('paused', false);
    // Appended again after a removal (or moved: the toaster follows a modal dialog): the countdown goes on from
    // where it stood, and the bar with it.
    const total = Math.max(0, this.duration ?? 0);
    this.#progress.style.setProperty('--_elapsed', `${Math.max(0, total - this.#remaining)}ms`);
    this.#run();
  }

  disconnected() {
    if (this.#timer && !this.paused && this.#remaining) {
      this.#remaining = Math.max(1, this.#remaining - (performance.now() - this.#startedAt));
    }
    clearTimeout(this.#timer);
    this.#timer = 0;
    clearTimeout(this.#leaveTimer);
  }

  update(changed) {
    this.$('.close').setAttribute('aria-label', this.labelClose);
    if (!changed.has('duration')) return;
    // A changed duration starts the countdown again.
    this.#remaining = Math.max(0, this.duration ?? 0);
    this.#progress.hidden = !this.#remaining;
    this.#progress.style.setProperty('--_duration', `${this.#remaining}ms`);
    this.#progress.style.setProperty('--_elapsed', '0ms');
    this.#run();
  }

  #run() {
    clearTimeout(this.#timer);
    if (!this.#remaining || this.paused || this.#leaving) return;
    this.#startedAt = performance.now();
    this.#timer = setTimeout(() => this.#dismiss('timeout'), this.#remaining);
  }

  /**
   * @param {'pointer' | 'focus'} by
   * @param {boolean} on
   */
  #hold(by, on) {
    const was = this.paused;
    if (on) this.#holds.add(by);
    else this.#holds.delete(by);
    if (was === this.paused) return;
    this.toggleState('paused', this.paused);
    if (this.paused) {
      clearTimeout(this.#timer);
      if (this.#remaining) {
        this.#remaining = Math.max(1, this.#remaining - (performance.now() - this.#startedAt));
      }
    } else {
      this.#run();
    }
  }

  /** @param {'user' | 'timeout'} reason */
  #dismiss(reason) {
    if (this.#leaving) return;
    this.emit('dismiss', { reason });
    this.#leave();
  }

  #leave() {
    if (this.#leaving || !this.isConnected) return;
    this.#leaving = true;
    clearTimeout(this.#timer);
    this.toggleState('leaving', true);
    const ms = parseFloat(getComputedStyle(this.#base).transitionDuration) * 1000;
    if (ms > 0) this.#leaveTimer = setTimeout(() => this.remove(), ms);
    else this.remove();
  }
}

define('punica-toast', PunicaToast);
