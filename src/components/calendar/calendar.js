import { PunicaElement, define } from '../../core/element.js';
import { isRtl } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import { fieldLanguage, setAttr } from '../select/field.js';
import {
  parseIsoDate,
  toIsoDate,
  todayDate,
  weekdayOf,
  addDays,
  addMonths,
  compareDates,
  clampDate,
  daysInMonth,
  formatDate,
  firstDayOfWeekFor
} from './dates.js';
import styles from './calendar.css';

const DOUBLE = (d) =>
  `<svg part="icon" class="icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

/**
 * A month grid for picking a date, or a range of dates with `range`.
 *
 * Dates are ISO `yyyy-mm-dd` strings and are handled as calendar dates, so
 * no time zone can move a day. Month and weekday names come from `Intl`.
 *
 * @element punica-calendar
 *
 * @attr {string} value - The selected date, `yyyy-mm-dd`.
 * @attr {string} min - Earliest date that can be picked.
 * @attr {string} max - Latest date that can be picked.
 * @attr {string} locale - BCP 47 tag for names and week start; the nearest `lang`, else the browser's, by default.
 * @attr {number} first-day-of-week - 0 Sunday to 6 Saturday; from the locale by default.
 * @attr {boolean} range - Picks a start and an end instead of one date.
 * @attr {string} value-start - Start of the range, with `range`.
 * @attr {string} value-end - End of the range, with `range`.
 * @attr {boolean} disabled - Nothing can be picked.
 * @attr {string} label - Accessible name of the grid; the month title by default.
 * @attr {string} label-previous-month - Name of the previous-month button, `Previous month` by default.
 * @attr {string} label-next-month - Name of the next-month button, `Next month` by default.
 * @attr {string} label-previous-year - Name of the previous-year button, `Previous year` by default.
 * @attr {string} label-next-year - Name of the next-year button, `Next year` by default.
 *
 * @prop {((date: string) => boolean) | null} disabledDates - Answers true for an ISO date that cannot be picked.
 * @prop {string} month - The month on show, `yyyy-mm`. Read-only; move it with `showDate()`.
 *
 * @fires punica-change - The user picked a date, or completed a range. `detail` is `{ value }`; with `range`, `{ value: 'start/end', valueStart, valueEnd }`.
 * @fires punica-input - With `range`, the user picked the start and the end is still open. `detail` is `{ value, valueStart, valueEnd: null }`.
 * @fires punica-select - The user activated a day, changed or not. `detail` is `{ value, item }`.
 *
 * @csspart header - The row holding the title and the navigation buttons.
 * @csspart title - The month and year.
 * @csspart nav - Each navigation button.
 * @csspart grid - The table.
 * @csspart weekday - A weekday heading.
 * @csspart day - A day cell. Also carries `today`, `selected`, `outside`, `in-range`, `range-start`, `range-end` and `disabled` where they apply.
 *
 * @cssprop --punica-calendar-day-size - Inline and block size of a day.
 * @cssprop --punica-calendar-gap - Space between days.
 * @cssprop --punica-calendar-accent - Colour of the selected day and of today's ring.
 * @cssprop --punica-calendar-range-background - Background of the days inside a range.
 */
export class PunicaCalendar extends PunicaElement {
  static properties = {
    value: { reflect: false },
    min: {},
    max: {},
    locale: {},
    firstDayOfWeek: { type: Number },
    range: { type: Boolean },
    valueStart: { reflect: false },
    valueEnd: { reflect: false },
    disabled: { type: Boolean },
    label: {},
    labelPreviousMonth: { default: 'Previous month' },
    labelNextMonth: { default: 'Next month' },
    labelPreviousYear: { default: 'Previous year' },
    labelNextYear: { default: 'Next year' },
    disabledDates: { type: Object, attribute: false }
  };

  static styles = styles;
  static template = `
    <div part="header" class="header">
      <button part="nav" class="nav" type="button" data-months="-12">${DOUBLE('m11 6-6 6 6 6M18 6l-6 6 6 6')}</button>
      <button part="nav" class="nav" type="button" data-months="-1">${icons.chevronStart}</button>
      <div part="title" class="title" id="title" aria-live="polite"></div>
      <button part="nav" class="nav" type="button" data-months="1">${icons.chevronEnd}</button>
      <button part="nav" class="nav" type="button" data-months="12">${DOUBLE('m13 6 6 6-6 6M6 6l6 6-6 6')}</button>
    </div>
    <table part="grid" role="grid" aria-labelledby="title">
      <thead><tr></tr></thead>
      <tbody></tbody>
    </table>
  `;

  #title = this.$('#title');
  #grid = this.$('table');
  #head = this.$('thead tr');
  #body = this.$('tbody');
  /** @type {HTMLButtonElement[]} */
  #navs = [...this.shadowRoot.querySelectorAll('.nav')];
  /** @type {HTMLTableCellElement[]} */
  #cells = [];
  /** @type {HTMLTableCellElement[]} */
  #heads = [];
  /** The day the keyboard is on; its month is the one on show. @type {import('./dates.js').CalendarDate | null} */
  #cursor = null;
  /** @type {import('./dates.js').CalendarDate | null} */
  #hover = null;

  constructor() {
    super();
    for (let i = 0; i < 7; i++) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.setAttribute('part', 'weekday');
      this.#heads.push(th);
      this.#head.appendChild(th);
    }
    for (let week = 0; week < 6; week++) {
      const row = document.createElement('tr');
      for (let day = 0; day < 7; day++) {
        const cell = document.createElement('td');
        cell.setAttribute('role', 'gridcell');
        cell.tabIndex = -1;
        this.#cells.push(cell);
        row.appendChild(cell);
      }
      this.#body.appendChild(row);
    }
    for (const nav of this.#navs) {
      nav.addEventListener('click', () => this.#shift(Number(nav.dataset.months)));
    }
    this.#body.addEventListener('click', (event) => {
      const date = this.#dateFrom(event);
      if (date) this.#select(date);
    });
    this.#body.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.#body.addEventListener('pointerover', (event) => this.#preview(this.#dateFrom(event)));
    this.#body.addEventListener('pointerleave', () => this.#preview(null));
    this.#body.addEventListener('focusin', (event) => {
      const date = this.#dateFrom(event);
      if (date && this.range) this.#preview(date);
    });
  }

  /** The month on show, `yyyy-mm`. */
  get month() {
    const cursor = this.#cursor || this.#initialCursor();
    return toIsoDate({ ...cursor, d: 1 }).slice(0, 7);
  }

  /**
   * Shows the month holding a date and puts the keyboard on that date.
   * @param {string} date `yyyy-mm-dd`
   */
  showDate(date) {
    const parsed = parseIsoDate(date);
    if (!parsed) return;
    this.#cursor = clampDate(parsed, parseIsoDate(this.min), parseIsoDate(this.max));
    if (this.isConnected) this.update(new Map());
  }

  /** Moves focus to the day the keyboard is on. */
  focus(options) {
    (this.#cells.find((cell) => cell.tabIndex === 0) || this.#cells[0]).focus(options);
  }

  #language() {
    return fieldLanguage(this);
  }

  #initialCursor() {
    const picked = parseIsoDate(this.range ? this.valueStart : this.value);
    return clampDate(picked || todayDate(), parseIsoDate(this.min), parseIsoDate(this.max));
  }

  #dateFrom(event) {
    const cell = event.composedPath().find((node) => node instanceof HTMLTableCellElement && node.dataset.date);
    return cell ? parseIsoDate(cell.dataset.date) : null;
  }

  /** @param {import('./dates.js').CalendarDate} date */
  #unavailable(date) {
    const min = parseIsoDate(this.min);
    const max = parseIsoDate(this.max);
    if (this.disabled) return true;
    if (min && compareDates(date, min) < 0) return true;
    if (max && compareDates(date, max) > 0) return true;
    return typeof this.disabledDates === 'function' && !!this.disabledDates(toIsoDate(date));
  }

  update(changed) {
    const picked = this.range ? 'valueStart' : 'value';
    if (!this.#cursor || (changed.has(picked) && changed.get(picked) !== undefined && parseIsoDate(this[picked]))) {
      this.#cursor = this.#initialCursor();
    }
    const language = this.#language();
    const cursor = this.#cursor;
    const first = { y: cursor.y, m: cursor.m, d: 1 };
    const weekStart = Number.isInteger(this.firstDayOfWeek) ? ((this.firstDayOfWeek % 7) + 7) % 7 : firstDayOfWeekFor(language);

    this.#title.textContent = formatDate(language, first, { month: 'long', year: 'numeric' });
    setAttr(this.#grid, 'aria-label', this.label);
    setAttr(this.#grid, 'aria-labelledby', this.label ? null : 'title');
    setAttr(this.#grid, 'aria-disabled', this.disabled ? 'true' : null);
    setAttr(this.#grid, 'aria-multiselectable', this.range ? 'true' : null);
    const labels = [this.labelPreviousYear, this.labelPreviousMonth, this.labelNextMonth, this.labelNextYear];
    this.#navs.forEach((nav, i) => {
      setAttr(nav, 'aria-label', labels[i]);
      nav.disabled = this.disabled;
    });

    this.#heads.forEach((th, i) => {
      // 2023-01-01 was a Sunday.
      const day = { y: 2023, m: 1, d: 1 + ((weekStart + i) % 7) };
      th.textContent = formatDate(language, day, { weekday: 'short' });
      th.abbr = formatDate(language, day, { weekday: 'long' });
    });

    const focused = this.shadowRoot.activeElement instanceof HTMLTableCellElement;
    const today = todayDate();
    const value = this.range ? null : parseIsoDate(this.value);
    const start = this.range ? parseIsoDate(this.valueStart) : null;
    const end = this.range ? parseIsoDate(this.valueEnd) : null;
    // While the end is open, the day under the pointer or the keyboard previews it.
    let from = start;
    let to = end;
    if (start && !end && this.#hover) {
      [from, to] = compareDates(this.#hover, start) < 0 ? [this.#hover, start] : [start, this.#hover];
    }
    const offset = (weekdayOf(first) - weekStart + 7) % 7;
    // The day numbers in the language's own digits, as the title and the
    // cell's name already are (Arabic-Indic in Egyptian Arabic, for one).
    const dayNumber = new Intl.NumberFormat(language, { useGrouping: false });
    this.#cells.forEach((cell, i) => {
      const date = addDays(first, i - offset);
      const iso = toIsoDate(date);
      const same = (other) => !!other && compareDates(date, other) === 0;
      const isStart = same(start);
      const isEnd = same(end);
      const selected = same(value) || isStart || isEnd;
      const inRange = !!from && !!to && compareDates(date, from) >= 0 && compareDates(date, to) <= 0;
      const unavailable = this.#unavailable(date);
      const parts = ['day'];
      if (same(today)) parts.push('today');
      if (selected) parts.push('selected');
      if (date.m !== first.m) parts.push('outside');
      if (inRange) parts.push('in-range');
      if (isStart) parts.push('range-start');
      if (isEnd) parts.push('range-end');
      if (unavailable) parts.push('disabled');
      cell.dataset.date = iso;
      cell.textContent = dayNumber.format(date.d);
      cell.setAttribute('part', parts.join(' '));
      cell.className = parts.join(' ');
      cell.setAttribute('aria-label', formatDate(language, date, { dateStyle: 'full' }));
      setAttr(cell, 'aria-selected', selected || (!!end && inRange) ? 'true' : null);
      setAttr(cell, 'aria-disabled', unavailable ? 'true' : null);
      setAttr(cell, 'aria-current', same(today) ? 'date' : null);
      cell.tabIndex = same(cursor) ? 0 : -1;
      if (focused && same(cursor) && this.shadowRoot.activeElement !== cell) cell.focus();
    });
    // Rows that hold only next month's days are left out of the grid.
    [...this.#body.rows].forEach((row, week) => {
      row.hidden = week * 7 - offset >= daysInMonth(first.y, first.m);
    });
  }

  /** @param {import('./dates.js').CalendarDate | null} date */
  #preview(date) {
    if (!this.range || !this.valueStart || this.valueEnd) {
      if (!this.#hover) return;
      date = null;
    }
    if (date && this.#hover && compareDates(date, this.#hover) === 0) return;
    this.#hover = date;
    this.update(new Map());
  }

  /** @param {number} months */
  #shift(months) {
    if (this.disabled) return;
    const min = parseIsoDate(this.min);
    const max = parseIsoDate(this.max);
    this.#cursor = clampDate(addMonths(this.#cursor, months), min, max);
    this.update(new Map());
  }

  /** @param {import('./dates.js').CalendarDate} date */
  #moveTo(date) {
    this.#cursor = clampDate(date, parseIsoDate(this.min), parseIsoDate(this.max));
    this.update(new Map());
    this.focus();
  }

  /** @param {import('./dates.js').CalendarDate} date */
  #select(date) {
    if (this.#unavailable(date)) return;
    const iso = toIsoDate(date);
    this.#cursor = date;
    const item = this.#cells.find((cell) => cell.dataset.date === iso);
    if (!this.range) {
      const changed = iso !== this.value;
      this.value = iso;
      this.update(new Map());
      if (changed) this.emit('change', { value: iso });
    } else if (!this.valueStart || this.valueEnd) {
      this.valueStart = iso;
      this.valueEnd = null;
      this.#hover = null;
      this.update(new Map());
      this.emit('input', { value: iso, valueStart: iso, valueEnd: null });
    } else {
      const [a, b] = [this.valueStart, iso].sort();
      this.valueStart = a;
      this.valueEnd = b;
      this.#hover = null;
      this.update(new Map());
      this.emit('change', { value: `${a}/${b}`, valueStart: a, valueEnd: b });
    }
    this.emit('select', { value: iso, item });
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    const cursor = this.#dateFrom(event) || this.#cursor;
    if (!cursor || this.disabled) return;
    const forward = isRtl(this) ? -1 : 1;
    const weekStart = Number.isInteger(this.firstDayOfWeek) ? ((this.firstDayOfWeek % 7) + 7) % 7 : firstDayOfWeekFor(this.#language());
    const intoWeek = (weekdayOf(cursor) - weekStart + 7) % 7;
    let next = null;
    switch (event.key) {
      case 'ArrowRight':
        next = addDays(cursor, forward);
        break;
      case 'ArrowLeft':
        next = addDays(cursor, -forward);
        break;
      case 'ArrowDown':
        next = addDays(cursor, 7);
        break;
      case 'ArrowUp':
        next = addDays(cursor, -7);
        break;
      case 'Home':
        next = addDays(cursor, -intoWeek);
        break;
      case 'End':
        next = addDays(cursor, 6 - intoWeek);
        break;
      case 'PageDown':
        next = addMonths(cursor, event.shiftKey ? 12 : 1);
        break;
      case 'PageUp':
        next = addMonths(cursor, event.shiftKey ? -12 : -1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.#select(cursor);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.#moveTo(next);
  }
}

define('punica-calendar', PunicaCalendar);
