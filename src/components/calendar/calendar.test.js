import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './calendar.js';
import { parseFieldDate, formatFieldDate, addDays, addMonths, parseIsoDate, toIsoDate, firstDayOfWeekFor, parseFieldTime, formatFieldTime } from './dates.js';

const html = '<punica-calendar lang="en-GB" value="2026-03-15"></punica-calendar>';

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const cell = (el, iso) => el.shadowRoot.querySelector(`td[data-date="${iso}"]`);
const focused = (el) => el.shadowRoot.activeElement?.dataset.date;
const title = (el) => el.shadowRoot.querySelector('[part="title"]').textContent;

contract('punica-calendar', { html });

describe('calendar dates', () => {
  it('moves by days and months without a time zone', () => {
    expect(toIsoDate(addDays(parseIsoDate('2026-03-28'), 1))).toBe('2026-03-29');
    expect(toIsoDate(addDays(parseIsoDate('2026-03-29'), 1))).toBe('2026-03-30');
    expect(toIsoDate(addDays(parseIsoDate('2026-10-25'), 1))).toBe('2026-10-26');
    expect(toIsoDate(addDays(parseIsoDate('2024-02-28'), 1))).toBe('2024-02-29');
    expect(toIsoDate(addDays(parseIsoDate('2026-01-01'), -1))).toBe('2025-12-31');
    expect(toIsoDate(addMonths(parseIsoDate('2026-01-31'), 1))).toBe('2026-02-28');
    expect(toIsoDate(addMonths(parseIsoDate('2026-01-15'), -1))).toBe('2025-12-15');
    expect(parseIsoDate('2026-02-30')).toBe(null);
    expect(parseIsoDate('2026-2-3')).toBe(null);
  });

  it('formats and parses in the order of the language', () => {
    const date = parseIsoDate('2026-02-03');
    expect(formatFieldDate('en-US', date)).toBe('02/03/2026');
    expect(formatFieldDate('en-GB', date)).toBe('03/02/2026');
    expect(formatFieldDate('tr', date)).toBe('03.02.2026');
    expect(toIsoDate(parseFieldDate('02/03/2026', 'en-US'))).toBe('2026-02-03');
    expect(toIsoDate(parseFieldDate('3.2.26', 'tr'))).toBe('2026-02-03');
    expect(toIsoDate(parseFieldDate('2026-02-03', 'tr'))).toBe('2026-02-03');
    expect(parseFieldDate('31/02/2026', 'en-GB')).toBe(null);
    expect(parseFieldDate('soon', 'en-GB')).toBe(null);
  });

  it('knows where a week starts', () => {
    expect(firstDayOfWeekFor('en-US')).toBe(0);
    expect(firstDayOfWeekFor('en-GB')).toBe(1);
    expect(firstDayOfWeekFor('tr')).toBe(1);
  });

  it('formats and parses times of day', () => {
    expect(formatFieldTime('en-GB', 14 * 60 + 30)).toBe('14:30');
    expect(formatFieldTime('en-US', 14 * 60 + 30).replace(/\s/g, ' ')).toBe('2:30 PM');
    expect(parseFieldTime('2:30 pm', 'en-US')).toBe(870);
    expect(parseFieldTime('12 am', 'en-US')).toBe(0);
    expect(parseFieldTime('14:30', 'tr')).toBe(870);
    expect(parseFieldTime('1430', 'tr')).toBe(870);
    expect(parseFieldTime('25:00', 'tr')).toBe(null);
    expect(parseFieldTime('noonish', 'en-US')).toBe(null);
  });
});

describe('punica-calendar', () => {
  afterEach(cleanup);

  it('draws the month of its value as a grid with names from Intl', async () => {
    const el = await fixture(html);
    expect(title(el)).toBe('March 2026');
    expect(el.month).toBe('2026-03');
    const grid = el.shadowRoot.querySelector('table');
    expect(grid.getAttribute('role')).toBe('grid');
    const heads = [...el.shadowRoot.querySelectorAll('th')];
    expect(heads.map((th) => th.textContent)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(heads[0].abbr).toBe('Monday');
    const selected = cell(el, '2026-03-15');
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(selected.getAttribute('aria-label')).toBe('Sunday, 15 March 2026');
    expect(selected.tabIndex).toBe(0);
    expect(el.shadowRoot.querySelectorAll('td[tabindex="0"]').length).toBe(1);
    // 1 March 2026 is a Sunday: the last cell of the first row.
    expect(el.shadowRoot.querySelector('tbody tr').lastElementChild.dataset.date).toBe('2026-03-01');
  });

  it('follows locale and first-day-of-week', async () => {
    const el = await fixture('<punica-calendar locale="tr" value="2026-03-15"></punica-calendar>');
    expect(title(el)).toBe('Mart 2026');
    expect(el.shadowRoot.querySelector('th').textContent).toBe('Pzt');
    el.firstDayOfWeek = 0;
    await settle();
    expect(el.shadowRoot.querySelector('th').textContent).toBe('Paz');
    expect(el.shadowRoot.querySelector('tbody td').dataset.date).toBe('2026-03-01');
    const us = await fixture('<punica-calendar lang="en-US" value="2026-03-15"></punica-calendar>');
    expect(us.shadowRoot.querySelector('th').textContent).toBe('Sun');
  });

  it('writes the day numbers in the digits of its language', async () => {
    const el = await fixture('<punica-calendar locale="ar-EG" value="2026-03-15"></punica-calendar>');
    const day = cell(el, '2026-03-15');
    expect(day.textContent).toBe('١٥');
    // The visible number is part of the cell's name.
    expect(day.getAttribute('aria-label')).toContain(day.textContent);
    const tr = await fixture('<punica-calendar locale="tr" value="2026-03-15"></punica-calendar>');
    expect(cell(tr, '2026-03-15').textContent).toBe('15');
  });

  it('moves by day, week, week ends, month and year from the keyboard', async () => {
    const el = await fixture(html);
    el.focus();
    expect(focused(el)).toBe('2026-03-15');
    const press = (k, init) => key(el.shadowRoot.activeElement, k, init);
    expect(press('ArrowRight').defaultPrevented).toBe(true);
    expect(focused(el)).toBe('2026-03-16');
    press('ArrowLeft');
    press('ArrowLeft');
    expect(focused(el)).toBe('2026-03-14');
    press('ArrowDown');
    expect(focused(el)).toBe('2026-03-21');
    press('ArrowUp');
    press('ArrowUp');
    expect(focused(el)).toBe('2026-03-07');
    press('Home');
    expect(focused(el)).toBe('2026-03-02');
    press('End');
    expect(focused(el)).toBe('2026-03-08');
    press('PageDown');
    expect(focused(el)).toBe('2026-04-08');
    expect(title(el)).toBe('April 2026');
    press('PageUp');
    press('PageUp');
    expect(focused(el)).toBe('2026-02-08');
    press('PageDown', { shiftKey: true });
    expect(focused(el)).toBe('2027-02-08');
    press('PageUp', { shiftKey: true });
    expect(focused(el)).toBe('2026-02-08');
    expect(el.shadowRoot.querySelectorAll('td[tabindex="0"]').length).toBe(1);
    expect(el.value).toBe('2026-03-15');
  });

  it('crosses a month edge with an arrow key', async () => {
    const el = await fixture('<punica-calendar lang="en-GB" value="2026-03-31"></punica-calendar>');
    el.focus();
    key(el.shadowRoot.activeElement, 'ArrowRight');
    expect(focused(el)).toBe('2026-04-01');
    expect(title(el)).toBe('April 2026');
  });

  it('selects with Enter, Space and click and fires punica-change', async () => {
    const el = await fixture(html);
    el.focus();
    key(el.shadowRoot.activeElement, 'ArrowRight');
    const changed = once(el, 'punica-change');
    key(el.shadowRoot.activeElement, 'Enter');
    expect((await changed).detail).toEqual({ value: '2026-03-16' });
    expect(el.value).toBe('2026-03-16');
    expect(cell(el, '2026-03-16').getAttribute('aria-selected')).toBe('true');
    expect(cell(el, '2026-03-15').hasAttribute('aria-selected')).toBe(false);
    const again = once(el, 'punica-change');
    cell(el, '2026-03-20').click();
    expect((await again).detail.value).toBe('2026-03-20');
    key(cell(el, '2026-03-21'), ' ');
    expect(el.value).toBe('2026-03-21');
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    const selected = once(el, 'punica-select');
    cell(el, '2026-03-21').click();
    expect((await selected).detail.value).toBe('2026-03-21');
    el.value = '2026-05-05';
    await settle();
    expect(changes).toBe(0);
    expect(title(el)).toBe('May 2026');
  });

  it('navigates months and years with named buttons', async () => {
    const el = await fixture(html);
    const navs = [...el.shadowRoot.querySelectorAll('.nav')];
    expect(navs.map((n) => n.getAttribute('aria-label'))).toEqual(['Previous year', 'Previous month', 'Next month', 'Next year']);
    navs[2].click();
    expect(title(el)).toBe('April 2026');
    navs[1].click();
    navs[1].click();
    expect(title(el)).toBe('February 2026');
    navs[3].click();
    expect(title(el)).toBe('February 2027');
    navs[0].click();
    expect(title(el)).toBe('February 2026');
    el.labelNextMonth = 'Sonraki ay';
    await settle();
    expect(navs[2].getAttribute('aria-label')).toBe('Sonraki ay');
  });

  it('holds min, max and disabledDates', async () => {
    const el = await fixture('<punica-calendar lang="en-GB" value="2026-03-15" min="2026-03-10" max="2026-03-20"></punica-calendar>');
    el.disabledDates = (iso) => iso === '2026-03-12';
    await settle();
    expect(cell(el, '2026-03-09').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2026-03-12').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2026-03-13').hasAttribute('aria-disabled')).toBe(false);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    cell(el, '2026-03-09').click();
    cell(el, '2026-03-12').click();
    expect(changes).toBe(0);
    expect(el.value).toBe('2026-03-15');
    el.focus();
    key(el.shadowRoot.activeElement, 'PageDown');
    expect(focused(el)).toBe('2026-03-20');
    key(el.shadowRoot.activeElement, 'PageUp', { shiftKey: true });
    expect(focused(el)).toBe('2026-03-10');
  });

  it('picks a range in two steps', async () => {
    const el = await fixture('<punica-calendar lang="en-GB" range value-start="2026-03-03" value-end="2026-03-05"></punica-calendar>');
    expect(cell(el, '2026-03-04').classList.contains('in-range')).toBe(true);
    const first = once(el, 'punica-input');
    cell(el, '2026-03-20').click();
    expect((await first).detail).toEqual({ value: '2026-03-20', valueStart: '2026-03-20', valueEnd: null });
    expect(el.valueEnd).toBe(null);
    const done = once(el, 'punica-change');
    cell(el, '2026-03-10').click();
    expect((await done).detail).toEqual({ value: '2026-03-10/2026-03-20', valueStart: '2026-03-10', valueEnd: '2026-03-20' });
    expect(el.valueStart).toBe('2026-03-10');
    expect(el.valueEnd).toBe('2026-03-20');
    expect(cell(el, '2026-03-15').classList.contains('in-range')).toBe(true);
    expect(cell(el, '2026-03-10').classList.contains('range-start')).toBe(true);
    expect(cell(el, '2026-03-20').classList.contains('range-end')).toBe(true);
    expect(cell(el, '2026-03-21').classList.contains('in-range')).toBe(false);
  });

  it('mirrors the arrow keys in a right-to-left page', async () => {
    const wrap = await fixture(`<div dir="rtl">${html}</div>`);
    const el = wrap.firstElementChild;
    el.focus();
    key(el.shadowRoot.activeElement, 'ArrowLeft');
    expect(focused(el)).toBe('2026-03-16');
  });
});
