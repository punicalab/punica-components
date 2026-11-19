import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, OptionNavigator, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import '../select/option.js';
import fieldStyles from '../select/field.css';
import styles from './autocomplete.css';

/** @param {any} option an option that may not be upgraded yet */
const valueOf = (option) => option.optionValue ?? option.getAttribute('value') ?? option.textContent.trim();
/** @param {any} option */
const textOf = (option) => option.text ?? option.getAttribute('label') ?? option.textContent.trim();

/**
 * A text input that suggests values as the user types: an editable combobox
 * with list autocomplete.
 *
 * The suggestions are `punica-option` children, or the `options` array for
 * data that arrives later: listen for `punica-input`, fetch, and assign
 * `options`. The value is the picked option's `value`; with `free-text`, any
 * typed text is a value too.
 *
 * @element punica-autocomplete
 *
 * @attr {string} value - Default value.
 * @attr {string} placeholder - Text shown while the field is empty.
 * @attr {string} label - Accessible name.
 * @attr {boolean} open - The list is showing, when it has rows to show.
 * @attr {boolean} free-text - Text that matches no option is taken as the value.
 * @attr {boolean} no-filter - The list is shown as given; for options already filtered by a server.
 * @attr {boolean} clearable - Shows a button that empties the value.
 * @attr {string} name - Name the value is submitted under.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no input.
 * @attr {boolean} required - A value is needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-clear - Name of the clear button, `Clear` by default.
 *
 * @prop {string | null} value - The current value.
 * @prop {(string | { value: string, label?: string, disabled?: boolean })[] | null} options - Suggestions given as data; shown before the `punica-option` children.
 *
 * @slot - The `punica-option` rows.
 * @slot start - Content before the input, an icon.
 * @slot end - Content after the input.
 *
 * @fires punica-input - The user typed. `detail.value` is the text in the input.
 * @fires punica-change - The user picked an option, committed free text or cleared. `detail.value` is the new value.
 * @fires punica-open - The list opened.
 * @fires punica-close - The list closed. `detail.reason` is `select`, `escape`, `outside`, `blur`, `empty` or `api`.
 *
 * @csspart field - The bordered box.
 * @csspart input - The text input, a combobox.
 * @csspart clear - The clear button.
 * @csspart listbox - The floating list.
 * @csspart option - Each row made from `options`.
 *
 * @cssprop --punica-autocomplete-radius - Corner radius of the field.
 * @cssprop --punica-autocomplete-height - Minimum block size of the field.
 * @cssprop --punica-autocomplete-padding - Inline padding of the field.
 * @cssprop --punica-autocomplete-border-color - Border colour at rest.
 * @cssprop --punica-autocomplete-background - Field background.
 * @cssprop --punica-autocomplete-min-width - Smallest inline size.
 * @cssprop --punica-autocomplete-listbox-max-height - Largest block size of the list.
 *
 * @cssstate open - The list is showing.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaAutocomplete extends FormControl(PunicaElement) {
  static properties = {
    value: { reflect: false },
    placeholder: {},
    label: {},
    open: { type: Boolean },
    freeText: { type: Boolean },
    noFilter: { type: Boolean },
    clearable: { type: Boolean },
    readonly: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelClear: { default: 'Clear' },
    options: { type: Array, attribute: false }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="field" class="field">
      <slot name="start"></slot>
      <input part="input" class="control" type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="listbox" aria-expanded="false" autocomplete="off" autocapitalize="off" spellcheck="false">
      <button part="clear" class="icon-button" type="button" hidden>${icons.close}</button>
      <slot name="end"></slot>
    </div>
    <div part="listbox" id="listbox" class="panel listbox" role="listbox" popover="manual"><slot></slot></div>
  `;

  #field = this.$('.field');
  #input = this.$('input');
  #clear = this.$('[part="clear"]');
  #listbox = this.$('#listbox');
  #slot = this.$('slot:not([name])');
  #surface = new FieldSurface(this, this.#listbox);
  #nav = new OptionNavigator(this.#input, () => this.#rows());
  /** Rows made from the `options` property. @type {any[]} */
  #generated = [];
  /** The array those rows were made from. @type {unknown} */
  #generatedFrom = null;
  /** What the user typed since the last commit; null while the text is the value's own. @type {string | null} */
  #typed = null;
  /** What the input's text was last written from. @type {string | null} */
  #textKey = null;
  #touched = false;
  #reason = 'api';

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('input', () => {
      if (this.isDisabled || this.readonly) return;
      this.#typed = input.value;
      this.#nav.set(null);
      this.open = true;
      this.update(new Map());
      this.emit('input', { value: input.value });
    });
    input.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.#clear.addEventListener('click', () => {
      if (this.isDisabled || this.readonly) return;
      this.#commit(null);
      input.focus();
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
      this.#commitText();
      this.#close('blur');
      this.requestUpdate();
    });
  }

  /** Opens the list. */
  show() {
    this.open = true;
  }

  /** Closes the list. */
  hide() {
    this.#close('api');
  }

  /** Moves focus to the text input. */
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
    this.#typed = null;
    this.#textKey = null;
    this.value = this.getAttribute('value');
    this.requestUpdate();
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state;
  }

  /** Every row: the generated ones, then the `punica-option` children. @returns {any[]} */
  #rows() {
    return [...this.#generated, ...[...this.children].filter((child) => child.localName === 'punica-option')];
  }

  #rowFrom(event) {
    const rows = this.#rows();
    return event.composedPath().find((node) => rows.includes(node)) || null;
  }

  /** The text shown for a value: its option's label, else the value itself. */
  #textFor(value) {
    if (value == null) return '';
    const option = this.#rows().find((row) => valueOf(row) === value);
    return option ? textOf(option) : value;
  }

  update() {
    const language = fieldLanguage(this);
    const input = this.#input;
    const disabled = this.isDisabled;
    const name = fieldName(this);
    const value = this.value == null || this.value === '' ? null : this.value;

    // Rows from data, built as elements so a label is only ever text.
    if (this.options !== this.#generatedFrom) {
      this.#generatedFrom = this.options;
      for (const row of this.#generated) row.remove();
      this.#generated = (Array.isArray(this.options) ? this.options : []).map((item) => {
        const data = typeof item === 'object' && item !== null ? item : { value: String(item) };
        const option = /** @type {any} */ (document.createElement('punica-option'));
        option.setAttribute('part', 'option');
        option.value = String(data.value);
        option.textContent = String(data.label ?? data.value);
        option.disabled = !!data.disabled;
        return option;
      });
      this.#slot.before(...this.#generated);
    }

    const rows = this.#rows();
    const text = this.#textFor(value);
    const key = `${value}|${text}`;
    if (this.#typed === null && key !== this.#textKey) {
      this.#textKey = key;
      input.value = text;
    }

    const needle = (this.#typed ?? '').trim().toLocaleLowerCase(language);
    let visible = 0;
    for (const row of rows) {
      const match = this.noFilter || !needle || textOf(row).toLocaleLowerCase(language).includes(needle);
      row.hidden = !match;
      row.selected = value != null && valueOf(row) === value;
      if (match) visible++;
    }

    input.disabled = disabled;
    input.readOnly = this.readonly;
    input.required = this.required;
    input.placeholder = this.placeholder || '';
    setAttr(input, 'aria-label', name);
    setAttr(this.#listbox, 'aria-label', name);
    setAttr(this.#clear, 'aria-label', this.labelClear);
    this.#clear.hidden = !this.clearable || value == null || disabled || this.readonly;
    this.toggleState('disabled', disabled);

    this.setFormValue(value);
    this.setValidity(this.required && value == null ? { valueMissing: true } : {}, nativeMessage('required'), input);
    const invalid = this.#touched && !this.validity.valid;
    setAttr(input, 'aria-invalid', invalid ? 'true' : null);
    this.toggleState('user-invalid', invalid);

    const want = this.open && !disabled && !this.readonly && visible > 0;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, { matchWidth: true }, () => this.#close('outside'));
      this.toggleState('open', true);
      input.setAttribute('aria-expanded', 'true');
      this.emit('open');
    } else if (!want && this.#surface.open) {
      this.#surface.hide();
      this.#nav.set(null);
      this.toggleState('open', false);
      input.setAttribute('aria-expanded', 'false');
      const reason = this.open ? 'empty' : this.#reason;
      this.#reason = 'api';
      this.emit('close', { reason });
    }
    if (this.#nav.active?.hidden) this.#nav.set(null);
  }

  /** @param {string} reason */
  #close(reason) {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  /** @param {string | null} value */
  #commit(value) {
    const before = this.value == null || this.value === '' ? null : this.value;
    this.#touched = true;
    this.#typed = null;
    this.#textKey = null;
    this.value = value;
    this.update(new Map());
    if (value !== before) this.emit('change', { value });
  }

  /** @param {any} option */
  #pick(option) {
    this.#commit(valueOf(option));
    this.#close('select');
  }

  /** Takes what was typed: an option with that label, free text, or nothing. */
  #commitText() {
    if (this.#typed === null || this.isDisabled || this.readonly) return;
    const language = fieldLanguage(this);
    const text = this.#input.value.trim();
    if (!text) {
      this.#commit(null);
      return;
    }
    const lower = text.toLocaleLowerCase(language);
    const match = this.#rows().find((row) => !row.disabled && textOf(row).toLocaleLowerCase(language) === lower);
    if (match) this.#commit(valueOf(match));
    else if (this.freeText) this.#commit(text);
    // No such option: back to the value the field holds.
    else this.#commit(this.value);
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (this.isDisabled || this.readonly) return;
    const nav = this.#nav;
    const showing = this.#surface.open;
    if (event.key === 'Enter') {
      if (showing && nav.active) {
        event.preventDefault();
        this.#pick(nav.active);
        return;
      }
      this.#commitText();
      this.#close('select');
      // The form must read the typed value, not the one before it.
      this.update(new Map());
      this.form?.requestSubmit();
    } else if (event.key === 'Escape') {
      if (!showing) return;
      event.preventDefault();
      event.stopPropagation();
      this.#close('escape');
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showing) {
        this.open = true;
        this.update(new Map());
        if (!event.altKey) nav.set(event.key === 'ArrowDown' ? nav.items[0] : nav.items.at(-1) || null);
      } else if (event.altKey && event.key === 'ArrowUp') {
        this.#close('api');
      } else {
        nav.move(event, { homeEnd: false });
      }
    } else if (showing && nav.move(event, { homeEnd: false })) {
      event.preventDefault();
    }
  }
}

define('punica-autocomplete', PunicaAutocomplete);
