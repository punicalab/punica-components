import { PunicaElement, define } from '../../core/element.js';
import styles from './timer.css';

const pad = (n) => String(n).padStart(2, '0');

/**
 * A countdown or a stopwatch.
 *
 * It counts on the monotonic clock, so a slow tab or a changed system time
 * does not move it, and it holds no timer while it is out of the document.
 *
 * @element punica-timer
 *
 * @attr {string} label - Accessible name.
 * @attr {'countdown' | 'stopwatch'} mode - Counts down or up, `countdown` by default.
 * @attr {number} duration - Seconds a countdown starts from.
 * @attr {string} until - ISO 8601 moment a countdown ends at; wins over `duration`.
 * @attr {boolean} running - The clock is counting.
 * @attr {'digital' | 'long' | 'short' | 'narrow'} format - `Intl.DurationFormat` style, `digital` by default.
 * @attr {number} announce-every - Seconds between announcements to assistive technology; none by default.
 * @attr {string} locale - Language tag; the nearest `lang` and then the browser's by default.
 *
 * @prop {number} elapsed - Milliseconds counted so far (read-only).
 * @prop {number | null} remaining - Milliseconds left of a countdown, null for a stopwatch (read-only).
 *
 * @fires punica-complete - A countdown reached zero. Fired once; `detail` is `{}`.
 *
 * @csspart base - The native `<time>` element with the written duration.
 * @csspart status - The live region that announces at `announce-every`.
 *
 * @cssprop --punica-timer-color - Text colour, inherited by default.
 * @cssprop --punica-timer-font-family - Font, the monospace token by default.
 *
 * @cssstate running - While the clock counts.
 * @cssstate complete - After a countdown reached zero.
 */
export class PunicaTimer extends PunicaElement {
  static properties = {
    label: {},
    mode: { default: 'countdown' },
    duration: { type: Number },
    until: {},
    running: { type: Boolean },
    format: { default: 'digital' },
    announceEvery: { type: Number },
    locale: {}
  };

  static styles = styles;
  static template = `<time part="base"></time><span part="status" class="status" role="status" aria-live="polite"></span>`;

  #time = this.$('time');
  #status = this.$('.status');
  #timeout = 0;
  #ready = false;
  /** Milliseconds counted before the last start. */
  #banked = 0;
  /** @type {number | null} `performance.now()` at the last start. */
  #startedAt = null;
  /** @type {number | null} `performance.now()` at which `until` falls. */
  #target = null;
  #stoppedAt = 0;
  #completed = false;
  /** @type {number | null} */
  #announced = null;

  constructor() {
    super();
    this.internals.role = 'timer';
    this.internals.ariaLive = 'off';
  }

  get elapsed() {
    return this.#banked + (this.#startedAt == null ? 0 : performance.now() - this.#startedAt);
  }

  get remaining() {
    if (this.mode === 'stopwatch') return null;
    if (this.#target != null) {
      return Math.max(0, this.#target - (this.#startedAt == null ? this.#stoppedAt : performance.now()));
    }
    return Math.max(0, (this.duration || 0) * 1000 - this.elapsed);
  }

  /** Starts or resumes the clock; a finished countdown starts over. */
  start() {
    if (this.#completed) this.reset();
    this.running = true;
  }

  /** Stops the clock where it is. */
  pause() {
    this.running = false;
  }

  /** Puts the clock back to its beginning; a running clock keeps running. */
  reset() {
    this.#banked = 0;
    if (this.#startedAt != null) this.#startedAt = performance.now();
    this.#completed = false;
    this.#announced = null;
    this.#status.textContent = '';
    this.toggleState('complete', false);
    if (this.#ready) this.#tick();
  }

  connected() {
    if (this.#ready) this.#tick();
  }

  disconnected() {
    clearTimeout(this.#timeout);
    this.#timeout = 0;
  }

  update(changed) {
    const now = performance.now();
    if (!this.#ready) this.#stoppedAt = now;
    this.#ready = true;
    if (changed.has('until')) {
      const at = this.until ? Date.parse(this.until) : NaN;
      this.#target = Number.isNaN(at) ? null : now + (at - Date.now());
    }
    if (changed.has('until') || changed.has('duration') || changed.has('mode')) {
      this.#completed = false;
      this.toggleState('complete', false);
    }
    if (this.running && this.#startedAt == null) {
      this.#startedAt = now;
    } else if (!this.running && this.#startedAt != null) {
      this.#banked += now - this.#startedAt;
      this.#startedAt = null;
      this.#stoppedAt = now;
    }
    this.toggleState('running', this.running);
    this.internals.ariaLabel = this.label || null;
    this.#tick();
  }

  get #language() {
    const tag = this.locale || this.closest('[lang]')?.lang || navigator.language;
    try {
      return Intl.getCanonicalLocales(tag)[0];
    } catch {
      return undefined;
    }
  }

  /**
   * @param {number} total whole seconds
   * @param {string} style
   */
  #write(total, style) {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const DurationFormat = /** @type {any} */ (Intl).DurationFormat;
    if (typeof DurationFormat === 'function') {
      try {
        const options =
          style === 'digital'
            ? { style, hoursDisplay: hours ? 'always' : 'auto' }
            : { style, secondsDisplay: total ? 'auto' : 'always' };
        return new DurationFormat(this.#language, options).format({ hours, minutes, seconds });
      } catch {
        // An unknown style: the padded form below.
      }
    }
    return `${hours ? `${hours}:` : ''}${pad(minutes)}:${pad(seconds)}`;
  }

  #tick() {
    clearTimeout(this.#timeout);
    this.#timeout = 0;
    const countdown = this.mode !== 'stopwatch';
    const ms = countdown ? this.remaining : this.elapsed;
    // A timer may fire a hair early; five milliseconds count as arrived.
    const total = Math.max(0, countdown ? Math.ceil(ms / 1000 - 0.005) : Math.floor(ms / 1000 + 0.005));
    this.#time.textContent = this.#write(total, this.format);
    this.#time.dateTime = `PT${total}S`;

    const every = this.announceEvery;
    if (this.running && every > 0 && total % every === 0 && total !== this.#announced) {
      this.#announced = total;
      this.#status.textContent = this.#write(total, 'long');
    }

    const bounded = countdown && (this.#target != null || this.duration != null);
    if (this.running && bounded && total === 0) {
      if (!this.#completed) {
        this.#completed = true;
        this.toggleState('complete', true);
        this.running = false;
        this.emit('complete', {});
      }
      return;
    }
    if (!this.running || !this.isConnected || (countdown && !bounded)) return;
    const delay = countdown ? ms % 1000 || 1000 : 1000 - (ms % 1000);
    this.#timeout = setTimeout(() => this.#tick(), Math.max(1, delay));
  }
}

define('punica-timer', PunicaTimer);
