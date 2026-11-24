import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import { parseIsoDate, toIsoDate, todayDate, compareDates, formatFieldDate, parseFieldDate } from '../calendar/dates.js';
import '../calendar/calendar.js';
import fieldStyles from '../select/field.css';
import styles from './dateRangeInput.css';

/**
 * A date range field: a start and an end date, typed or picked on a
 * calendar in range mode.
 *
 * Both values are ISO `yyyy-mm-dd` calendar dates. In a form the element
 * submits two entries, `<name>-start` and `<name>-end`.
 *
 * @element punica-date-range-input
 *
 * @attr {string} value-start - Default start date, `yyyy-mm-dd`.
 * @attr {string} value-end - Default end date, `yyyy-mm-dd`.
 * @attr {string} min - Earliest date allowed.
 * @attr {string} max - Latest date allowed.
 * @attr {string} locale - BCP 47 tag for the display format and the calendar; the nearest `lang`, else the browser's, by default.
 * @attr {string} label - Accessible name of the group.
 * @attr {string} label-start - Accessible name of the start input, `Start date` by default.
 * @attr {string} label-end - Accessible name of the end input, `End date` by default.
 * @attr {string} placeholder-start - Text shown while the start is empty.
 * @attr {string} placeholder-end - Text shown while the end is empty.
 * @attr {boolean} open - The calendar is showing.
 * @attr {string} name - Base of the two submitted names.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its values and takes no input.
 * @attr {boolean} required - Both dates are needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-toggle - Name of the calendar button and of the calendar panel, `Choose dates` by default.
 * @attr {string} label-previous-month - Passed to the calendar, `Previous month` by default.
 * @attr {string} label-next-month - Passed to the calendar, `Next month` by default.
 * @attr {string} label-previous-year - Passed to the calendar, `Previous year` by default.
 * @attr {string} label-next-year - Passed to the calendar, `Next year` by default.
 *
 * @prop {string | null} valueStart - The current start date.
 * @prop {string | null} valueEnd - The current end date.
 * @prop {string | null} value - `start/end` when both are set, else null. Read-only.
 * @prop {((date: string) => boolean) | null} disabledDates - Answers true for an ISO date the calendar must not offer.
 *
 * @slot start - Content before the inputs, an icon.
 *
 * @fires punica-change - The user typed a date or completed a range. `detail` is `{ value, valueStart, valueEnd }`, `value` being `start/end` or null.
 * @fires punica-input - The user picked the start on the calendar and the end is still open. Same `detail`, `valueEnd` null.
 * @fires punica-open - The calendar opened.
 * @fires punica-close - The calendar closed. `detail.reason` is `select`, `escape`, `outside`, `blur` or `api`.
 *
 * @csspart field - The bordered box, a group.
 * @csspart input - Both text inputs.
 * @csspart start - The start input.
 * @csspart end - The end input.
 * @csspart separator - The dash between them.
 * @csspart toggle - The calendar button.
 * @csspart panel - The floating panel.
 * @csspart calendar - The `punica-calendar` inside it.
 *
 * @cssprop --punica-date-range-input-radius - Corner radius of the field.
 * @cssprop --punica-date-range-input-height - Minimum block size of the field.
 * @cssprop --punica-date-range-input-padding - Inline padding of the field.
 * @cssprop --punica-date-range-input-border-color - Border colour at rest.
 * @cssprop --punica-date-range-input-background - Field background.
 * @cssprop --punica-date-range-input-min-width - Smallest inline size.
 * @cssprop --punica-date-range-input-panel-padding - Padding around the calendar.
 *
 * @cssstate open - The calendar is showing.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaDateRangeInput extends FormControl(PunicaElement) {
  static properties = {
    valueStart: { reflect: false },
    valueEnd: { reflect: false },
    min: {},
    max: {},
    locale: {},
    label: {},
    labelStart: { default: 'Start date' },
    labelEnd: { default: 'End date' },
    placeholderStart: {},
    placeholderEnd: {},
    open: { type: Boolean },
    readonly: { type: Boolean },
    size: {},
    fullWidth: { type: Boolean },
    labelToggle: { default: 'Choose dates' },
    labelPreviousMonth: { default: 'Previous month' },
    labelNextMonth: { default: 'Next month' },
    labelPreviousYear: { default: 'Previous year' },
    labelNextYear: { default: 'Next year' },
    disabledDates: { type: Object, attribute: false }
  };

  static styles = [overlayCss, fieldStyles, styles];
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="field" class="field" role="group">
      <slot name="start"></slot>
      <input part="input start" class="control" data-edge="Start" type="text" inputmode="numeric" autocomplete="off" spellcheck="false">
      <span part="separator" class="separator" aria-hidden="true"></span>
      <input part="input end" class="control" data-edge="End" type="text" inputmode="numeric" autocomplete="off" spellcheck="false">
      <button part="toggle" class="icon-button" type="button" aria-haspopup="dialog" aria-controls="panel" aria-expanded="false">${icons.calendar}</button>
    </div>
    <div part="panel" id="panel" class="panel" role="dialog" popover="manual">
      <punica-calendar part="calendar" range></punica-calendar>
    </div>
  `;

  #field = this.$('.field');
  /** @type {{ Start: HTMLInputElement, End: HTMLInputElement }} */
  #inputs = { Start: this.$('[data-edge="Start"]'), End: this.$('[data-edge="End"]') };
  #toggle = this.$('[part="toggle"]');
  #panel = this.$('#panel');
  #calendar = this.$('punica-calendar');
  #surface = new FieldSurface(this, this.#panel);
  /** What each input's text was last written from. */
  #textKeys = { Start: /** @type {string | null} */ (null), End: /** @type {string | null} */ (null) };
  /** Whether each input holds text that is not a date. */
  #bad = { Start: false, End: false };
  #touched = false;
  #tabbing = false;
  #reason = 'api';

  constructor() {
    super();
    // The composed elements are used before the document would upgrade them.
    customElements.upgrade(this.shadowRoot);
    for (const edge of /** @type {('Start' | 'End')[]} */ (['Start', 'End'])) {
      const input = this.#inputs[edge];
      input.addEventListener('change', () => this.#commitText(edge));
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          this.#commitText(edge);
          // The form must read the typed date, not the one before it.
          this.update(new Map());
          submitForm(this.form);
        } else if (event.key === 'ArrowDown' && !this.open) {
          event.preventDefault();
          this.show();
        } else if (event.key === 'Escape' && this.open) {
          event.preventDefault();
          event.stopPropagation();
          this.#close('escape');
        }
      });
    }
    this.#toggle.addEventListener('click', () => {
      if (this.open) this.#close('api');
      else this.show();
    });
    const calendar = this.#calendar;
    calendar.addEventListener('punica-input', (event) => {
      event.stopPropagation();
      this.#take(calendar.valueStart, null, 'input');
    });
    calendar.addEventListener('punica-change', (event) => {
      event.stopPropagation();
      this.#take(calendar.valueStart, calendar.valueEnd, 'change');
      this.#close('select');
      this.#inputs.End.focus();
    });
    calendar.addEventListener('punica-select', (event) => event.stopPropagation());
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

  /** `start/end` when both dates are set, else null. */
  get value() {
    const start = toIsoDate(parseIsoDate(this.valueStart));
    const end = toIsoDate(parseIsoDate(this.valueEnd));
    return start && end ? `${start}/${end}` : null;
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

  /** Moves focus to the start input. */
  focus(options) {
    this.#inputs.Start.focus(options);
  }

  connected() {
    if (this.open) this.requestUpdate();
  }

  disconnected() {
    this.#surface.hide();
  }

  formReset() {
    this.#touched = false;
    this.#textKeys = { Start: null, End: null };
    this.valueStart = this.getAttribute('value-start');
    this.valueEnd = this.getAttribute('value-end');
    this.requestUpdate();
  }

  formRestore(state) {
    if (!(state instanceof FormData)) return;
    this.valueStart = /** @type {string | null} */ (state.get(`${this.name}-start`));
    this.valueEnd = /** @type {string | null} */ (state.get(`${this.name}-end`));
  }

  update() {
    const language = fieldLanguage(this);
    const disabled = this.isDisabled;
    const start = parseIsoDate(this.valueStart);
    const end = parseIsoDate(this.valueEnd);
    const dates = { Start: start, End: end };
    const isoStart = toIsoDate(start);
    const isoEnd = toIsoDate(end);

    for (const edge of /** @type {('Start' | 'End')[]} */ (['Start', 'End'])) {
      const input = this.#inputs[edge];
      const key = `${toIsoDate(dates[edge])}|${language}`;
      if (key !== this.#textKeys[edge]) {
        this.#textKeys[edge] = key;
        this.#bad[edge] = false;
        input.value = formatFieldDate(language, dates[edge]);
      }
      input.disabled = disabled;
      input.readOnly = this.readonly;
      input.required = this.required;
      input.placeholder = this[`placeholder${edge}`] || '';
      setAttr(input, 'aria-label', this[`label${edge}`]);
    }
    setAttr(this.#field, 'aria-label', fieldName(this));
    this.#toggle.disabled = disabled || this.readonly;
    setAttr(this.#toggle, 'aria-label', this.labelToggle);
    setAttr(this.#panel, 'aria-label', this.labelToggle);
    this.toggleState('disabled', disabled);

    const calendar = this.#calendar;
    calendar.valueStart = isoStart;
    calendar.valueEnd = isoEnd;
    calendar.min = this.min;
    calendar.max = this.max;
    calendar.locale = language;
    calendar.disabledDates = this.disabledDates;
    calendar.labelPreviousMonth = this.labelPreviousMonth;
    calendar.labelNextMonth = this.labelNextMonth;
    calendar.labelPreviousYear = this.labelPreviousYear;
    calendar.labelNextYear = this.labelNextYear;

    if (this.name && (isoStart || isoEnd)) {
      const data = new FormData();
      if (isoStart) data.append(`${this.name}-start`, isoStart);
      if (isoEnd) data.append(`${this.name}-end`, isoEnd);
      this.setFormValue(data);
    } else {
      this.setFormValue(null);
    }

    const min = parseIsoDate(this.min);
    const max = parseIsoDate(this.max);
    const { Start: startInput, End: endInput } = this.#inputs;
    if (this.#bad.Start || this.#bad.End) {
      this.setValidity({ badInput: true }, nativeMessage('format'), this.#bad.Start ? startInput : endInput);
    } else if (this.required && (!start || !end)) {
      this.setValidity({ valueMissing: true }, nativeMessage('required'), start ? endInput : startInput);
    } else if (start && end && compareDates(end, start) < 0) {
      this.setValidity({ rangeUnderflow: true }, nativeMessage('min', { value: isoEnd, limit: isoStart }), endInput);
    } else if (min && start && compareDates(start, min) < 0) {
      this.setValidity({ rangeUnderflow: true }, nativeMessage('min', { value: isoStart, limit: this.min }), startInput);
    } else if (min && end && compareDates(end, min) < 0) {
      this.setValidity({ rangeUnderflow: true }, nativeMessage('min', { value: isoEnd, limit: this.min }), endInput);
    } else if (max && end && compareDates(end, max) > 0) {
      this.setValidity({ rangeOverflow: true }, nativeMessage('max', { value: isoEnd, limit: this.max }), endInput);
    } else if (max && start && compareDates(start, max) > 0) {
      this.setValidity({ rangeOverflow: true }, nativeMessage('max', { value: isoStart, limit: this.max }), startInput);
    } else {
      this.setValidity({});
    }
    const invalid = this.#touched && !this.validity.valid;
    setAttr(startInput, 'aria-invalid', invalid ? 'true' : null);
    setAttr(endInput, 'aria-invalid', invalid ? 'true' : null);
    this.toggleState('user-invalid', invalid);

    const want = this.open && !disabled && !this.readonly;
    if (want && !this.#surface.open) {
      this.#surface.show(this.#field, {}, () => this.#close('outside'));
      calendar.showDate(isoStart || toIsoDate(todayDate()));
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

  /**
   * Takes a start and an end and tells the page when they changed.
   * @param {string | null} start
   * @param {string | null} end
   * @param {'input' | 'change'} event
   */
  #take(start, end, event) {
    const before = `${toIsoDate(parseIsoDate(this.valueStart))}/${toIsoDate(parseIsoDate(this.valueEnd))}`;
    this.#touched = true;
    this.#bad = { Start: false, End: false };
    this.#textKeys = { Start: null, End: null };
    this.valueStart = start;
    this.valueEnd = end;
    this.requestUpdate();
    if (before === `${start}/${end}`) return;
    this.emit(event, { value: this.value, valueStart: start, valueEnd: end });
  }

  /** Takes what was typed into one of the inputs. @param {'Start' | 'End'} edge */
  #commitText(edge) {
    if (this.isDisabled || this.readonly) return;
    const language = fieldLanguage(this);
    const text = this.#inputs[edge].value.trim();
    const date = text ? parseFieldDate(text, language) : null;
    const other = edge === 'Start' ? 'End' : 'Start';
    const kept = toIsoDate(parseIsoDate(this[`value${other}`]));
    const otherBad = this.#bad[other];
    const otherKey = this.#textKeys[other];
    const pair = (iso) => (edge === 'Start' ? [iso, kept] : [kept, iso]);
    if (text && !date) {
      // Not a date: the text stays for the user to fix and that side is empty.
      this.#take(...pair(null), 'change');
      this.#bad[edge] = true;
      this.#textKeys[edge] = `null|${language}`;
    } else {
      this.#take(...pair(toIsoDate(date)), 'change');
    }
    // The other input keeps what it shows, a typed non-date included.
    this.#bad[other] = otherBad;
    if (otherBad) this.#textKeys[other] = otherKey;
  }
}

define('punica-date-range-input', PunicaDateRangeInput);
