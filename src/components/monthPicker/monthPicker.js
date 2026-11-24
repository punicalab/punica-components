import { PunicaElement, define } from '../../core/element.js';
import { FormControl, submitForm } from '../../core/form.js';
import { overlayCss } from '../../core/overlay.js';
import { isRtl } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import { FieldSurface, fieldLanguage, fieldName, setAttr, nativeMessage } from '../select/field.js';
import {
  parseIsoMonth,
  toIsoMonth,
  todayDate,
  compareMonths,
  shiftMonth,
  formatDate,
  formatFieldMonth,
  parseFieldMonth
} from '../calendar/dates.js';
import fieldStyles from '../select/field.css';
import styles from './monthPicker.css';

/** @typedef {import('../calendar/dates.js').CalendarMonth} CalendarMonth */

const COLUMNS = 3;

/**
 * A month field: a text input that takes a typed month and year in the
 * language's own order, and a button that opens the twelve months of a year.
 * What `<input type="month">` is, in every browser.
 *
 * The value is an ISO `yyyy-mm` month; no time zone is involved.
 *
 * @element punica-month-picker
 *
 * @attr {string} value - Default value, `yyyy-mm`.
 * @attr {string} min - Earliest month allowed, `yyyy-mm`.
 * @attr {string} max - Latest month allowed, `yyyy-mm`.
 * @attr {string} locale - BCP 47 tag for the display format and the month names; the nearest `lang`, else the browser's, by default.
 * @attr {string} placeholder - Text shown while the field is empty.
 * @attr {string} label - Accessible name.
 * @attr {boolean} open - The months are showing.
 * @attr {string} name - Name the value is submitted under.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} readonly - Shows its value and takes no input.
 * @attr {boolean} required - A month is needed before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} label-toggle - Name of the months button and of the panel, `Choose month` by default.
 * @attr {string} label-previous-year - Name of the previous-year button, `Previous year` by default.
 * @attr {string} label-next-year - Name of the next-year button, `Next year` by default.
 *
 * @prop {string | null} value - The current month, `yyyy-mm`, or null.
 * @prop {((month: string) => boolean) | null} disabledMonths - Answers true for a `yyyy-mm` month the panel must not offer.
 *
 * @slot start - Content before the input, an icon.
 *
 * @fires punica-change - The user typed or picked a month. `detail.value` is the `yyyy-mm` month or null.
 * @fires punica-open - The months opened.
 * @fires punica-close - The months closed. `detail.reason` is `select`, `escape`, `outside`, `blur` or `api`.
 *
 * @csspart field - The bordered box.
 * @csspart input - The text input.
 * @csspart toggle - The months button.
 * @csspart panel - The floating panel.
 * @csspart header - The row holding the year and its buttons.
 * @csspart title - The year on show.
 * @csspart nav - Each year button.
 * @csspart grid - The table of months.
 * @csspart month - A month cell. Also carries `current`, `selected` and `disabled` where they apply.
 *
 * @cssprop --punica-month-picker-radius - Corner radius of the field.
 * @cssprop --punica-month-picker-height - Minimum block size of the field.
 * @cssprop --punica-month-picker-padding - Inline padding of the field.
 * @cssprop --punica-month-picker-border-color - Border colour at rest.
 * @cssprop --punica-month-picker-background - Field background.
 * @cssprop --punica-month-picker-min-width - Smallest inline size.
 * @cssprop --punica-month-picker-panel-padding - Padding around the months.
 * @cssprop --punica-month-picker-month-width - Inline size of a month cell.
 * @cssprop --punica-month-picker-accent - Colour of the selected month and of the current month's ring.
 *
 * @cssstate open - The months are showing.
 * @cssstate disabled - Disabled by itself or by a fieldset.
 * @cssstate user-invalid - Invalid after the user touched it.
 */
export class PunicaMonthPicker extends FormControl(PunicaElement) {
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
    labelToggle: { default: 'Choose month' },
    labelPreviousYear: { default: 'Previous year' },
    labelNextYear: { default: 'Next year' },
    disabledMonths: { type: Object, attribute: false }
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
      <div part="header" class="header">
        <button part="nav" class="nav" type="button" data-years="-1">${icons.chevronStart}</button>
        <div part="title" class="title" id="title" aria-live="polite"></div>
        <button part="nav" class="nav" type="button" data-years="1">${icons.chevronEnd}</button>
      </div>
      <table part="grid" role="grid" aria-labelledby="title"><tbody></tbody></table>
    </div>
  `;

  #field = this.$('.field');
  #input = this.$('input');
  #toggle = this.$('[part="toggle"]');
  #panel = this.$('#panel');
  #title = this.$('#title');
  #body = this.$('tbody');
  /** @type {HTMLButtonElement[]} */
  #navs = [...this.shadowRoot.querySelectorAll('.nav')];
  /** @type {HTMLTableCellElement[]} */
  #cells = [];
  #surface = new FieldSurface(this, this.#panel);
  /** The month the keyboard is on; its year is the one on show. @type {CalendarMonth | null} */
  #cursor = null;
  /** What the input's text was last written from. @type {string | null} */
  #textKey = null;
  /** The typed text is not a month. */
  #bad = false;
  #touched = false;
  #tabbing = false;
  #reason = 'api';

  constructor() {
    super();
    for (let row = 0; row < 12 / COLUMNS; row++) {
      const tr = document.createElement('tr');
      for (let col = 0; col < COLUMNS; col++) {
        const cell = document.createElement('td');
        cell.setAttribute('role', 'gridcell');
        cell.tabIndex = -1;
        const shown = document.createElement('span');
        shown.setAttribute('aria-hidden', 'true');
        const spoken = document.createElement('span');
        spoken.className = 'spoken';
        cell.append(shown, spoken);
        this.#cells.push(cell);
        tr.appendChild(cell);
      }
      this.#body.appendChild(tr);
    }
    const input = this.#input;
    input.addEventListener('change', () => this.#commitText());
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.#commitText();
        // The form must read the typed month, not the one before it.
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
    this.#toggle.addEventListener('click', () => {
      if (this.open) this.#close('api');
      else this.show();
    });
    for (const nav of this.#navs) {
      nav.addEventListener('click', () => this.#moveTo(shiftMonth(this.#cursor, 12 * Number(nav.dataset.years)), false));
    }
    this.#body.addEventListener('click', (event) => {
      const month = this.#monthFrom(event);
      if (month) this.#pick(month);
    });
    this.#body.addEventListener('keydown', (event) => this.#onGridKeydown(event));
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
      // Tabbing out of the panel closes it; another surface taking focus does not.
      if (this.open && this.#tabbing) this.#close('blur');
      this.#tabbing = false;
      this.requestUpdate();
    });
  }

  /** Opens the months. */
  show() {
    this.open = true;
  }

  /** Closes the months. */
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
    const month = parseIsoMonth(this.value);
    const iso = toIsoMonth(month);
    const disabled = this.isDisabled;
    const name = fieldName(this);

    const key = `${iso}|${language}`;
    if (key !== this.#textKey) {
      this.#textKey = key;
      this.#bad = false;
      input.value = formatFieldMonth(language, month);
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

    this.setFormValue(iso);
    const min = parseIsoMonth(this.min);
    const max = parseIsoMonth(this.max);
    if (this.#bad) {
      this.setValidity({ badInput: true }, nativeMessage('format'), input);
    } else if (!month) {
      this.setValidity(this.required ? { valueMissing: true } : {}, nativeMessage('required'), input);
    } else if (min && compareMonths(month, min) < 0) {
      this.setValidity({ rangeUnderflow: true }, nativeMessage('min', { type: 'month', value: iso, limit: this.min }), input);
    } else if (max && compareMonths(month, max) > 0) {
      this.setValidity({ rangeOverflow: true }, nativeMessage('max', { type: 'month', value: iso, limit: this.max }), input);
    } else {
      this.setValidity({});
    }
    const invalid = this.#touched && !this.validity.valid;
    setAttr(input, 'aria-invalid', invalid ? 'true' : null);
    this.toggleState('user-invalid', invalid);

    const want = this.open && !disabled && !this.readonly;
    if (want && !this.#surface.open) {
      const today = todayDate();
      this.#cursor = this.#clamp(month || { y: today.y, m: today.m });
      this.#surface.show(this.#field, {}, () => this.#close('outside'));
      this.#drawMonths(language);
      this.toggleState('open', true);
      this.#toggle.setAttribute('aria-expanded', 'true');
      this.#focusCursor();
      this.emit('open');
    } else if (!want && this.#surface.open) {
      this.#surface.hide();
      this.toggleState('open', false);
      this.#toggle.setAttribute('aria-expanded', 'false');
      const reason = this.#reason;
      this.#reason = 'api';
      this.emit('close', { reason });
    } else if (want) {
      this.#drawMonths(language);
    }
  }

  /** @param {string} language */
  #drawMonths(language) {
    const cursor = this.#cursor;
    const value = parseIsoMonth(this.value);
    const today = todayDate();
    const min = parseIsoMonth(this.min);
    const max = parseIsoMonth(this.max);
    this.#title.textContent = formatDate(language, { y: cursor.y, m: 1, d: 1 }, { year: 'numeric' });
    const labels = [this.labelPreviousYear, this.labelNextYear];
    this.#navs.forEach((nav, i) => {
      setAttr(nav, 'aria-label', labels[i]);
      const edge = i === 0 ? min && cursor.y <= min.y : max && cursor.y >= max.y;
      nav.disabled = !!edge;
    });
    this.#cells.forEach((cell, i) => {
      const month = { y: cursor.y, m: i + 1 };
      const iso = toIsoMonth(month);
      const same = (other) => !!other && compareMonths(month, other) === 0;
      const selected = same(value);
      const current = same({ y: today.y, m: today.m });
      const unavailable = this.#unavailable(month);
      const parts = ['month'];
      if (current) parts.push('current');
      if (selected) parts.push('selected');
      if (unavailable) parts.push('disabled');
      cell.dataset.month = iso;
      // The short name on show, the month and year in full for assistive technology.
      const [shown, spoken] = cell.children;
      shown.textContent = formatDate(language, { ...month, d: 1 }, { month: 'short' });
      spoken.textContent = formatDate(language, { ...month, d: 1 }, { month: 'long', year: 'numeric' });
      cell.setAttribute('part', parts.join(' '));
      cell.className = parts.join(' ');
      setAttr(cell, 'aria-selected', selected ? 'true' : null);
      setAttr(cell, 'aria-disabled', unavailable ? 'true' : null);
      setAttr(cell, 'aria-current', current ? 'date' : null);
      cell.tabIndex = same(cursor) ? 0 : -1;
    });
  }

  #focusCursor() {
    (this.#cells.find((cell) => cell.tabIndex === 0) || this.#cells[0]).focus({ preventScroll: true });
  }

  /** @param {CalendarMonth} month */
  #clamp(month) {
    const min = parseIsoMonth(this.min);
    const max = parseIsoMonth(this.max);
    if (min && compareMonths(month, min) < 0) return min;
    if (max && compareMonths(month, max) > 0) return max;
    return month;
  }

  /** @param {CalendarMonth} month */
  #unavailable(month) {
    const min = parseIsoMonth(this.min);
    const max = parseIsoMonth(this.max);
    if (min && compareMonths(month, min) < 0) return true;
    if (max && compareMonths(month, max) > 0) return true;
    return typeof this.disabledMonths === 'function' && !!this.disabledMonths(toIsoMonth(month));
  }

  /** @param {Event} event */
  #monthFrom(event) {
    const cell = event.composedPath().find((node) => node instanceof HTMLTableCellElement && node.dataset.month);
    return cell ? parseIsoMonth(cell.dataset.month) : null;
  }

  /**
   * @param {CalendarMonth} month
   * @param {boolean} focus put focus on it (keyboard), or leave it where it is (year buttons)
   */
  #moveTo(month, focus = true) {
    this.#cursor = this.#clamp(month);
    this.#drawMonths(fieldLanguage(this));
    if (focus) this.#focusCursor();
  }

  /** @param {CalendarMonth} month */
  #pick(month) {
    if (this.#unavailable(month)) return;
    this.#cursor = month;
    this.#commit(toIsoMonth(month));
    this.#close('select');
    this.#input.focus();
  }

  /** @param {KeyboardEvent} event */
  #onGridKeydown(event) {
    const cursor = this.#monthFrom(event) || this.#cursor;
    if (!cursor) return;
    const forward = isRtl(this) ? -1 : 1;
    const inRow = (cursor.m - 1) % COLUMNS;
    let next = null;
    switch (event.key) {
      case 'ArrowRight':
        next = shiftMonth(cursor, forward);
        break;
      case 'ArrowLeft':
        next = shiftMonth(cursor, -forward);
        break;
      case 'ArrowDown':
        next = shiftMonth(cursor, COLUMNS);
        break;
      case 'ArrowUp':
        next = shiftMonth(cursor, -COLUMNS);
        break;
      case 'Home':
        next = shiftMonth(cursor, -inRow);
        break;
      case 'End':
        next = shiftMonth(cursor, COLUMNS - 1 - inRow);
        break;
      case 'PageDown':
        next = shiftMonth(cursor, 12);
        break;
      case 'PageUp':
        next = shiftMonth(cursor, -12);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.#pick(cursor);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.#moveTo(next);
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
    // Write the text again even when the month is the one already held.
    this.#textKey = null;
    this.requestUpdate();
    if (iso === toIsoMonth(parseIsoMonth(this.value))) return;
    this.value = iso;
    this.emit('change', { value: iso });
  }

  /** Takes what was typed. */
  #commitText() {
    if (this.isDisabled || this.readonly) return;
    const text = this.#input.value.trim();
    const month = text ? parseFieldMonth(text, fieldLanguage(this)) : null;
    if (text && !month) {
      // Not a month: the text stays for the user to fix and the value is empty.
      const had = parseIsoMonth(this.value);
      this.#touched = true;
      this.#bad = true;
      this.value = null;
      this.#textKey = `null|${fieldLanguage(this)}`;
      this.requestUpdate();
      if (had) this.emit('change', { value: null });
      return;
    }
    this.#commit(toIsoMonth(month));
  }
}

define('punica-month-picker', PunicaMonthPicker);
