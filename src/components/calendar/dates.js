/**
 * Calendar dates and wall-clock times as plain numbers.
 *
 * A date here is `{ y, m, d }` with `m` 1 to 12, and a time is minutes since
 * midnight. Nothing goes through a local-time `Date`, so no time zone or
 * daylight-saving change can move a day. Where a `Date` is needed (weekdays,
 * `Intl`), it is built and read in UTC.
 */

/** @typedef {{ y: number, m: number, d: number }} CalendarDate */

const pad = (n, width = 2) => String(n).padStart(width, '0');

/** @param {number} y @param {number} m 1 to 12 */
export function daysInMonth(y, m) {
  return m === 2 ? ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** @param {CalendarDate} date */
const utc = ({ y, m, d }) => {
  const date = new Date(Date.UTC(2000, m - 1, d));
  date.setUTCFullYear(y);
  return date;
};

/** @param {Date} date a Date read in UTC @returns {CalendarDate} */
const fromUtc = (date) => ({ y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() });

/**
 * Whether the three numbers name a real day.
 * @param {number} y @param {number} m @param {number} d
 */
export function isRealDate(y, m, d) {
  return Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) && y >= 1 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/**
 * Parses `yyyy-mm-dd`.
 * @param {string | null | undefined} text
 * @returns {CalendarDate | null}
 */
export function parseIsoDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || '');
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  return isRealDate(y, m, d) ? { y, m, d } : null;
}

/** @param {CalendarDate | null} date @returns {string | null} `yyyy-mm-dd` */
export function toIsoDate(date) {
  return date ? `${pad(date.y, 4)}-${pad(date.m)}-${pad(date.d)}` : null;
}

/** Today on the user's own calendar. @returns {CalendarDate} */
export function todayDate() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

/** @param {CalendarDate} date @returns {number} 0 Sunday to 6 Saturday */
export function weekdayOf(date) {
  return utc(date).getUTCDay();
}

/** @param {CalendarDate} date @param {number} days @returns {CalendarDate} */
export function addDays(date, days) {
  const next = utc(date);
  next.setUTCDate(next.getUTCDate() + days);
  return fromUtc(next);
}

/**
 * Moves by whole months, keeping the day where the month has it.
 * @param {CalendarDate} date @param {number} months @returns {CalendarDate}
 */
export function addMonths(date, months) {
  const index = date.y * 12 + (date.m - 1) + months;
  const y = Math.floor(index / 12);
  const m = (index % 12 + 12) % 12 + 1;
  return { y, m, d: Math.min(date.d, daysInMonth(y, m)) };
}

/** @param {CalendarDate} a @param {CalendarDate} b @returns {number} negative, zero or positive */
export function compareDates(a, b) {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

/**
 * @param {CalendarDate} date
 * @param {CalendarDate | null} min
 * @param {CalendarDate | null} max
 * @returns {CalendarDate}
 */
export function clampDate(date, min, max) {
  if (min && compareDates(date, min) < 0) return min;
  if (max && compareDates(date, max) > 0) return max;
  return date;
}

/**
 * Formats a calendar date with `Intl`, in the Gregorian calendar.
 * @param {string} language
 * @param {CalendarDate} date
 * @param {Intl.DateTimeFormatOptions} options
 */
export function formatDate(language, date, options) {
  return new Intl.DateTimeFormat(language, { calendar: 'gregory', ...options, timeZone: 'UTC' }).format(utc(date));
}

const FIELD_FORMAT = { year: 'numeric', month: '2-digit', day: '2-digit', numberingSystem: 'latn' };

/**
 * The text a date field shows: all-numeric, in the language's own order.
 * @param {string} language
 * @param {CalendarDate | null} date
 */
export function formatFieldDate(language, date) {
  return date ? formatDate(language, date, FIELD_FORMAT) : '';
}

/**
 * The order a language writes day, month and year in.
 * @param {string} language
 * @returns {('year' | 'month' | 'day')[]}
 */
export function dateFieldOrder(language) {
  return /** @type {any} */ (
    new Intl.DateTimeFormat(language, { calendar: 'gregory', ...FIELD_FORMAT, timeZone: 'UTC' })
      .formatToParts(utc({ y: 2001, m: 2, d: 3 }))
      .map((part) => part.type)
      .filter((type) => type === 'year' || type === 'month' || type === 'day')
  );
}

/**
 * Parses what a person typed: `yyyy-mm-dd`, or three numbers in the
 * language's own order with any separators. A two-digit year is this century.
 * @param {string} text
 * @param {string} language
 * @returns {CalendarDate | null}
 */
export function parseFieldDate(text, language) {
  const trimmed = (text || '').trim();
  const iso = parseIsoDate(trimmed);
  if (iso) return iso;
  const numbers = trimmed.match(/\d+/g);
  if (!numbers || numbers.length !== 3 || /[a-z]/i.test(trimmed)) return null;
  const order = dateFieldOrder(language);
  /** @type {Record<string, number>} */
  const fields = {};
  order.forEach((type, i) => (fields[type] = Number(numbers[i])));
  if (numbers[order.indexOf('year')].length <= 2) fields.year += 2000;
  return isRealDate(fields.year, fields.month, fields.day) ? { y: fields.year, m: fields.month, d: fields.day } : null;
}

const SUNDAY_FIRST = new Set(['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'IL', 'IN', 'PH', 'TW', 'HK', 'AU', 'ZA', 'CO', 'PE', 'VE', 'SA', 'TH', 'ID', 'PK', 'SG']);
const SATURDAY_FIRST = new Set(['AE', 'AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY']);

/**
 * The day a week starts on for a language.
 * @param {string} language
 * @returns {number} 0 Sunday to 6 Saturday
 */
export function firstDayOfWeekFor(language) {
  try {
    /** @type {any} */
    const locale = new Intl.Locale(language);
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    if (info && Number.isInteger(info.firstDay)) return info.firstDay % 7;
    const region = locale.maximize().region;
    if (SUNDAY_FIRST.has(region)) return 0;
    if (SATURDAY_FIRST.has(region)) return 6;
  } catch {
    /* an unknown tag falls through to Monday */
  }
  return 1;
}

/* ------------------------------------------------------------------ time */

/**
 * Parses `HH:mm` (24-hour).
 * @param {string | null | undefined} text
 * @returns {number | null} minutes since midnight
 */
export function parseIsoTime(text) {
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(text || '');
  if (!match) return null;
  const h = Number(match[1]);
  const min = Number(match[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** @param {number | null} minutes @returns {string | null} `HH:mm` */
export function toIsoTime(minutes) {
  return minutes == null ? null : `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** @type {Map<string, Intl.DateTimeFormat>} */
const timeFormats = new Map();

/** A 12-hour language writes `9:30 AM`, a 24-hour one `09:30`. */
const timeFormat = (language) => {
  let format = timeFormats.get(language);
  if (!format) {
    const base = { minute: '2-digit', numberingSystem: 'latn', timeZone: 'UTC' };
    format = new Intl.DateTimeFormat(language, { ...base, hour: 'numeric' });
    if (!format.resolvedOptions().hour12) format = new Intl.DateTimeFormat(language, { ...base, hour: '2-digit' });
    timeFormats.set(language, format);
  }
  return format;
};

/**
 * Formats a time of day the way the language does, 12 or 24 hour.
 * @param {string} language
 * @param {number | null} minutes
 */
export function formatFieldTime(language, minutes) {
  return minutes == null ? '' : timeFormat(language).format(new Date(Date.UTC(2001, 0, 1, 0, minutes)));
}

/** Whether a language writes times with a day period (AM / PM). @param {string} language */
export function usesDayPeriod(language) {
  return timeFormat(language)
    .formatToParts(new Date(Date.UTC(2001, 0, 1, 13)))
    .some((part) => part.type === 'dayPeriod');
}

/**
 * Parses what a person typed: `14:30`, `1430`, `2:30 pm`, `2 PM`, or the
 * language's own day-period words.
 * @param {string} text
 * @param {string} language
 * @returns {number | null} minutes since midnight
 */
export function parseFieldTime(text, language) {
  const typed = (text || '').trim().toLocaleLowerCase(language);
  if (!typed) return null;
  const digits = typed.match(/\d+/g);
  if (!digits || digits.length > 3) return null;
  let h;
  let min = 0;
  if (digits.length === 1 && digits[0].length >= 3 && digits[0].length <= 4) {
    h = Number(digits[0].slice(0, -2));
    min = Number(digits[0].slice(-2));
  } else {
    h = Number(digits[0]);
    if (digits.length > 1) min = Number(digits[1]);
  }
  const rest = typed.replace(/[\d\s:.,]/g, '');
  if (rest) {
    const period = (hour) =>
      (timeFormat(language).formatToParts(new Date(Date.UTC(2001, 0, 1, hour))).find((part) => part.type === 'dayPeriod')?.value || '')
        .toLocaleLowerCase(language)
        .replace(/[\s.]/g, '');
    const word = rest.replace(/\./g, '');
    const am = period(1) || 'am';
    const pm = period(13) || 'pm';
    const isPm = word === pm || word === 'pm' || word === 'p';
    const isAm = word === am || word === 'am' || word === 'a';
    if (!isPm && !isAm) return null;
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (isPm ? 12 : 0);
  }
  return Number.isInteger(h) && h >= 0 && h < 24 && min >= 0 && min < 60 ? h * 60 + min : null;
}
