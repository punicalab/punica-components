import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { isRtl } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, OptionNavigator, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import '../select/option.js';
import fieldStyles from '../select/field.css';
import styles from './tokenizer.css';

/** @param {any} option an option that may not be upgraded yet */
const valueOf = (option) => option.optionValue ?? option.getAttribute('value') ?? option.textContent.trim();
/** @param {any} option */
const textOf = (option) => option.text ?? option.getAttribute('label') ?? option.textContent.trim();

/**
 * A multi-value input: each value is a token, and typing adds more.
 *
 * Enter or the `separator` adds what was typed; Backspace in the empty input
 * removes the last token; the arrow keys walk the tokens. `punica-option`
 * children, when present, are suggested as the user types.
 *
 * @element punica-tokenizer
 *
 * @attr {string} value - Default value, a JSON array of strings: `value='["a","b"]'`.
 * @attr {string} separator - Character that ends a token while typing or pasting, a comma by default.
 * @attr {string} placeholder - Text shown in the input while there is no token.
 * @attr {string} label - Accessible name.
 * @attr {boolean} open - The suggestions are showing, when there are rows to show.
 * @attr {string} name - Name the values are submitted under; one entry per value.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its tokens and takes no input.
 * @attr {boolean} required - At least one value is needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-remove - Start of the name of each remove button, `Remove` by default; the token's text follows it.
 *
 * @prop {string[]} value - The current values.
 *
 * @slot - `punica-option` rows to suggest.
 * @slot start - Content before the tokens, an icon.
 *
 * @fires {{ value: string[] }} punica-change - The user added or removed a token. `detail.value` is the new array.
 * @fires {{ value: string }} punica-input - The user typed. `detail.value` is the text in the input.
 * @fires punica-open - The suggestions opened.
 * @fires {{ reason: 'select' | 'escape' | 'outside' | 'blur' | 'empty' | 'api' }} punica-close - The suggestions closed. `detail.reason` is `select`, `escape`, `outside`, `blur`, `empty` or `api`.
 *
 * @csspart field - The bordered box.
 * @csspart tokens - The list of tokens.
 * @csspart token - One token.
 * @csspart token-label - The text of a token.
 * @csspart remove - The remove button of a token.
 * @csspart input - The text input.
 * @csspart listbox - The floating list of suggestions.
 *
 * @cssprop --punica-tokenizer-radius - Corner radius of the field.
 * @cssprop --punica-tokenizer-height - Minimum block size of the field.
 * @cssprop --punica-tokenizer-padding - Inline padding of the field.
 * @cssprop --punica-tokenizer-border-color - Border colour at rest.
 * @cssprop --punica-tokenizer-background - Field background.
 * @cssprop --punica-tokenizer-min-width - Smallest inline size.
 * @cssprop --punica-tokenizer-token-background - Background of a token.
 * @cssprop --punica-tokenizer-token-radius - Corner radius of a token.
 * @cssprop --punica-tokenizer-listbox-max-height - Largest block size of the suggestions.
 *
 * @cssstate open - The suggestions are showing.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaTokenizer extends FormControl(PunicaElement) {
  static properties = {
    value: { type: Array, reflect: false, default: Object.freeze([]) },
    separator: { default: ',' },
    placeholder: {},
    label: {},
    open: { type: Boolean },
    readonly: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelRemove: { default: 'Remove' }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="field" class="field">
      <slot name="start"></slot>
      <div part="tokens" class="tokens" role="list" hidden></div>
      <input part="input" class="control" type="text" autocomplete="off" autocapitalize="off" spellcheck="false">
    </div>
    <div part="listbox" id="listbox" class="panel listbox" role="listbox" popover="manual"><slot></slot></div>
    <template id="token">
      <span part="token" class="token" role="listitem" tabindex="-1">
        <span part="token-label" class="token-label"></span>
        <button part="remove" class="remove" type="button" tabindex="-1">${icons.close}</button>
      </span>
    </template>
  `;

  #field = this.$('.field');
  #tokens = this.$('.tokens');
  #input = this.$('input');
  #listbox = this.$('#listbox');
  #slot = this.$('slot:not([name])');
  #template = this.$('#token');
  #surface = new FieldSurface(this, this.#listbox);
  #nav = new OptionNavigator(this.#input, () => this.#rows());
  /** What the tokens were last drawn from. @type {string | null} */
  #drawn = null;
  #touched = false;
  #reason = 'api';

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('input', () => {
      if (this.isDisabled || this.readonly) return;
      // A separator can arrive without a keydown: IME, autofill, a phone keyboard.
      if (this.separator && input.value.includes(this.separator)) this.#addText(input.value);
      this.#nav.set(null);
      this.open = true;
      this.update(new Map());
      this.emit('input', { value: input.value });
    });
    input.addEventListener('paste', (event) => {
      const text = event.clipboardData?.getData('text') ?? '';
      if (this.isDisabled || this.readonly || (!/[\n\r\t]/.test(text) && !(this.separator && text.includes(this.separator)))) return;
      event.preventDefault();
      this.#addText(input.value + text);
    });
    input.addEventListener('keydown', (event) => this.#onInputKeydown(event));
    // A press on the box itself, beside the tokens, is a press on the input.
    this.#field.addEventListener('mousedown', (event) => {
      if (event.target !== this.#field) return;
      event.preventDefault();
      input.focus();
    });
    this.#tokens.addEventListener('keydown', (event) => this.#onTokenKeydown(event));
    // A token takes focus only from the arrow keys and Backspace; anything
    // else that lands there (a delegated focus(), a press) belongs in the
    // text input.
    this.#tokens.addEventListener('focusin', () => {
      if (!this.#walking) input.focus();
    });
    this.#tokens.addEventListener('click', (event) => {
      const target = /** @type {Element} */ (event.target);
      const token = /** @type {HTMLElement | null} */ (target.closest('.token'));
      if (!token || this.isDisabled || this.readonly) return;
      if (target.closest('.remove')) {
        this.#remove(token.dataset.value);
        input.focus();
      }
    });
    this.#slot.addEventListener('slotchange', () => this.requestUpdate());
    this.#listbox.addEventListener('mousedown', (event) => event.preventDefault());
    this.#listbox.addEventListener('click', (event) => {
      const option = this.#rowFrom(event);
      if (option && !option.disabled) this.#pick(option);
    });
    this.#listbox.addEventListener('pointermove', (event) => {
      const option = this.#rowFrom(event);
      if (option && !option.disabled && option !== this.#nav.active) this.#nav.set(option);
    });
    this.shadowRoot.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (next instanceof Node && (this.shadowRoot.contains(next) || this.contains(next))) return;
      this.#touched = true;
      // Text left in the input is a token the user meant.
      if (!this.isDisabled && !this.readonly) this.#addText(input.value);
      this.#close('blur');
      this.requestUpdate();
    });
  }

  /** Opens the suggestions. */
  show() {
    this.open = true;
  }

  /** Closes the suggestions. */
  hide() {
    this.#close('api');
  }

  /** Moves focus to the text input. */
  #walking = false;

  /** Moves focus to a token (or the input) on purpose. */
  #walkTo(target) {
    this.#walking = true;
    try {
      target.focus();
    } finally {
      this.#walking = false;
    }
  }

  focus(options) {
    this.#input.focus(options);
  }

  connected() {
    // Children inserted with the element are upgraded after it.
    queueMicrotask(() => this.isConnected && this.update(new Map()));
  }

  disconnected() {
    this.#surface.hide();
    this.#nav.set(null);
  }

  formReset() {
    this.#touched = false;
    this.#input.value = '';
    let initial = [];
    try {
      initial = JSON.parse(this.getAttribute('value') || '[]');
    } catch {
      /* not JSON: no default */
    }
    this.value = Array.isArray(initial) ? initial : [];
  }

  formRestore(state) {
    if (state instanceof FormData) this.value = state.getAll(this.name).map(String);
  }

  /** @returns {string[]} */
  #values() {
    return Array.isArray(this.value) ? this.value.map(String) : [];
  }

  /** @returns {any[]} */
  #rows() {
    return [...this.children].filter((child) => child.localName === 'punica-option');
  }

  #rowFrom(event) {
    return event.composedPath().find((node) => node.localName === 'punica-option' && node.parentElement === this) || null;
  }

  /** @returns {HTMLElement[]} */
  #tokenElements() {
    return /** @type {HTMLElement[]} */ ([...this.#tokens.children]);
  }

  update() {
    const language = fieldLanguage(this);
    const input = this.#input;
    const disabled = this.isDisabled;
    const locked = disabled || this.readonly;
    const name = fieldName(this);
    const values = this.#values();
    const rows = this.#rows();
    const labels = new Map(rows.map((row) => [valueOf(row), textOf(row)]));
    // The dimmed tokens of a disabled tokenizer belong to a disabled control.
    setAttr(this.#tokens, 'aria-disabled', disabled ? 'true' : null);

    // Tokens are redrawn only when what they show changes, so focus on one survives.
    const texts = values.map((value) => labels.get(value) ?? value);
    const drawn = JSON.stringify([values, texts, this.labelRemove, locked]);
    if (drawn !== this.#drawn) {
      this.#drawn = drawn;
      const focused = this.#tokenElements().indexOf(/** @type {any} */ (this.shadowRoot.activeElement));
      const tokens = values.map((value, i) => {
        const token = /** @type {HTMLElement} */ (this.#template.content.firstElementChild.cloneNode(true));
        token.dataset.value = value;
        token.querySelector('.token-label').textContent = texts[i];
        const remove = token.querySelector('button');
        remove.setAttribute('aria-label', `${this.labelRemove} ${texts[i]}`);
        remove.disabled = locked;
        return token;
      });
      this.#tokens.replaceChildren(...tokens);
      this.#tokens.hidden = tokens.length === 0;
      if (focused >= 0) this.#walkTo(tokens[Math.min(focused, tokens.length - 1)] || input);
    }

    const needle = input.value.trim().toLocaleLowerCase(language);
    let visible = 0;
    for (const row of rows) {
      const taken = values.includes(valueOf(row));
      const match = !taken && (!needle || textOf(row).toLocaleLowerCase(language).includes(needle));
      row.hidden = !match;
      if (match) visible++;
    }

    // The input is a combobox only when there is something to suggest.
    const suggests = rows.length > 0;
    setAttr(input, 'role', suggests ? 'combobox' : null);
    setAttr(input, 'aria-autocomplete', suggests ? 'list' : null);
    setAttr(input, 'aria-haspopup', suggests ? 'listbox' : null);
    setAttr(input, 'aria-controls', suggests ? 'listbox' : null);
    input.disabled = disabled;
    input.readOnly = this.readonly;
    input.placeholder = values.length ? '' : this.placeholder || '';
    setAttr(input, 'aria-label', name);
    setAttr(this.#tokens, 'aria-label', name);
    setAttr(this.#listbox, 'aria-label', name);
    this.toggleState('disabled', disabled);

    if (this.name && values.length) {
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.setFormValue(data);
    } else {
      this.setFormValue(null);
    }
    const missing = this.required && values.length === 0;
    this.setValidity(missing ? { valueMissing: true } : {}, nativeMessage('required'), input);
    setAttr(input, 'aria-required', this.required ? 'true' : null);
    const invalid = this.#touched && !this.validity.valid;
    setAttr(input, 'aria-invalid', invalid ? 'true' : null);
    this.toggleState('user-invalid', invalid);

    const want = this.open && !locked && visible > 0;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, { matchWidth: true }, () => this.#close('outside'));
      this.toggleState('open', true);
      this.emit('open');
    } else if (!want && this.#surface.open) {
      this.#surface.hide();
      this.#nav.set(null);
      this.toggleState('open', false);
      const reason = this.open ? 'empty' : this.#reason;
      this.#reason = 'api';
      this.emit('close', { reason });
    }
    setAttr(input, 'aria-expanded', suggests ? String(this.#surface.open) : null);
    if (this.#nav.active?.hidden) this.#nav.set(null);
  }

  /** @param {string} reason */
  #close(reason) {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  /** @param {string[]} values */
  #commit(values) {
    this.#touched = true;
    this.value = values;
    this.update(new Map());
    this.emit('change', { value: values });
  }

  /**
   * Adds every token in a text, split at the separator and at line breaks.
   * The input is emptied.
   * @param {string} text
   */
  #addText(text) {
    const parts = text
      .split(/[\n\r\t]/)
      .flatMap((line) => (this.separator ? line.split(this.separator) : [line]))
      .map((part) => part.trim())
      .filter(Boolean);
    this.#input.value = '';
    this.#add(parts);
  }

  /** @param {string[]} added */
  #add(added) {
    const values = this.#values();
    const next = [...values];
    for (const value of added) if (!next.includes(value)) next.push(value);
    if (next.length !== values.length) this.#commit(next);
    else this.requestUpdate();
  }

  /** @param {string | undefined} value */
  #remove(value) {
    const values = this.#values();
    const next = values.filter((v) => v !== value);
    if (next.length !== values.length) this.#commit(next);
  }

  /** @param {any} option */
  #pick(option) {
    this.#input.value = '';
    this.#add([valueOf(option)]);
    this.#nav.set(null);
    this.update(new Map());
  }

  /** @param {KeyboardEvent} event */
  #onInputKeydown(event) {
    if (this.isDisabled || this.readonly) return;
    const input = this.#input;
    const nav = this.#nav;
    const showing = this.#surface.open;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const back = isRtl(this) ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'Enter') {
      if (showing && nav.active) {
        event.preventDefault();
        this.#pick(nav.active);
      } else if (input.value.trim()) {
        event.preventDefault();
        this.#addText(input.value);
      } else {
        submitForm(this.form);
      }
    } else if (this.separator && event.key === this.separator) {
      event.preventDefault();
      this.#addText(input.value);
    } else if (event.key === 'Backspace' && atStart && !input.value) {
      const last = this.#values().at(-1);
      if (last !== undefined) {
        event.preventDefault();
        this.#remove(last);
      }
    } else if (event.key === back && atStart) {
      const last = this.#tokenElements().at(-1);
      if (last) {
        event.preventDefault();
        this.#walkTo(last);
      }
    } else if (event.key === 'Escape') {
      if (!showing) return;
      event.preventDefault();
      event.stopPropagation();
      this.#close('escape');
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.#rows().length) return;
      event.preventDefault();
      if (!showing) {
        this.open = true;
        this.update(new Map());
        nav.set(event.key === 'ArrowDown' ? nav.items[0] : nav.items.at(-1) || null);
      } else {
        nav.move(event, { homeEnd: false });
      }
    } else if (showing && nav.move(event, { homeEnd: false })) {
      event.preventDefault();
    }
  }

  /** @param {KeyboardEvent} event */
  #onTokenKeydown(event) {
    const tokens = this.#tokenElements();
    const index = tokens.indexOf(/** @type {any} */ (this.shadowRoot.activeElement));
    if (index < 0) return;
    const forward = isRtl(this) ? 'ArrowLeft' : 'ArrowRight';
    const back = isRtl(this) ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === back) {
      this.#walkTo(tokens[Math.max(0, index - 1)]);
    } else if (event.key === forward) {
      this.#walkTo(tokens[index + 1] || this.#input);
    } else if (event.key === 'Home') {
      this.#walkTo(tokens[0]);
    } else if (event.key === 'End') {
      this.#input.focus();
    } else if ((event.key === 'Backspace' || event.key === 'Delete') && !this.isDisabled && !this.readonly) {
      // update() puts focus on the token that takes this one's place.
      this.#remove(tokens[index].dataset.value);
    } else {
      return;
    }
    event.preventDefault();
  }
}

define('punica-tokenizer', PunicaTokenizer);
