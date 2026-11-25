import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { icons } from '../../core/icons.js';
import styles from './chatComposer.css';

const autoGrows = () => typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');

/**
 * The message input of a conversation: a text area that grows with what is
 * typed, and a send button that turns into a stop button while a response is
 * streaming.
 *
 * Enter sends and Shift+Enter starts a new line. Sending fires
 * `punica-submit`; unless that is prevented the owning form, if any, is asked
 * to submit and the field is cleared. Files pasted or dropped are handed over
 * in `punica-attach`; the composer uploads nothing.
 *
 * @element punica-chat-composer
 *
 * @attr {string} value - The default text. The `value` property is the current text.
 * @attr {string} placeholder - Hint shown while the field is empty.
 * @attr {string} label - Accessible name of the field, `Message` by default.
 * @attr {string} name - Name the text is submitted under.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} required - The form does not submit while the field is empty.
 * @attr {boolean} busy - A response is streaming: the send button is a stop button and Enter sends nothing.
 * @attr {number} max-rows - Lines the field grows to before it scrolls, 8 by default.
 * @attr {string} label-send - Accessible name of the send button, `Send` by default.
 * @attr {string} label-stop - Accessible name of the stop button, `Stop` by default.
 *
 * @slot start - Controls before the field: attach buttons, a `punica-chat-dictation-button`.
 * @slot end - Controls between the field and the send button: a `punica-chat-dictation-button`.
 * @slot footer - A line under the field: a disclaimer, a model picker.
 *
 * @fires {{ value: string }} punica-input - The text changed while typing or dictating. `detail.value`.
 * @fires {{ value: string }} punica-submit - The person sent the message; cancelable. `detail.value`. Prevent it to keep the text in the field and the form unsubmitted.
 * @fires {Record<string, never>} punica-stop - The person pressed stop while `busy`. `detail` is `{}`.
 * @fires {{ files: File[] }} punica-attach - Files were pasted or dropped. `detail.files` is a `File[]`.
 *
 * @csspart base - The whole composer.
 * @csspart field - The bordered box around the text area and its controls.
 * @csspart textarea - The native text area.
 * @csspart send-button - The send / stop button.
 * @csspart footer - The wrapper around the footer slot.
 *
 * @cssprop --punica-chat-composer-background - Background of the field.
 * @cssprop --punica-chat-composer-border-color - Border colour of the field.
 * @cssprop --punica-chat-composer-radius - Corner radius of the field.
 * @cssprop --punica-chat-composer-padding - Padding of the field.
 *
 * @cssstate busy - A response is streaming.
 * @cssstate empty - The field holds no text.
 * @cssstate dragover - Files are being dragged over the composer.
 * @cssstate disabled - Disabled, by itself or by a fieldset.
 * @cssstate invalid - Required and empty, or carrying a custom error.
 */
export class PunicaChatComposer extends FormControl(PunicaElement) {
  static properties = {
    value: { reflect: false, default: '' },
    placeholder: {},
    label: { default: 'Message' },
    busy: { type: Boolean },
    maxRows: { type: Number, default: 8 },
    labelSend: { default: 'Send' },
    labelStop: { default: 'Stop' }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base">
      <div part="field" class="field">
        <slot name="start"></slot>
        <textarea part="textarea" rows="1"></textarea>
        <slot name="end"></slot>
        <button part="send-button" class="send" type="button">
          <span class="send-icon">${icons.send}</span>
          <span class="stop-icon">${icons.stop}</span>
        </button>
      </div>
      <div part="footer" class="footer"><slot name="footer"></slot></div>
    </div>
  `;

  #textarea = this.$('textarea');
  #button = this.$('.send');
  #field = this.$('.field');
  #dragDepth = 0;
  /** Text inserted with `provisional`, which the next insertion replaces. @type {{ start: number, end: number } | null} */
  #provisional = null;

  constructor() {
    super();
    const textarea = this.#textarea;
    textarea.addEventListener('input', () => {
      this.#provisional = null;
      this.value = textarea.value;
      this.#grow();
      this.emit('input', { value: this.value });
    });
    textarea.addEventListener('keydown', (event) => this.#onKeydown(event));
    textarea.addEventListener('paste', (event) => {
      if (this.#attach(event.clipboardData?.files)) event.preventDefault();
    });
    this.#button.addEventListener('click', () => {
      if (this.isDisabled) return;
      if (this.busy) this.emit('stop', {});
      else this.#send();
    });

    const field = this.#field;
    const hasFiles = (event) => !this.isDisabled && [...(event.dataTransfer?.types || [])].includes('Files');
    field.addEventListener('dragenter', (event) => {
      if (!hasFiles(event)) return;
      this.#dragDepth++;
      this.toggleState('dragover', true);
    });
    field.addEventListener('dragover', (event) => {
      if (hasFiles(event)) event.preventDefault();
    });
    field.addEventListener('dragleave', () => {
      this.#dragDepth = Math.max(0, this.#dragDepth - 1);
      if (!this.#dragDepth) this.toggleState('dragover', false);
    });
    field.addEventListener('drop', (event) => {
      this.#dragDepth = 0;
      this.toggleState('dragover', false);
      if (this.#attach(event.dataTransfer?.files)) event.preventDefault();
    });
  }

  update(changed) {
    const textarea = this.#textarea;
    const value = this.value ?? '';
    if (textarea.value !== value) {
      textarea.value = value;
      this.#provisional = null;
    }
    textarea.disabled = this.isDisabled;
    textarea.placeholder = this.placeholder || '';
    textarea.setAttribute('aria-label', this.label);
    textarea.required = this.required;
    textarea.style.setProperty('--_max-rows', String(Math.max(1, this.maxRows || 1)));

    const empty = value.trim() === '';
    const button = this.#button;
    button.disabled = this.isDisabled || (!this.busy && empty);
    button.setAttribute('aria-label', this.busy ? this.labelStop : this.labelSend);

    this.toggleState('busy', this.busy);
    this.toggleState('empty', empty);
    this.toggleState('disabled', this.isDisabled);

    this.setFormValue(value);
    this.setValidity({ valueMissing: this.required && value === '' }, textarea.validationMessage, textarea);
    if (changed.has('value') || changed.has('maxRows')) this.#grow();
  }

  formReset() {
    this.value = this.getAttribute('value') ?? '';
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state;
  }

  /**
   * Moves focus to the text area.
   * @param {FocusOptions} [options]
   */
  focus(options) {
    this.#textarea.focus(options);
  }

  /**
   * Inserts text at the caret, in place of the selected text, as if the
   * person had typed it, and fires `punica-input`. A space is put between it
   * and a word it would touch. Text inserted with `provisional` (a dictation's
   * interim words) is replaced by the next insertion.
   * @param {string} text
   * @param {{ provisional?: boolean }} [options]
   */
  insertText(text, options = {}) {
    if (this.isDisabled) return;
    const textarea = this.#textarea;
    const current = textarea.value;
    let start;
    let end;
    if (this.#provisional && this.#provisional.end <= current.length) {
      ({ start, end } = this.#provisional);
    } else {
      start = textarea.selectionStart ?? current.length;
      end = textarea.selectionEnd ?? start;
    }
    let insert = String(text ?? '');
    const before = current.slice(0, start);
    const after = current.slice(end);
    if (insert && before && !/\s$/.test(before) && !/^\s/.test(insert)) insert = ' ' + insert;
    if (insert && after && !/^\s/.test(after) && !/\s$/.test(insert)) insert += ' ';
    const value = before + insert + after;
    textarea.value = value;
    const caret = start + insert.length;
    textarea.setSelectionRange(caret, caret);
    this.#provisional = options.provisional && insert ? { start, end: caret } : null;
    this.value = value;
    this.#grow();
    this.emit('input', { value });
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    // Enter that confirms an IME composition belongs to the IME.
    // audit-allow: deprecated-key-code (229 is how Safari reports a key that ends an IME composition)
    if (event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!this.busy) this.#send();
  }

  #send() {
    const value = this.#textarea.value;
    if (this.isDisabled || value.trim() === '') return;
    this.value = value;
    const event = this.emit('submit', { value }, { cancelable: true });
    if (event.defaultPrevented) return;
    // The form reads the value before the field is cleared.
    this.setFormValue(value);
    submitForm(this.form);
    this.value = '';
    this.#textarea.value = '';
    this.#provisional = null;
    this.#grow();
  }

  /**
   * @param {FileList | null | undefined} list
   * @returns {boolean} files were handed over
   */
  #attach(list) {
    if (this.isDisabled || !list?.length) return false;
    this.emit('attach', { files: [...list] });
    return true;
  }

  /** Sizes the text area to its text where `field-sizing` does not. */
  #grow() {
    if (autoGrows()) return;
    const style = this.#textarea.style;
    style.blockSize = 'auto';
    style.blockSize = `${this.#textarea.scrollHeight}px`;
  }
}

define('punica-chat-composer', PunicaChatComposer);
