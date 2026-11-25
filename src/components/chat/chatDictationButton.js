import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './chatDictationButton.css';

const MIC = icons.mic;

/**
 * A microphone button that turns speech into text, for a chat composer.
 *
 * It uses the browser's speech recognition (`SpeechRecognition`, or
 * `webkitSpeechRecognition` in Chrome, Edge and Safari) and hides itself
 * where there is none. Pressing it starts listening and pressing it again
 * stops; so do Escape, leaving the page and removing the element. The words
 * arrive as they are heard in `punica-input` and once settled in
 * `punica-change`. In a `punica-chat-composer`'s `start` or `end` slot they
 * are written into the composer at the caret: the words still being heard
 * stand in place until they settle. Prevent either event to keep them out of
 * the composer.
 *
 * Recognition may send the audio to a speech service; in Chrome it does.
 *
 * @element punica-chat-dictation-button
 *
 * @attr {string} label - Accessible name while idle, `Start dictation` by default.
 * @attr {string} label-stop - Accessible name while listening, `Stop dictation` by default.
 * @attr {string} locale - Language to recognise, a BCP 47 tag; the closest `lang`, then the browser's language, by default.
 * @attr {boolean} disabled - Takes no clicks; also while the composer around it is disabled.
 *
 * @prop {boolean} listening - Recognition is running (read-only).
 * @prop {boolean} supported - The browser has speech recognition (read-only); false hides the button.
 *
 * @fires {{ value: string, final: false }} punica-input - Words heard and not settled yet; cancelable. `detail` is `{ value, final: false }`, the words of the current phrase.
 * @fires {{ value: string, final: true }} punica-change - A phrase settled; cancelable. `detail` is `{ value, final: true }`.
 * @fires {{ error: 'not-allowed' | 'no-speech' | 'audio-capture' | 'network' | 'service-not-allowed' | 'language-not-supported' | 'start-failed' | string }} punica-error - Recognition failed. `detail.error` is the browser's code: `not-allowed` (microphone permission denied), `no-speech`, `audio-capture`, `network`, `service-not-allowed`, `language-not-supported`, or `start-failed`.
 *
 * @csspart base - The native button.
 * @csspart icon - The microphone glyph.
 * @csspart indicator - The ring that pulses while listening.
 *
 * @cssprop --punica-chat-dictation-button-size - Inline and block size of the button.
 * @cssprop --punica-chat-dictation-button-color - Glyph colour while idle.
 * @cssprop --punica-chat-dictation-button-active-color - Glyph and ring colour while listening.
 * @cssprop --punica-chat-dictation-button-active-background - Background while listening.
 *
 * @cssstate listening - Recognition is running.
 * @cssstate unsupported - The browser has no speech recognition; the button is hidden.
 */
export class PunicaChatDictationButton extends PunicaElement {
  static properties = {
    label: { default: 'Start dictation' },
    labelStop: { default: 'Stop dictation' },
    locale: {},
    disabled: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <button part="base" class="base" type="button" aria-pressed="false">
      ${MIC}
      <span part="indicator" class="indicator" aria-hidden="true"></span>
    </button>
  `;

  #button = this.$('button');
  /** @type {any} */
  #Recognition = null;
  /** The running recognition, kept until it ends so a last phrase lands. @type {any} */
  #rec = null;
  #listening = false;
  /** Words not settled are standing in the composer. */
  #interim = false;
  /** @type {AbortController | null} */
  #session = null;

  constructor() {
    super();
    this.#button.addEventListener('click', () => (this.#listening ? this.stop() : this.start()));
  }

  connected() {
    const w = /** @type {any} */ (window);
    this.#Recognition = w.SpeechRecognition || w.webkitSpeechRecognition || null;
    // Back in the document: draw the state it left with.
    this.requestUpdate();
  }

  disconnected() {
    // Nothing is left listening to the microphone.
    this.#finish(true);
  }

  get listening() {
    return this.#listening;
  }

  get supported() {
    return !!this.#Recognition;
  }

  update() {
    const supported = this.supported;
    this.toggleState('unsupported', !supported);
    this.toggleState('listening', this.#listening);
    const button = this.#button;
    button.disabled = !supported || this.#disabled;
    button.setAttribute('aria-pressed', String(this.#listening));
    button.setAttribute('aria-label', this.#listening ? this.labelStop : this.label);
  }

  /** Starts listening. Does nothing while listening, disabled or unsupported. */
  start() {
    if (this.#listening || !this.#Recognition || this.#disabled || !this.isConnected) return;
    this.#finish(true);
    let rec;
    try {
      rec = new this.#Recognition();
      rec.lang = this.locale || this.closest('[lang]')?.lang || navigator.language;
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;
    } catch {
      this.emit('error', { error: 'start-failed' });
      return;
    }
    rec.onresult = (event) => this.#rec === rec && this.#onResult(event);
    rec.onerror = (event) => this.#rec === rec && this.#onError(event);
    rec.onend = () => this.#rec === rec && this.#finish(false);
    this.#rec = rec;
    this.#interim = false;
    this.#listening = true;

    this.#session = new AbortController();
    const signal = AbortSignal.any([this.#session.signal, this.signal]);
    const stop = () => this.stop();
    window.addEventListener('keydown', (event) => event.key === 'Escape' && stop(), { signal });
    // Not on window blur: a browser's microphone permission prompt takes
    // focus, and dictation would stop the first time it is used.
    document.addEventListener('visibilitychange', () => document.hidden && stop(), { signal });

    try {
      rec.start();
    } catch {
      this.#finish(true);
      this.emit('error', { error: 'start-failed' });
      return;
    }
    this.update();
  }

  /** Stops listening; a phrase still being heard settles first. */
  stop() {
    if (!this.#listening) return;
    this.#listening = false;
    this.#session?.abort();
    this.#session = null;
    try {
      this.#rec?.stop();
    } catch {
      this.#finish(true);
    }
    this.update();
  }

  get #disabled() {
    const composer = this.#composer;
    return this.disabled || !!composer?.isDisabled;
  }

  /** The composer whose `start` or `end` slot holds this button. @returns {any} */
  get #composer() {
    const composer = this.closest('punica-chat-composer');
    if (!composer) return null;
    let child = /** @type {Element} */ (this);
    while (child.parentElement && child.parentElement !== composer) child = child.parentElement;
    return child.slot === 'start' || child.slot === 'end' ? composer : null;
  }

  /** @param {any} event a SpeechRecognitionEvent */
  #onResult(event) {
    let settled = '';
    let heard = '';
    const results = event.results || [];
    for (let i = event.resultIndex || 0; i < results.length; i++) {
      const result = results[i];
      const text = result?.[0]?.transcript || '';
      if (result?.isFinal) settled += text;
      else heard += text;
    }
    settled = settled.trim();
    heard = heard.trim();
    if (settled) this.#deliver(settled, true);
    if (heard || this.#interim) this.#deliver(heard, false);
  }

  /**
   * @param {string} value
   * @param {boolean} final
   */
  #deliver(value, final) {
    const event = this.emit(final ? 'change' : 'input', { value, final }, { cancelable: true });
    if (event.defaultPrevented) return;
    const composer = this.#composer;
    if (typeof composer?.insertText !== 'function') return;
    composer.insertText(value, { provisional: !final });
    this.#interim = !final && value !== '';
  }

  /** @param {any} event a SpeechRecognitionErrorEvent */
  #onError(event) {
    const error = event?.error || 'unknown';
    // `aborted` is this element stopping it.
    if (error !== 'aborted') this.emit('error', { error });
    this.#finish(false);
  }

  /**
   * Ends the session.
   * @param {boolean} abort stop the recognition without waiting for its last phrase
   */
  #finish(abort) {
    const rec = this.#rec;
    this.#rec = null;
    this.#session?.abort();
    this.#session = null;
    this.#interim = false;
    if (rec) {
      rec.onresult = rec.onerror = rec.onend = null;
      if (abort) {
        try {
          rec.abort();
        } catch {
          /* already ended */
        }
      }
    }
    this.#listening = false;
    if (this.isConnected) this.update();
    else this.toggleState('listening', false);
  }
}

define('punica-chat-dictation-button', PunicaChatDictationButton);
