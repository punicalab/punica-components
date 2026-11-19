import { PunicaElement, define } from '../../core/element.js';
import { isRtl } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import styles from './agenda.css';

/**
 * @typedef {object} AgendaEvent
 * @property {string | number} [id] Identifies the event; `punica-select` reports it as `value` (the event's index when absent).
 * @property {string} title Shown on the event and read as the start of its name.
 * @property {Date | string | number} start When it starts. A `YYYY-MM-DD` string is that calendar day at 00:00 local time.
 * @property {Date | string | number} [end] When it ends; the start when absent.
 * @property {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} [color]
 *   Palette the event is drawn in; without it events take palettes in turn.
 */

const VIEWS = ['day', 'week', 'month', 'year'];
const PALETTE = ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'neutral'];
/** Palettes given in turn to events that name none. */
const CYCLE = ['info', 'secondary', 'success', 'warning', 'primary', 'neutral'];
const MS_DAY = 864e5;
/** Longest run of days one event is spread over. */
const MAX_SPAN = 366;

/*
 * A calendar date is a whole number: days since 1970-01-01 in the proleptic
 * Gregorian calendar. Arithmetic on it is integer arithmetic, so no time zone
 * and no daylight-saving change can move a date; a Date object is only ever
 * built at UTC midnight to read fields back or to hand to Intl with
 * `timeZone: 'UTC'`.
 */
const toDay = (y, m, d) => Math.round(Date.UTC(y, m, d) / MS_DAY);
const fields = (n) => {
  const t = new Date(n * MS_DAY);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), w: t.getUTCDay() };
};
const utc = (n) => new Date(n * MS_DAY);
const iso = (n) => utc(n).toISOString().slice(0, 10);
/** The calendar date an instant falls on in the local time zone. */
const localDay = (date) => toDay(date.getFullYear(), date.getMonth(), date.getDate());

/** @param {unknown} value @returns {number | null} */
function parseDay(value) {
  if (value == null || value === '') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (match) {
    const n = toDay(+match[1], +match[2] - 1, +match[3]);
    return iso(n) === match[0] ? n : null;
  }
  const date = new Date(/** @type {any} */ (value));
  return Number.isNaN(date.getTime()) ? null : localDay(date);
}

/** @param {unknown} value @returns {Date | null} */
function toDate(value) {
  if (value == null) return null;
  let date;
  const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) date = new Date(+match[1], +match[2] - 1, +match[3]);
  else date = new Date(value instanceof Date ? value.getTime() : /** @type {any} */ (value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(n, count) {
  const { y, m, d } = fields(n);
  const last = fields(toDay(y, m + count + 1, 0)).d;
  return toDay(y, m + count, Math.min(d, last));
}

/**
 * @param {string} tag
 * @param {Record<string, string | number | boolean | null | undefined>} [attrs]
 *   `class`, `text`, or any attribute; null and false are skipped
 * @param {(Node | null | undefined)[]} [children]
 */
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (name === 'class') el.className = String(value);
    else if (name === 'text') el.textContent = String(value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) if (child) el.appendChild(child);
  return el;
}

const fill = (template, count) => String(template ?? '').replace('{count}', String(count));

/**
 * A calendar of events with day, week, month and year views.
 *
 * `events` is an array of `{ id, title, start, end, color }`. The toolbar
 * moves between periods and views; the view itself is a grid: arrow keys move
 * between days, Home and End go to the ends of the week, Page Up and Page
 * Down to the previous and next period, Enter steps into the events of a day
 * (in the year view it opens that day) and Escape steps back out. Month,
 * weekday and time text comes from `Intl` in `locale`.
 *
 * @element punica-agenda
 *
 * @attr {'day' | 'week' | 'month' | 'year'} view - The period shown, `day` by default.
 * @attr {string} date - A date inside the period shown, as `YYYY-MM-DD`; today by default.
 * @attr {string} locale - BCP 47 tag for all date and time text; the nearest `lang`, then the browser's language, by default.
 * @attr {number} first-day-of-week - Day a week starts on, 0 (Sunday) to 6 (Saturday); the locale's own by default.
 * @attr {number} start-hour - First hour of the day and week views, 0 to 23, 0 by default.
 * @attr {number} end-hour - Hour the day and week views end at, 1 to 24, 24 by default.
 * @attr {boolean} no-toolbar - Hides the navigation and view buttons.
 * @attr {string} label - Accessible name of the agenda.
 * @attr {string} label-previous - Name of the previous-period button, "Previous" by default.
 * @attr {string} label-next - Name of the next-period button, "Next" by default.
 * @attr {string} label-today - Text of the today button; the locale's word for today by default.
 * @attr {string} label-day - Text of the day view button; the locale's word by default.
 * @attr {string} label-week - Text of the week view button; the locale's word by default.
 * @attr {string} label-month - Text of the month view button; the locale's word by default.
 * @attr {string} label-year - Text of the year view button; the locale's word by default.
 * @attr {string} label-more - Text of the button for a month day's hidden events, "+{count} more" by default.
 * @attr {string} label-events - How a day's event count is read out, "{count} events" by default.
 *
 * @prop {AgendaEvent[]} events - The events.
 *
 * @fires punica-select - An event was activated. `detail` is `{ value, item }`: its `id` (or index) and the event object as given.
 * @fires punica-change - The user moved to another period or view. `detail` is `{ view, date }`, the date as `YYYY-MM-DD`.
 *
 * @csspart base - The whole agenda.
 * @csspart toolbar - The row of navigation and view buttons.
 * @csspart nav-button - The previous and next buttons.
 * @csspart today-button - The today button.
 * @csspart title - The name of the period shown.
 * @csspart view-button - One of the four view buttons.
 * @csspart content - The scrolling area holding the view.
 * @csspart grid - The grid of a view (one per month in the year view).
 * @csspart day - A day cell or day column.
 * @csspart day-header - A weekday header.
 * @csspart event - An event.
 * @csspart more-button - The button for a month day's hidden events.
 * @csspart icon - A chevron glyph.
 *
 * @cssprop --punica-agenda-background - Background of the agenda.
 * @cssprop --punica-agenda-muted-background - Background of headers, day columns and blank cells.
 * @cssprop --punica-agenda-border-color - Colour of grid lines and cell borders.
 * @cssprop --punica-agenda-radius - Corner radius of cells and headers.
 * @cssprop --punica-agenda-today-color - Accent that marks today.
 * @cssprop --punica-agenda-gutter-width - Inline size of the hour gutter.
 * @cssprop --punica-agenda-day-hour-height - Block size of one hour in the day view.
 * @cssprop --punica-agenda-week-hour-height - Block size of one hour in the week view.
 * @cssprop --punica-agenda-month-cell-height - Least block size of a month day.
 *
 * @cssstate today - The period shown contains today.
 */
export class PunicaAgenda extends PunicaElement {
  static properties = {
    view: { default: 'day' },
    date: {},
    locale: {},
    firstDayOfWeek: { type: Number },
    startHour: { type: Number, default: 0 },
    endHour: { type: Number, default: 24 },
    noToolbar: { type: Boolean },
    label: {},
    labelPrevious: { default: 'Previous' },
    labelNext: { default: 'Next' },
    labelToday: {},
    labelDay: {},
    labelWeek: {},
    labelMonth: {},
    labelYear: {},
    labelMore: { default: '+{count} more' },
    labelEvents: { default: '{count} events' },
    events: { type: Array, attribute: false }
  };

  static styles = styles;
  static template = `
    <div part="base" class="agenda">
      <div part="toolbar" class="toolbar">
        <div class="nav">
          <button part="nav-button" class="nav-button" type="button" data-step="-1">${icons.chevronStart}</button>
          <button part="today-button" class="text-button" type="button" data-today></button>
          <button part="nav-button" class="nav-button" type="button" data-step="1">${icons.chevronEnd}</button>
        </div>
        <div part="title" class="title" aria-live="polite"></div>
        <div class="views" role="group">
          <button part="view-button" class="text-button" type="button" data-view="day"></button>
          <button part="view-button" class="text-button" type="button" data-view="week"></button>
          <button part="view-button" class="text-button" type="button" data-view="month"></button>
          <button part="view-button" class="text-button" type="button" data-view="year"></button>
        </div>
      </div>
      <div part="content" class="content"></div>
    </div>
  `;

  #base = this.$('.agenda');
  #toolbar = this.$('.toolbar');
  #title = this.$('.title');
  #content = this.$('.content');
  /** Normalised events. @type {any[]} */
  #items = [];
  /** day → events on it. @type {Map<number, any[]>} */
  #byDay = new Map();
  /** day → its cell in the view. @type {Map<number, HTMLElement>} */
  #cells = new Map();
  /** cell → signature of the events drawn in it. @type {WeakMap<Element, string>} */
  #drawn = new WeakMap();
  /** The day that holds the grid's tab stop. */
  #cursor = 0;
  #structure = '';
  /** @type {Record<string, any> | null} */
  #formats = null;
  /** A timed view was built and has not yet been scrolled to its first event. */
  #scrollPending = false;

  constructor() {
    super();
    this.#toolbar.addEventListener('click', (event) => this.#onToolbarClick(event));
    this.#content.addEventListener('click', (event) => this.#onContentClick(event));
    this.#content.addEventListener('keydown', (event) => this.#onKeydown(event));
    // Once the person scrolls, events arriving later do not move the view.
    for (const type of ['wheel', 'pointerdown', 'keydown']) {
      this.#content.addEventListener(type, () => (this.#scrollPending = false), { passive: true });
    }
  }

  update(changed) {
    if (changed.has('events')) this.#index();
    if (changed.has('date') || changed.has('view')) this.#cursor = this.#anchor;
    if (changed.has('locale')) this.#formats = null;
    this.#toolbar.hidden = this.noToolbar;
    if (this.label) {
      this.#base.setAttribute('role', 'group');
      this.#base.setAttribute('aria-label', this.label);
    } else {
      this.#base.removeAttribute('role');
      this.#base.removeAttribute('aria-label');
    }
    this.#render();
  }

  /* ------------------------------------------------------------ public API */

  /**
   * Adds one event to `events`.
   * @param {AgendaEvent} event
   */
  addEvent(event) {
    this.events = [...(Array.isArray(this.events) ? this.events : []), event];
  }

  /**
   * Moves to the previous or next period of the current view.
   * @param {-1 | 1} direction
   */
  navigate(direction) {
    if (direction !== -1 && direction !== 1) return;
    this.date = iso(this.#step(this.#anchor, direction));
  }

  /** Moves to the period that contains today. */
  today() {
    this.date = iso(localDay(new Date()));
  }

  /**
   * The first and last date of the period shown, as `YYYY-MM-DD`.
   * @returns {{ start: string, end: string }}
   */
  get range() {
    const [start, end] = this.#period(this.#view, this.#anchor);
    return { start: iso(start), end: iso(end) };
  }

  /** Moves focus to the active day of the grid. */
  focus(options) {
    const cell = this.#cells.get(this.#cursor);
    if (cell) cell.focus({ preventScroll: this.#view === 'day' || this.#view === 'week', ...options });
    else super.focus(options);
  }

  /* -------------------------------------------------------------- settings */

  get #view() {
    return VIEWS.includes(this.view) ? this.view : 'day';
  }

  /** The date the period is built around. */
  get #anchor() {
    return parseDay(this.date) ?? localDay(new Date());
  }

  get #locale() {
    const wanted = this.locale || this.closest('[lang]')?.lang || (typeof navigator !== 'undefined' && navigator.language) || 'en';
    try {
      return Intl.DateTimeFormat.supportedLocalesOf([wanted])[0] || 'en';
    } catch {
      return 'en';
    }
  }

  /** 0 (Sunday) to 6 (Saturday). */
  get #weekStart() {
    const own = this.firstDayOfWeek;
    if (own != null && Number.isInteger(own) && own >= 0 && own <= 7) return own % 7;
    try {
      const locale = /** @type {any} */ (new Intl.Locale(this.#locale));
      const info = typeof locale.getWeekInfo === 'function' ? locale.getWeekInfo() : locale.weekInfo;
      if (info?.firstDay) return info.firstDay % 7;
    } catch {
      /* fall through */
    }
    return 1;
  }

  /** Whole hours the day and week views span. */
  get #hours() {
    const hour = (value, fallback) => (value == null || !Number.isFinite(value) ? fallback : Math.max(0, Math.min(24, value)));
    const start = Math.floor(hour(this.startHour, 0));
    const end = Math.ceil(hour(this.endHour, 24));
    return end > start ? [start, end] : [0, 24];
  }

  /** Intl formatters for the current locale, built once per locale. */
  get #fmt() {
    if (this.#formats?.locale === this.#locale) return this.#formats;
    const locale = this.#locale;
    const date = (options) => new Intl.DateTimeFormat(locale, { calendar: 'gregory', timeZone: 'UTC', ...options });
    const formats = {
      locale,
      full: date({ dateStyle: 'full' }),
      long: date({ dateStyle: 'long' }),
      monthYear: date({ month: 'long', year: 'numeric' }),
      month: date({ month: 'long' }),
      year: date({ year: 'numeric' }),
      dayNumber: date({ day: 'numeric' }),
      weekdayShort: date({ weekday: 'short' }),
      weekdayNarrow: date({ weekday: 'narrow' }),
      weekdayLong: date({ weekday: 'long' }),
      hour: date({ hour: '2-digit', minute: '2-digit' }),
      // Event instants are read in the local time zone.
      time: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
      when: new Intl.DateTimeFormat(locale, { calendar: 'gregory', dateStyle: 'medium', timeStyle: 'short' }),
      number: new Intl.NumberFormat(locale)
    };
    return (this.#formats = formats);
  }

  /** The locale's own word for a view or for today, capitalised. */
  #word(kind) {
    const locale = this.#locale;
    const english = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', today: 'Today' }[kind];
    try {
      const text =
        kind === 'today'
          ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day')
          : new Intl.DisplayNames(locale, { type: 'dateTimeField' }).of(kind === 'week' ? 'weekOfYear' : kind);
      return text ? text.charAt(0).toLocaleUpperCase(locale) + text.slice(1) : english;
    } catch {
      return english;
    }
  }

  /* ----------------------------------------------------------------- dates */

  /** @returns {[number, number]} first and last day of the period around `anchor` */
  #period(view, anchor) {
    const { y, m, w } = fields(anchor);
    if (view === 'week') {
      const start = anchor - ((w - this.#weekStart + 7) % 7);
      return [start, start + 6];
    }
    if (view === 'month') return [toDay(y, m, 1), toDay(y, m + 1, 0)];
    if (view === 'year') return [toDay(y, 0, 1), toDay(y, 11, 31)];
    return [anchor, anchor];
  }

  #step(day, direction) {
    const view = this.#view;
    if (view === 'week') return day + 7 * direction;
    if (view === 'month') return addMonths(day, direction);
    if (view === 'year') return addMonths(day, 12 * direction);
    return day + direction;
  }

  /* ---------------------------------------------------------------- events */

  #index() {
    const list = Array.isArray(this.events) ? this.events : [];
    this.#items = [];
    this.#byDay = new Map();
    list.forEach((raw, index) => {
      if (!raw || typeof raw !== 'object') return;
      const start = toDate(raw.start);
      if (!start) return;
      let end = toDate(raw.end) || start;
      if (end < start) end = start;
      const startDay = localDay(start);
      let endDay = localDay(end);
      let endMin = end.getHours() * 60 + end.getMinutes();
      // An event that ends at midnight belongs to the day before.
      if (endDay > startDay && endMin === 0) {
        endDay -= 1;
        endMin = 1440;
      }
      const title = raw.title == null ? '' : String(raw.title);
      const startMin = start.getHours() * 60 + start.getMinutes();
      const bare = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
      // Whole days, or a day or more, sit in the all-day lane of the timed views.
      const allDay =
        (startMin === 0 && endMin === 1440) ||
        end.getTime() - start.getTime() >= MS_DAY ||
        (bare(raw.start) && (raw.end == null || bare(raw.end)));
      const color = PALETTE.includes(raw.color) ? raw.color : CYCLE[index % CYCLE.length];
      const item = {
        raw,
        index,
        value: raw.id ?? index,
        title,
        color,
        start,
        end,
        startDay,
        endDay,
        startMin,
        endMin,
        allDay,
        key: `${index}:${start.getTime()}:${end.getTime()}:${color}:${title}`
      };
      this.#items.push(item);
      const last = Math.min(endDay, startDay + MAX_SPAN);
      for (let day = startDay; day <= last; day++) {
        const bucket = this.#byDay.get(day);
        if (bucket) bucket.push(item);
        else this.#byDay.set(day, [item]);
      }
    });
    const order = (a, b) => a.start - b.start || b.end - a.end || a.index - b.index;
    for (const bucket of this.#byDay.values()) bucket.sort(order);
  }

  /**
   * Minutes of `day` an event covers, drawn at least `least` minutes tall so
   * its title fits.
   */
  #span(item, day, least = 15) {
    const from = day === item.startDay ? item.startMin : 0;
    const to = day === item.endDay ? item.endMin : 1440;
    return [from, Math.max(to, Math.min(1440, from + least))];
  }

  /** Date and time of an event in full, for the part of its name that is not on screen. */
  #when(item) {
    return item.end > item.start ? this.#fmt.when.formatRange(item.start, item.end) : this.#fmt.when.format(item.start);
  }

  #timeText(item, range) {
    const { time } = this.#fmt;
    return range && item.end > item.start ? time.formatRange(item.start, item.end) : time.format(item.start);
  }

  /* ---------------------------------------------------------------- render */

  #render() {
    const view = this.#view;
    const anchor = this.#anchor;
    const [start, end] = this.#period(view, anchor);
    const today = localDay(new Date());
    const fmt = this.#fmt;
    if (this.#cursor < start || this.#cursor > end) this.#cursor = anchor;

    // toolbar
    for (const button of this.#toolbar.querySelectorAll('button')) {
      if (button.dataset.step) {
        button.setAttribute('aria-label', (button.dataset.step === '1' ? this.labelNext : this.labelPrevious) || '');
      } else if (button.dataset.view) {
        const name = button.dataset.view;
        const own = this[`label${name[0].toUpperCase()}${name.slice(1)}`];
        setText(button, own || this.#word(name));
        button.setAttribute('aria-pressed', String(name === view));
      } else {
        setText(button, this.labelToday || this.#word('today'));
      }
    }
    let title;
    if (view === 'day') title = fmt.full.format(utc(anchor));
    else if (view === 'week') title = fmt.long.formatRange(utc(start), utc(end));
    else if (view === 'month') title = fmt.monthYear.format(utc(anchor));
    else title = fmt.year.format(utc(anchor));
    setText(this.#title, title);
    this.toggleState('today', today >= start && today <= end);

    // The frame of a view is rebuilt only when what it shows changed.
    const [hourStart, hourEnd] = this.#hours;
    const structure = [view, start, end, fmt.locale, this.#weekStart, hourStart, hourEnd, today, this.labelMore, this.labelEvents].join('|');
    const rebuilt = structure !== this.#structure;
    if (rebuilt) {
      const active = this.shadowRoot.activeElement;
      const hadFocus = !!active && this.#content.contains(active);
      this.#structure = structure;
      this.#cells = new Map();
      this.#content.dataset.view = view;
      let tree;
      if (view === 'month') tree = this.#buildMonth(anchor, today);
      else if (view === 'year') tree = this.#buildYear(anchor, today);
      else tree = this.#buildTimed(view, start, end, today);
      this.#content.replaceChildren(tree);
      if (hadFocus) this.#focusCell(this.#cursor);
    }

    // Events are drawn per day, and only for a day whose events changed.
    for (const [day, cell] of this.#cells) {
      const items = this.#byDay.get(day) || [];
      const signature = items.map((item) => item.key).join('\n');
      if (this.#drawn.get(cell) === signature) continue;
      this.#drawn.set(cell, signature);
      if (view === 'month') this.#drawMonthDay(cell, day, items);
      else if (view === 'year') this.#drawYearDay(cell, day, items);
      else this.#drawTimedDay(cell, day, items);
    }
    if (view === 'day' || view === 'week') {
      // Every column reserves the room of the fullest all-day lane, so the
      // hours line up across the days and with the gutter.
      let lane = 0;
      for (const day of this.#cells.keys()) {
        lane = Math.max(lane, (this.#byDay.get(day) || []).filter((item) => item.allDay).length);
      }
      this.#content.firstElementChild?.style.setProperty('--_lane-rows', String(lane));
      if (rebuilt) this.#scrollPending = true;
      if (this.#scrollPending) this.#scrollToFirst();
    }
    this.#rove();
  }

  /** Brings the period's first timed event into view, or the start of the hours. */
  #scrollToFirst() {
    const content = this.#content;
    const first = [...content.querySelectorAll('.event:not(.all-day)')].reduce(
      (best, el) => (best && best.offsetTop <= el.offsetTop ? best : el),
      null
    );
    if (!first) {
      content.scrollTop = 0;
      return;
    }
    this.#scrollPending = false;
    const origin = content.getBoundingClientRect().top - content.scrollTop;
    const top = first.getBoundingClientRect().top - origin;
    // Below the sticky day headers of the week view.
    const columns = content.querySelector('.columns');
    const header = columns ? columns.getBoundingClientRect().top - origin : 0;
    const fits = top + first.offsetHeight <= content.clientHeight;
    content.scrollTop = fits ? 0 : Math.max(0, top - header - 8);
  }

  /** A day column is taller than the view, so focusing it must not scroll. */
  #focusCell(day) {
    const stacked = this.#view === 'month' || this.#view === 'year';
    this.#cells.get(day)?.focus({ preventScroll: !stacked });
  }

  /** One cell is in the tab order: the cursor's. */
  #rove() {
    for (const [day, cell] of this.#cells) cell.tabIndex = day === this.#cursor ? 0 : -1;
  }

  #dayLabel(day, count) {
    const date = this.#fmt.full.format(utc(day));
    return count ? `${date}, ${fill(this.labelEvents, this.#fmt.number.format(count))}` : date;
  }

  /** Weekday header cells for the seven days from `start`. */
  #weekdayHeaders(start, format, today, withNumber) {
    const fmt = this.#fmt;
    return Array.from({ length: 7 }, (_, i) => {
      const day = start + i;
      const cell = h('div', {
        class: `day-header${withNumber && day === today ? ' today' : ''}`,
        part: 'day-header',
        role: 'columnheader',
        'aria-label': withNumber ? fmt.full.format(utc(day)) : fmt.weekdayLong.format(utc(day))
      });
      cell.appendChild(h('span', { class: 'day-name', text: fmt[format].format(utc(day)) }));
      if (withNumber) cell.appendChild(h('span', { class: 'day-number', text: fmt.dayNumber.format(utc(day)) }));
      return cell;
    });
  }

  /* ----------------------------------------------------- day and week view */

  #buildTimed(view, start, end, today) {
    const fmt = this.#fmt;
    const [hourStart, hourEnd] = this.#hours;
    const root = h('div', { class: `timed ${view}-view` });
    root.style.setProperty('--_hours', String(hourEnd - hourStart));
    root.style.setProperty('--_days', String(end - start + 1));

    // The hour gutter is decoration: every event carries its own times.
    const gutter = h('div', { class: 'hours', 'aria-hidden': 'true' });
    for (let hour = hourStart; hour < hourEnd; hour++) {
      const parts = fmt.hour.formatToParts(new Date(Date.UTC(2024, 0, 1, hour)));
      const period = parts.find((p) => p.type === 'dayPeriod')?.value || '';
      const clock = parts
        .filter((p) => p.type !== 'dayPeriod')
        .map((p) => p.value)
        .join('')
        .trim();
      gutter.appendChild(
        h('div', { class: 'hour' }, [h('span', { class: 'clock-text', text: clock }), period ? h('span', { class: 'clock-period', text: period }) : null])
      );
    }

    const grid = h('div', {
      class: 'grid',
      part: 'grid',
      role: 'grid',
      'aria-label': view === 'day' ? fmt.full.format(utc(start)) : fmt.long.formatRange(utc(start), utc(end))
    });
    if (view === 'week') {
      root.appendChild(h('div', { class: 'corner', 'aria-hidden': 'true' }));
      grid.appendChild(h('div', { class: 'week-header', role: 'row' }, this.#weekdayHeaders(start, 'weekdayShort', today, true)));
    }
    const row = h('div', { class: 'columns', role: 'row' });
    for (let day = start; day <= end; day++) {
      const cell = h('div', {
        class: `day-column${day === today ? ' today' : ''}`,
        part: 'day',
        role: 'gridcell',
        'data-day': day,
        'aria-current': day === today ? 'date' : null
      });
      this.#cells.set(day, cell);
      row.appendChild(cell);
    }
    grid.appendChild(row);
    root.append(gutter, grid);
    return root;
  }

  #drawTimedDay(cell, day, items) {
    const [hourStart, hourEnd] = this.#hours;
    const from = hourStart * 60;
    const to = hourEnd * 60;
    const day_ = this.#view === 'day';
    const least = day_ ? 15 : 30;
    const shown = [];
    const lane = [];
    for (const item of items) {
      if (item.allDay) {
        lane.push(item);
        continue;
      }
      const [s, e] = this.#span(item, day, least);
      if (e <= from || s >= to) continue;
      shown.push({ item, s: Math.max(s, from), e: Math.min(e, to), clippedStart: s < from, clippedEnd: e > to });
    }
    layout(shown);
    cell.replaceChildren(
      h('span', { class: 'sr day-label', text: this.#dayLabel(day, lane.length + shown.length) }),
      ...lane.map((item, row) => {
        const button = h(
          'button',
          {
            type: 'button',
            class: 'event all-day',
            part: 'event',
            tabindex: -1,
            'data-index': item.index,
            'data-color': item.color
          },
          [h('span', { class: 'event-title', text: item.title }), h('span', { class: 'sr event-when', text: this.#when(item) })]
        );
        button.style.setProperty('--_row', String(row));
        return button;
      }),
      ...shown.map((box) => {
        const { item } = box;
        const button = h(
          'button',
          {
            type: 'button',
            class: `event${box.clippedStart ? ' clipped-start' : ''}${box.clippedEnd ? ' clipped-end' : ''}`,
            part: 'event',
            tabindex: -1,
            'data-index': item.index,
            'data-color': item.color
          },
          [
            h('span', { class: 'event-title', text: item.title }),
            h('span', { class: 'sr event-when', text: this.#when(item) }),
            h('span', { class: 'event-time', 'aria-hidden': 'true', text: this.#timeText(item, day_) })
          ]
        );
        button.style.setProperty('--_top', String((box.s - from) / 60));
        button.style.setProperty('--_size', String((box.e - box.s) / 60));
        button.style.setProperty('--_column', String(box.column));
        button.style.setProperty('--_columns', String(box.columns));
        return button;
      })
    );
  }

  /* ------------------------------------------------------------ month view */

  #buildMonth(anchor, today) {
    const fmt = this.#fmt;
    const [first, last] = this.#period('month', anchor);
    const lead = (fields(first).w - this.#weekStart + 7) % 7;
    const gridStart = first - lead;
    const grid = h('div', { class: 'month-view grid', part: 'grid', role: 'grid', 'aria-label': fmt.monthYear.format(utc(anchor)) });
    grid.appendChild(h('div', { class: 'month-header', role: 'row' }, this.#weekdayHeaders(gridStart, 'weekdayShort', today, false)));
    for (let weekStart = gridStart; weekStart <= last; weekStart += 7) {
      const row = h('div', { class: 'month-row', role: 'row' });
      for (let day = weekStart; day < weekStart + 7; day++) {
        if (day < first || day > last) {
          row.appendChild(h('div', { class: 'month-cell empty', role: 'gridcell' }));
          continue;
        }
        const cell = h(
          'div',
          {
            class: `month-cell${day === today ? ' today' : ''}`,
            part: 'day',
            role: 'gridcell',
            'data-day': day,
            'aria-current': day === today ? 'date' : null
          },
          [
            h('div', { class: 'cell-header' }, [
              h('span', { class: 'day-number', 'aria-hidden': 'true', text: fmt.dayNumber.format(utc(day)) }),
              h('span', { class: 'sr day-label' })
            ]),
            h('div', { class: 'cell-events' })
          ]
        );
        this.#cells.set(day, cell);
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
    return grid;
  }

  #drawMonthDay(cell, day, items) {
    setText(cell.querySelector('.day-label'), this.#dayLabel(day, items.length));
    const nodes = items.slice(0, 3).map((item) =>
      h(
        'button',
        {
          type: 'button',
          class: 'month-event',
          part: 'event',
          tabindex: -1,
          'data-index': item.index,
          'data-color': item.color
        },
        [h('span', { class: 'event-dot' }), h('span', { class: 'event-title', text: item.title }), h('span', { class: 'sr event-when', text: this.#when(item) })]
      )
    );
    if (items.length > 3) {
      nodes.push(
        h('button', {
          type: 'button',
          class: 'more-events',
          part: 'more-button',
          tabindex: -1,
          'data-open-day': day,
          text: fill(this.labelMore, this.#fmt.number.format(items.length - 3))
        })
      );
    }
    cell.querySelector('.cell-events').replaceChildren(...nodes);
  }

  /* ------------------------------------------------------------- year view */

  #buildYear(anchor, today) {
    const fmt = this.#fmt;
    const { y } = fields(anchor);
    const root = h('div', { class: 'year-view' });
    for (let month = 0; month < 12; month++) {
      const first = toDay(y, month, 1);
      const last = toDay(y, month + 1, 0);
      const gridStart = first - ((fields(first).w - this.#weekStart + 7) % 7);
      const grid = h('div', { class: 'year-month-grid grid', part: 'grid', role: 'grid', 'aria-label': fmt.monthYear.format(utc(first)) });
      grid.appendChild(h('div', { class: 'year-day-names', role: 'row' }, this.#weekdayHeaders(gridStart, 'weekdayNarrow', today, false)));
      for (let weekStart = gridStart; weekStart <= last; weekStart += 7) {
        const row = h('div', { class: 'year-days', role: 'row' });
        for (let day = weekStart; day < weekStart + 7; day++) {
          if (day < first || day > last) {
            row.appendChild(h('div', { class: 'year-day empty', role: 'gridcell' }));
            continue;
          }
          const cell = h(
            'div',
            {
              class: `year-day${day === today ? ' today' : ''}`,
              part: 'day',
              role: 'gridcell',
              'data-day': day,
              'data-open-day': day,
              'aria-current': day === today ? 'date' : null
            },
            [h('span', { 'aria-hidden': 'true', text: fmt.dayNumber.format(utc(day)) }), h('span', { class: 'sr day-label' })]
          );
          this.#cells.set(day, cell);
          row.appendChild(cell);
        }
        grid.appendChild(row);
      }
      root.appendChild(h('div', { class: 'year-month' }, [h('div', { class: 'year-month-name', 'aria-hidden': 'true', text: fmt.month.format(utc(first)) }), grid]));
    }
    return root;
  }

  #drawYearDay(cell, day, items) {
    cell.classList.toggle('has-events', items.length > 0);
    setText(cell.querySelector('.day-label'), this.#dayLabel(day, items.length));
  }

  /* ----------------------------------------------------------- interaction */

  /** A move the user made: sets the state, tells the page, draws at once. */
  #go(day, view = this.#view) {
    const before = this.#structure;
    this.view = view;
    this.date = iso(day);
    this.#cursor = day;
    this.#render();
    if (this.#structure !== before) this.emit('change', { view: this.#view, date: iso(day) });
  }

  #onToolbarClick(event) {
    const button = /** @type {Element} */ (event.target).closest?.('button');
    if (!button) return;
    if (button.dataset.step) this.#go(this.#step(this.#cursor, Number(button.dataset.step)));
    else if (button.dataset.view) this.#go(this.#cursor, button.dataset.view);
    else this.#go(localDay(new Date()));
  }

  #onContentClick(event) {
    const target = /** @type {Element} */ (event.target);
    const button = target.closest('button[data-index]');
    if (button) {
      const item = this.#items.find((it) => it.index === Number(button.dataset.index));
      if (item) this.emit('select', { value: item.value, item: item.raw });
      this.#moveCursor(button.closest('[data-day]'));
      return;
    }
    const opener = target.closest('[data-open-day]');
    if (opener) {
      this.#open(Number(opener.dataset.openDay));
      return;
    }
    this.#moveCursor(target.closest('[data-day]'));
  }

  #moveCursor(cell) {
    if (!cell) return;
    this.#cursor = Number(cell.dataset.day);
    this.#rove();
  }

  /** Opens one day in the day view, keeping focus in the grid. */
  #open(day) {
    this.#go(day, 'day');
    this.#focusCell(day);
  }

  /** Moves the cursor to a day, changing period when it lies outside. */
  #focusDay(day) {
    if (!this.#cells.has(day)) this.#go(day);
    this.#cursor = day;
    this.#rove();
    this.#focusCell(day);
  }

  #onKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = /** @type {HTMLElement} */ (event.target);
    const cell = /** @type {HTMLElement | null} */ (target.closest('[data-day]'));
    if (!cell) return;
    const day = Number(cell.dataset.day);
    const view = this.#view;
    const inCell = target === cell;
    const buttons = /** @type {HTMLElement[]} */ ([...cell.querySelectorAll('button')]);
    const at = buttons.indexOf(/** @type {any} */ (target.closest('button')));
    const flip = isRtl(this) ? -1 : 1;
    const stacked = view === 'month' || view === 'year';
    const done = () => event.preventDefault();

    switch (event.key) {
      case 'ArrowRight':
        this.#focusDay(day + flip);
        return done();
      case 'ArrowLeft':
        this.#focusDay(day - flip);
        return done();
      case 'ArrowDown':
        if (!inCell) buttons[Math.min(buttons.length - 1, at + 1)]?.focus();
        else if (stacked) this.#focusDay(day + 7);
        else buttons[0]?.focus();
        return done();
      case 'ArrowUp':
        if (!inCell) (buttons[at - 1] || cell).focus();
        else if (stacked) this.#focusDay(day - 7);
        return done();
      case 'Home':
      case 'End': {
        if (!inCell) buttons.at(event.key === 'Home' ? 0 : -1)?.focus();
        else if (view !== 'day') {
          const offset = (fields(day).w - this.#weekStart + 7) % 7;
          this.#focusDay(event.key === 'Home' ? day - offset : day + 6 - offset);
        }
        return done();
      }
      case 'PageUp':
        this.#focusDay(this.#step(day, -1));
        return done();
      case 'PageDown':
        this.#focusDay(this.#step(day, 1));
        return done();
      case 'Escape':
        if (!inCell) {
          cell.focus();
          done();
        }
        return;
      case 'Enter':
      case ' ':
        // On an event the native button does the work.
        if (!inCell) return;
        if (view === 'year') this.#open(day);
        else buttons[0]?.focus();
        return done();
    }
  }
}

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

/**
 * Puts overlapping boxes side by side: each takes the first free column of
 * its cluster, and a cluster is as many columns wide as its busiest moment.
 * @param {{ s: number, e: number, column?: number, columns?: number }[]} boxes sorted by start
 */
function layout(boxes) {
  let cluster = [];
  let ends = [];
  let clusterEnd = -1;
  const close = () => {
    for (const box of cluster) box.columns = ends.length;
    cluster = [];
    ends = [];
  };
  for (const box of boxes) {
    if (cluster.length && box.s >= clusterEnd) close();
    let column = ends.findIndex((end) => end <= box.s);
    if (column < 0) column = ends.length;
    ends[column] = box.e;
    box.column = column;
    cluster.push(box);
    clusterEnd = Math.max(clusterEnd, box.e);
  }
  close();
}

define('punica-agenda', PunicaAgenda);
