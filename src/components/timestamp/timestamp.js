import { PunicaElement, define } from '../../core/element.js';
import styles from './timestamp.css';

const UNITS = /** @type {[Intl.RelativeTimeFormatUnit, number][]} */ ([
  ['year', 31536000000],
  ['month', 2592000000],
  ['week', 604800000],
  ['day', 86400000],
  ['hour', 3600000],
  ['minute', 60000],
  ['second', 1000]
]);
const MAX_DELAY = 2 ** 31 - 1;

/**
 * A moment in time, written for the reader's language and kept current.
 *
 * @element punica-timestamp
 *
 * @attr {string} value - The moment: an ISO 8601 string or milliseconds since the epoch.
 * @attr {'relative' | 'date' | 'time' | 'datetime'} format - What is written, `datetime` by default. `relative` rewrites itself as time passes.
 * @attr {'full' | 'long' | 'medium' | 'short'} date-style - `Intl.DateTimeFormat` date style, `medium` by default.
 * @attr {'full' | 'long' | 'medium' | 'short'} time-style - `Intl.DateTimeFormat` time style, `short` by default.
 * @attr {string} locale - Language tag; the nearest `lang` and then the browser's by default.
 *
 * @csspart base - The native `<time>` element.
 *
 * @cssprop --punica-timestamp-color - Text colour, inherited by default.
 */
export class PunicaTimestamp extends PunicaElement {
  static properties = {
    value: {},
    format: { default: 'datetime' },
    dateStyle: { default: 'medium' },
    timeStyle: { default: 'short' },
    locale: {}
  };

  static styles = styles;
  static template = `<time part="base"></time>`;

  #time = this.$('time');
  #timer = 0;
  #ready = false;

  /** The moment as a Date, or null while `value` names none. */
  get date() {
    const raw = this.value;
    if (raw == null || raw.trim() === '') return null;
    const ms = /^-?\d+(\.\d+)?$/.test(raw.trim()) ? Number(raw) : Date.parse(raw);
    return Number.isNaN(ms) ? null : new Date(ms);
  }

  connected() {
    if (this.#ready) this.#render();
  }

  disconnected() {
    clearTimeout(this.#timer);
    this.#timer = 0;
  }

  update() {
    this.#ready = true;
    this.#render();
  }

  get #language() {
    const tag = this.locale || this.closest('[lang]')?.lang || navigator.language;
    try {
      return Intl.getCanonicalLocales(tag)[0];
    } catch {
      return undefined;
    }
  }

  #render() {
    clearTimeout(this.#timer);
    this.#timer = 0;
    const time = this.#time;
    const date = this.date;
    if (!date) {
      time.textContent = '';
      time.removeAttribute('datetime');
      time.removeAttribute('title');
      return;
    }
    const language = this.#language;
    time.dateTime = date.toISOString();
    time.title = new Intl.DateTimeFormat(language, { dateStyle: 'full', timeStyle: 'long' }).format(date);
    if (this.format === 'relative') {
      time.textContent = this.#relative(date, language);
      return;
    }
    /** @type {Intl.DateTimeFormatOptions} */
    const options = {};
    if (this.format !== 'time') options.dateStyle = /** @type {any} */ (this.dateStyle);
    if (this.format !== 'date') options.timeStyle = /** @type {any} */ (this.timeStyle);
    let text;
    try {
      text = new Intl.DateTimeFormat(language, options).format(date);
    } catch {
      // An unknown style: the language's default date and time.
      text = new Intl.DateTimeFormat(language).format(date);
    }
    time.textContent = text;
  }

  /**
   * Writes the distance from now and arms the timer for the moment the
   * wording changes.
   * @param {Date} date
   * @param {string | undefined} language
   */
  #relative(date, language) {
    const diff = date.getTime() - Date.now();
    const abs = Math.abs(diff);
    const [unit, size] = UNITS.find(([, ms]) => abs >= ms) || UNITS[UNITS.length - 1];
    const text = new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(Math.trunc(diff / size), unit);
    if (this.isConnected) {
      const next = diff <= 0 ? size - (abs % size) : (abs % size) + 1;
      this.#timer = setTimeout(() => this.#render(), Math.min(Math.max(next, 250), MAX_DELAY));
    }
    return text;
  }
}

define('punica-timestamp', PunicaTimestamp);
