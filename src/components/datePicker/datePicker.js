import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import { parseIsoDate, toIsoDate, todayDate, compareDates, formatFieldDate, parseFieldDate } from '../calendar/dates.js';
import '../calendar/calendar.js';
import fieldStyles from '../select/field.css';
import styles from './datePicker.css';

/**
 * A date field: a text input that takes a typed date in the language's own
 * order, and a button that opens a calendar.
 *
 * The value is an ISO `yyyy-mm-dd` calendar date; no time zone is involved.
 *
 * @element punica-date-picker
 *
 * @attr {string} value - Default value, `yyyy-mm-dd`.
 * @attr {string} min - Earliest date allowed.
 * @attr {string} max - Latest date allowed.
 * @attr {string} locale - BCP 47 tag for the display format and the calendar; the nearest `lang`, else the browser's, by default.
 * @attr {string} placeholder - Text shown while the field is empty.
 * @attr {string} label - Accessible name.
 * @attr {boolean} open - The calendar is showing.
 * @attr {string} name - Name the value is submitted under.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no input.
 * @attr {boolean} required - A date is needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-toggle - Name of the calendar button and of the calendar panel, `Choose date` by default.
 * @attr {string} label-previous-month - Passed to the calendar, `Previous month` by default.
 * @attr {string} label-next-month - Passed to the calendar, `Next month` by default.
 * @attr {string} label-previous-year - Passed to the calendar, `Previous year` by default.
 * @attr {string} label-next-year - Passed to the calendar, `Next year` by default.
 *
 * @prop {string | null} value - The current date, `yyyy-mm-dd`, or null.
 * @prop {((date: string) => boolean) | null} disabledDates - Answers true for an ISO date the calendar must not offer.
 *
 * @slot start - Content before the input, an icon.
 *
 * @fires punica-change - The user typed or picked a date. `detail.value` is the ISO date or null.
 * @fires punica-open - The calendar opened.
 * @fires punica-close - The calendar closed. `detail.reason` is `select`, `escape`, `outside`, `blur` or `api`.
 *
 * @csspart field - The bordered box.
 * @csspart input - The text input.
 * @csspart toggle - The calendar button.
 * @csspart panel - The floating panel.
 * @csspart calendar - The `punica-calendar` inside it.
 *
 * @cssprop --punica-date-picker-radius - Corner radius of the field.
 * @cssprop --punica-date-picker-height - Minimum block size of the field.
 * @cssprop --punica-date-picker-padding - Inline padding of the field.
 * @cssprop --punica-date-picker-border-color - Border colour at rest.
 * @cssprop --punica-date-picker-background - Field background.
 * @cssprop --punica-date-picker-min-width - Smallest inline size.
 * @cssprop --punica-date-picker-panel-padding - Padding around the calendar.
 *
 * @cssstate open - The calendar is showing.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaDatePicker extends FormControl(PunicaElement) {
  static properties = {
    value: { reflect: false },
    min: {},
    max: {},
    locale: {},
    placeholder: {},
    label: {},
    open: { type: Boolean },
    readonly: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelToggle: { default: 'Choose date' },
    labelPreviousMonth: { default: 'Previous month' },
    labelNextMonth: { default: 'Next month' },
    labelPreviousYear: { default: 'Previous year' },
    labelNextYear: { default: 'Next year' },
    disabledDates: { type: Object, attribute: false }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="field" class="field">
      <slot name="start"></slot>
      <input part="input" class="control" type="text" inputmode="numeric" autocomplete="off" spellcheck="false">
      <button part="toggle" class="icon-button" type="button" aria-haspopup="dialog" aria-controls="panel" aria-expanded="false">${icons.calendar}</button>
    </div>
    <div part="panel" id="panel" class="panel" role="dialog" popover="manual">
      <punica-calendar part="calendar"></punica-calendar>
    </div>
  `;

  #field = this.$('.field');
  #input = this.$('input');
  #toggle = this.$('[part="toggle"]');
  #panel = this.$('#panel');
  #calendar = this.$('punica-calendar');
  #surface = new FieldSurface(this, this.#panel);
  /** What the input's text was last written from. @type {string | null} */
  #textKey = null;
  /** The typed text is not a date. */
  #bad = false;
  #touched = false;
  #tabbing = false;
  #reason = 'api';

  constructor() {
    super();
    // The composed elements are used before the document would upgrade them.
    customElements.upgrade(this.shadowRoot);
    const input = this.#input;
    input.addEventListener('change', () => this.#commitText());
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.#commitText();
        // The form must read the typed date, not the one before it.
        this.update(new Map());
        this.form?.requestSubmit();
      } else if (event.key === 'ArrowDown' && !this.open) {
        event.preventDefault();
        this.show();
      } else if (event.key === 'Escape' && this.open) {
        event.preventDefault();
        event.stopPropagation();
        this.#close('escape');
      }
    });
    this.#toggle.addEventListener('click', () => {
      if (this.open) this.#close('api');
      else this.show();
    });
    this.#calendar.addEventListener('punica-change', (event) => {
      event.stopPropagation();
      this.#commit(/** @type {CustomEvent} */ (event).detail.value);
    });
    this.#calendar.addEventListener('punica-select', (event) => {
      event.stopPropagation();
      this.#close('select');
      this.#input.focus();
    });
    this.#panel.addEventListener('keydown', (event) => {
      this.#tabbing = event.key === 'Tab';
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      this.#close('escape');
      this.#toggle.focus();
    });
    this.shadowRoot.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (next instanceof Node && this.shadowRoot.contains(next)) return;
      this.#touched = true;
      // Tabbing out of the calendar closes it; another surface taking focus does not.
      if (this.open && this.#tabbing) this.#close('blur');
      this.#tabbing = false;
      this.requestUpdate();
    });
  }

  /** The calendar inside the panel. */
  get calendar() {
    return this.#calendar;
  }

  /** Opens the calendar. */
  show() {
    this.open = true;
  }

  /** Closes the calendar. */
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
    const date = parseIsoDate(this.value);
    const iso = toIsoDate(date);
    const disabled = this.isDisabled;
    const name = fieldName(this);

    const key = `${iso}|${language}`;
    if (key !== this.#textKey) {
      this.#textKey = key;
      this.#bad = false;
      input.value = formatFieldDate(language, date);
    }
    input.disabled = disabled;
    input.readOnly = this.readonly;
    input.required = this.required;
    input.placeholder = this.placeholder || '';
    setAttr(input, 'aria-label', name);
    this.#toggle.disabled = disabled || this.readonly;
    setAttr(this.#toggle, 'aria-label', this.labelToggle);
    setAttr(this.#panel, 'aria-label', this.labelToggle);
    this.toggleState('disabled', disabled);

    const calendar = this.#calendar;
    calendar.value = iso;
    calendar.min = this.min;
    calendar.max = this.max;
    calendar.locale = language;
    calendar.disabledDates = this.disabledDates;
    calendar.labelPreviousMonth = this.labelPreviousMonth;
    calendar.labelNextMonth = this.labelNextMonth;
    calendar.labelPreviousYear = this.labelPreviousYear;
    calendar.labelNextYear = this.labelNextYear;

    this.setFormValue(iso);
    const min = parseIsoDate(this.min);
    const max = parseIsoDate(this.max);
    if (this.#bad) {
      this.setValidity({ badInput: true }, nativeMessage('format'), input);
    } else if (!date) {
      this.setValidity(this.required ? { valueMissing: true } : {}, nativeMessage('required'), input);
    } else if (min && compareDates(date, min) < 0) {
      this.setValidity({ rangeUnderflow: true }, nativeMessage('min', { value: iso, limit: this.min }), input);
    } else if (max && compareDates(date, max) > 0) {
      this.setValidity({ rangeOverflow: true }, nativeMessage('max', { value: iso, limit: this.max }), input);
    } else {
      this.setValidity({});
    }
    const invalid = this.#touched && !this.validity.valid;
    setAttr(input, 'aria-invalid', invalid ? 'true' : null);
    this.toggleState('user-invalid', invalid);

    const want = this.open && !disabled && !this.readonly;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, {}, () => this.#close('outside'));
      calendar.showDate(iso || toIsoDate(todayDate()));
      this.toggleState('open', true);
      this.#toggle.setAttribute('aria-expanded', 'true');
      calendar.focus({ preventScroll: true });
      this.emit('open');
    } else if (!want && this.#surface.open) {
      this.#surface.hide();
      this.toggleState('open', false);
      this.#toggle.setAttribute('aria-expanded', 'false');
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
    // Write the text again even when the date is the one already held.
    this.#textKey = null;
    this.requestUpdate();
    if (iso === toIsoDate(parseIsoDate(this.value))) return;
    this.value = iso;
    this.emit('change', { value: iso });
  }

  /** Takes what was typed. */
  #commitText() {
    if (this.isDisabled || this.readonly) return;
    const text = this.#input.value.trim();
    const date = text ? parseFieldDate(text, fieldLanguage(this)) : null;
    if (text && !date) {
      // Not a date: the text stays for the user to fix and the value is empty.
      const had = parseIsoDate(this.value);
      this.#touched = true;
      this.#bad = true;
      this.value = null;
      this.#textKey = `null|${fieldLanguage(this)}`;
      this.requestUpdate();
      if (had) this.emit('change', { value: null });
      return;
    }
    this.#commit(toIsoDate(date));
  }
}

define('punica-date-picker', PunicaDatePicker);
