import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import { parseIsoDate, toIsoDate, parseIsoTime, toIsoTime } from '../calendar/dates.js';
import '../datePicker/datePicker.js';
import '../timePicker/timePicker.js';
import styles from './dateTimeInput.css';

/** Attributes handed to the date field as they are. */
const DATE_LABELS = ['labelToggle', 'labelPreviousMonth', 'labelNextMonth', 'labelPreviousYear', 'labelNextYear'];

/**
 * Splits `yyyy-mm-ddTHH:mm` into its date and time, each null when not valid.
 * @param {string | null} value
 * @returns {{ date: string | null, time: string | null }}
 */
function splitDateTime(value) {
  const [date = '', time = ''] = (value || '').split(/[T ]/);
  return { date: toIsoDate(parseIsoDate(date)), time: toIsoTime(parseIsoTime(time)) };
}

/**
 * A date and time field: a `punica-date-picker` and a `punica-time-picker`
 * side by side, submitted as one local date-time.
 *
 * The value is ISO local `yyyy-mm-ddTHH:mm`, with no time zone. It is null
 * until both the date and the time are filled.
 *
 * @element punica-date-time-input
 *
 * @attr {string} value - Default value, `yyyy-mm-ddTHH:mm`.
 * @attr {string} min - Earliest date-time allowed.
 * @attr {string} max - Latest date-time allowed.
 * @attr {number} step - Minutes between the listed times, 30 by default.
 * @attr {string} locale - BCP 47 tag for both fields; the nearest `lang`, else the browser's, by default.
 * @attr {string} label - Accessible name of the group.
 * @attr {string} label-date - Accessible name of the date field, `Date` by default.
 * @attr {string} label-time - Accessible name of the time field, `Time` by default.
 * @attr {string} placeholder-date - Text shown while the date is empty.
 * @attr {string} placeholder-time - Text shown while the time is empty.
 * @attr {string} name - Name the value is submitted under.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no input.
 * @attr {boolean} required - A date and a time are needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-toggle - Name of the calendar button, `Choose date` by default.
 * @attr {string} label-previous-month - Passed to the calendar, `Previous month` by default.
 * @attr {string} label-next-month - Passed to the calendar, `Next month` by default.
 * @attr {string} label-previous-year - Passed to the calendar, `Previous year` by default.
 * @attr {string} label-next-year - Passed to the calendar, `Next year` by default.
 *
 * @prop {string | null} value - The current date-time, or null.
 *
 * @fires punica-change - The user changed the date or the time. `detail.value` is the date-time, or null while one of them is empty.
 * @fires punica-open - The calendar or the list of times opened.
 * @fires punica-close - The calendar or the list of times closed. `detail.reason` as on the two fields.
 *
 * @csspart group - The wrapper around the two fields.
 * @csspart date - The `punica-date-picker`.
 * @csspart time - The `punica-time-picker`.
 *
 * @cssprop --punica-date-time-input-gap - Space between the two fields.
 *
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaDateTimeInput extends FormControl(PunicaElement) {
  static properties = {
    value: { reflect: false },
    min: {},
    max: {},
    step: { type: Number, default: 30 },
    locale: {},
    label: {},
    labelDate: { default: 'Date' },
    labelTime: { default: 'Time' },
    placeholderDate: {},
    placeholderTime: {},
    readonly: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelToggle: { default: 'Choose date' },
    labelPreviousMonth: { default: 'Previous month' },
    labelNextMonth: { default: 'Next month' },
    labelPreviousYear: { default: 'Previous year' },
    labelNextYear: { default: 'Next year' }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="group" class="group" role="group">
      <punica-date-picker part="date"></punica-date-picker>
      <punica-time-picker part="time"></punica-time-picker>
    </div>
  `;

  #group = this.$('.group');
  #date = this.$('punica-date-picker');
  #time = this.$('punica-time-picker');
  /** The value the two fields were last written from, or produced. @type {string | null | undefined} */
  #synced = undefined;
  #touched = false;

  constructor() {
    super();
    // The composed elements are used before the document would upgrade them.
    customElements.upgrade(this.shadowRoot);
    this.shadowRoot.addEventListener('punica-change', (event) => {
      event.stopPropagation();
      this.#compose();
    });
    this.shadowRoot.addEventListener('keydown', (event) => {
      const key = /** @type {KeyboardEvent} */ (event);
      if (key.key !== 'Enter' || key.defaultPrevented) return;
      if (!(key.composedPath()[0] instanceof HTMLInputElement)) return;
      // The inner field already took the typed text; submit with it.
      this.#compose();
      this.update(new Map());
      this.form?.requestSubmit();
    });
    this.shadowRoot.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (next instanceof Node && this.shadowRoot.contains(next)) return;
      this.#touched = true;
      // After the inner field has reported its own validity.
      queueMicrotask(() => this.isConnected && this.update(new Map()));
    });
  }

  /** Moves focus to the date field. */
  focus(options) {
    this.#date.focus(options);
  }

  formReset() {
    this.#touched = false;
    this.#synced = undefined;
    this.value = this.getAttribute('value');
    this.requestUpdate();
  }

  formRestore(state) {
    if (typeof state === 'string') this.value = state;
  }

  update() {
    const language = fieldLanguage(this);
    const disabled = this.isDisabled;
    const date = this.#date;
    const time = this.#time;

    if (this.value !== this.#synced) {
      const parts = splitDateTime(this.value);
      const whole = parts.date && parts.time ? `${parts.date}T${parts.time}` : null;
      this.#synced = this.value;
      date.value = whole ? parts.date : null;
      time.value = whole ? parts.time : null;
    }
    const isoDate = toIsoDate(parseIsoDate(date.value));
    const isoTime = toIsoTime(parseIsoTime(time.value));
    const value = isoDate && isoTime ? `${isoDate}T${isoTime}` : null;

    const min = splitDateTime(this.min);
    const max = splitDateTime(this.max);
    date.min = min.date;
    date.max = max.date;
    time.min = min.date && isoDate === min.date ? min.time : null;
    time.max = max.date && isoDate === max.date ? max.time : null;
    time.step = this.step;
    for (const field of [date, time]) {
      field.locale = language;
      field.disabled = disabled;
      field.readonly = this.readonly;
      field.size = this.size;
    }
    date.label = this.labelDate;
    time.label = this.labelTime;
    date.placeholder = this.placeholderDate;
    time.placeholder = this.placeholderTime;
    for (const name of DATE_LABELS) date[name] = this[name];
    setAttr(this.#group, 'aria-label', fieldName(this));
    this.toggleState('disabled', disabled);

    this.setFormValue(value);
    const partial = !!isoDate !== !!isoTime;
    const bad = date.validity.badInput || time.validity.badInput;
    const wholeMin = min.date && min.time ? `${min.date}T${min.time}` : null;
    const wholeMax = max.date && max.time ? `${max.date}T${max.time}` : null;
    if (bad) {
      this.setValidity({ badInput: true }, nativeMessage('format'), date.validity.badInput ? date : time);
    } else if (partial) {
      this.setValidity({ badInput: true }, nativeMessage('required'), isoDate ? time : date);
    } else if (!value) {
      this.setValidity(this.required ? { valueMissing: true } : {}, nativeMessage('required'), date);
    } else if (wholeMin && value < wholeMin) {
      this.setValidity({ rangeUnderflow: true }, nativeMessage('min', { type: 'datetime-local', value, limit: wholeMin }), date);
    } else if (wholeMax && value > wholeMax) {
      this.setValidity({ rangeOverflow: true }, nativeMessage('max', { type: 'datetime-local', value, limit: wholeMax }), date);
    } else {
      this.setValidity({});
    }
    this.toggleState('user-invalid', this.#touched && !this.validity.valid);
  }

  /** Reads the two fields into one value and tells the page when it changed. */
  #compose() {
    const isoDate = toIsoDate(parseIsoDate(this.#date.value));
    const isoTime = toIsoTime(parseIsoTime(this.#time.value));
    const value = isoDate && isoTime ? `${isoDate}T${isoTime}` : null;
    const parts = splitDateTime(this.value);
    const before = parts.date && parts.time ? `${parts.date}T${parts.time}` : null;
    this.#touched = true;
    this.#synced = value;
    this.value = value;
    this.requestUpdate();
    if (value !== before) this.emit('change', { value });
  }
}

define('punica-date-time-input', PunicaDateTimeInput);
