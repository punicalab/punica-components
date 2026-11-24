import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, OptionNavigator, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import { parseIsoTime, toIsoTime, formatFieldTime, parseFieldTime } from '../calendar/dates.js';
import '../select/option.js';
import fieldStyles from '../select/field.css';
import styles from './timePicker.css';

/**
 * A time field: a text input that takes a typed time, with a list of times
 * every `step` minutes to pick from.
 *
 * The value is 24-hour `HH:mm`. It is shown the way the language writes
 * times, 12 or 24 hour, and any minute can be typed, not only the listed ones.
 *
 * @element punica-time-picker
 *
 * @attr {string} value - Default value, `HH:mm`.
 * @attr {number} step - Minutes between the listed times, 30 by default.
 * @attr {string} min - Earliest time allowed, `HH:mm`.
 * @attr {string} max - Latest time allowed, `HH:mm`.
 * @attr {string} locale - BCP 47 tag for the display format; the nearest `lang`, else the browser's, by default.
 * @attr {string} placeholder - Text shown while the field is empty.
 * @attr {string} label - Accessible name.
 * @attr {boolean} open - The list is showing.
 * @attr {string} name - Name the value is submitted under.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no input.
 * @attr {boolean} required - A time is needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 *
 * @prop {string | null} value - The current time, `HH:mm`, or null.
 *
 * @slot start - Content before the input, an icon.
 *
 * @fires punica-change - The user typed or picked a time. `detail.value` is `HH:mm` or null.
 * @fires punica-open - The list opened.
 * @fires punica-close - The list closed. `detail.reason` is `select`, `escape`, `outside`, `blur` or `api`.
 *
 * @csspart field - The bordered box.
 * @csspart input - The text input, a combobox.
 * @csspart toggle - The clock button, for the pointer.
 * @csspart listbox - The floating list of times.
 * @csspart option - Each time in the list.
 *
 * @cssprop --punica-time-picker-radius - Corner radius of the field.
 * @cssprop --punica-time-picker-height - Minimum block size of the field.
 * @cssprop --punica-time-picker-padding - Inline padding of the field.
 * @cssprop --punica-time-picker-border-color - Border colour at rest.
 * @cssprop --punica-time-picker-background - Field background.
 * @cssprop --punica-time-picker-min-width - Smallest inline size.
 * @cssprop --punica-time-picker-listbox-max-height - Largest block size of the list.
 *
 * @cssstate open - The list is showing.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaTimePicker extends FormControl(PunicaElement) {
  static properties = {
    value: { reflect: false },
    step: { type: Number, default: 30 },
    min: {},
    max: {},
    locale: {},
    placeholder: {},
    label: {},
    open: { type: Boolean },
    readonly: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="field" class="field">
      <slot name="start"></slot>
      <input part="input" class="control" type="text" role="combobox" aria-haspopup="listbox" aria-controls="listbox" aria-expanded="false" aria-autocomplete="none" autocomplete="off" spellcheck="false">
      <button part="toggle" class="icon-button" type="button" tabindex="-1" aria-hidden="true">${icons.clock}</button>
    </div>
    <div part="listbox" id="listbox" class="panel listbox" role="listbox" popover="manual"></div>
  `;

  #field = this.$('.field');
  #input = this.$('input');
  #toggle = this.$('[part="toggle"]');
  #listbox = this.$('#listbox');
  #surface = new FieldSurface(this, this.#listbox);
  #nav = new OptionNavigator(this.#input, () => [...this.#listbox.children]);
  /** @type {string | null} */
  #textKey = null;
  /** @type {string | null} */
  #listKey = null;
  #bad = false;
  #touched = false;
  #reason = 'api';

  constructor() {
    super();
    const input = this.#input;
    input.addEventListener('change', () => this.#commitText());
    input.addEventListener('input', () => this.#nav.set(null));
    input.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.#toggle.addEventListener('click', () => {
      if (this.open) this.#close('api');
      else this.show();
      input.focus();
    });
    this.#listbox.addEventListener('mousedown', (event) => event.preventDefault());
    this.#listbox.addEventListener('click', (event) => {
      const option = event.target instanceof Element ? event.target.closest('punica-option') : null;
      if (option) this.#pick(option);
    });
    this.#listbox.addEventListener('pointermove', (event) => {
      const option = event.target instanceof Element ? event.target.closest('punica-option') : null;
      if (option && option !== this.#nav.active) this.#nav.set(option);
    });
    this.shadowRoot.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (next instanceof Node && this.shadowRoot.contains(next)) return;
      this.#touched = true;
      if (this.open) this.#close('blur');
      else this.requestUpdate();
    });
  }

  /** Opens the list of times. */
  show() {
    this.open = true;
  }

  /** Closes the list of times. */
  hide() {
    this.#close('api');
  }

  /** Moves focus to the text input. */
  focus(options) {
    this.#input.focus(options);
  }

  connected() {
    if (this.open) this.requestUpdate();
  }

  disconnected() {
    this.#surface.hide();
    this.#nav.set(null);
  }

  formReset() {
    this.#touched = false;
    this.#textKey = null;
    this.value = this.getAttribute('value');
    this.requestUpdate();
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state;
  }

  update() {
    const language = fieldLanguage(this);
    const input = this.#input;
    const minutes = parseIsoTime(this.value);
    const iso = toIsoTime(minutes);
    const disabled = this.isDisabled;
    const name = fieldName(this);
    const min = parseIsoTime(this.min);
    const max = parseIsoTime(this.max);

    const key = `${iso}|${language}`;
    if (key !== this.#textKey) {
      this.#textKey = key;
      this.#bad = false;
      input.value = formatFieldTime(language, minutes);
    }
    input.disabled = disabled;
    input.readOnly = this.readonly;
    input.required = this.required;
    input.placeholder = this.placeholder || '';
    setAttr(input, 'aria-label', name);
    setAttr(this.#listbox, 'aria-label', name);
    this.#toggle.disabled = disabled || this.readonly;
    this.toggleState('disabled', disabled);

    // The list is rebuilt only when what it is made from changes.
    const step = Math.max(1, Math.round(this.step || 30));
    const listKey = [step, min, max, language].join('|');
    if (listKey !== this.#listKey) {
      this.#listKey = listKey;
      this.#nav.set(null);
      const rows = [];
      for (let t = 0; t < 24 * 60; t += step) {
        if ((min != null && t < min) || (max != null && t > max)) continue;
        const option = document.createElement('punica-option');
        option.setAttribute('part', 'option');
        option.value = toIsoTime(t);
        option.textContent = formatFieldTime(language, t);
        rows.push(option);
      }
      this.#listbox.replaceChildren(...rows);
    }
    for (const option of this.#listbox.children) /** @type {any} */ (option).selected = option.getAttribute('value') === iso;

    this.setFormValue(iso);
    if (this.#bad) {
      this.setValidity({ badInput: true }, nativeMessage('format'), input);
    } else if (minutes == null) {
      this.setValidity(this.required ? { valueMissing: true } : {}, nativeMessage('required'), input);
    } else if (min != null && minutes < min) {
      this.setValidity({ rangeUnderflow: true }, nativeMessage('min', { type: 'time', value: iso, limit: toIsoTime(min) }), input);
    } else if (max != null && minutes > max) {
      this.setValidity({ rangeOverflow: true }, nativeMessage('max', { type: 'time', value: iso, limit: toIsoTime(max) }), input);
    } else {
      this.setValidity({});
    }
    const invalid = this.#touched && !this.validity.valid;
    setAttr(input, 'aria-invalid', invalid ? 'true' : null);
    this.toggleState('user-invalid', invalid);

    const want = this.open && !disabled && !this.readonly;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, { matchWidth: true }, () => this.#close('outside'));
      // Start on the held time, else on the first one after it.
      const rows = /** @type {any[]} */ ([...this.#listbox.children]);
      const start = rows.find((o) => o.selected) || rows.find((o) => minutes != null && parseIsoTime(o.value) >= minutes) || rows[0] || null;
      this.#nav.set(start);
      start?.scrollIntoView({ block: 'center' });
      this.toggleState('open', true);
      input.setAttribute('aria-expanded', 'true');
      this.emit('open');
    } else if (!want && this.#surface.open) {
      this.#surface.hide();
      this.#nav.set(null);
      this.toggleState('open', false);
      input.setAttribute('aria-expanded', 'false');
      const reason = this.#reason;
      this.#reason = 'api';
      this.emit('close', { reason });
    }
  }

  /** @param {string} reason */
  #close(reason) {
    if (!this.open) return;
    this.#reason = reason;
    this.open = false;
  }

  /** @param {string | null} iso */
  #commit(iso) {
    this.#touched = true;
    this.#bad = false;
    this.#textKey = null;
    this.requestUpdate();
    if (iso === toIsoTime(parseIsoTime(this.value))) return;
    this.value = iso;
    this.emit('change', { value: iso });
  }

  /** @param {any} option */
  #pick(option) {
    this.#commit(option.value);
    this.#close('select');
  }

  /** Takes what was typed. */
  #commitText() {
    if (this.isDisabled || this.readonly) return;
    const language = fieldLanguage(this);
    const text = this.#input.value.trim();
    const minutes = text ? parseFieldTime(text, language) : null;
    if (text && minutes == null) {
      const had = parseIsoTime(this.value) != null;
      this.#touched = true;
      this.#bad = true;
      this.value = null;
      this.#textKey = `null|${language}`;
      this.requestUpdate();
      if (had) this.emit('change', { value: null });
      return;
    }
    this.#commit(toIsoTime(minutes));
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (this.isDisabled || this.readonly) return;
    const nav = this.#nav;
    if (event.key === 'Enter') {
      if (this.open && nav.active) {
        event.preventDefault();
        this.#pick(nav.active);
      } else {
        this.#commitText();
        this.#close('select');
        // The form must read the typed time, not the one before it.
        this.update(new Map());
        submitForm(this.form);
      }
    } else if (event.key === 'Escape') {
      if (!this.open) return;
      event.preventDefault();
      event.stopPropagation();
      this.#close('escape');
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open) this.show();
      else nav.move(event, { homeEnd: false });
    } else if (this.open && nav.move(event, { homeEnd: false })) {
      event.preventDefault();
    }
  }
}

define('punica-time-picker', PunicaTimePicker);
