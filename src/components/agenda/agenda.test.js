import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './agenda.js';

const tag = (attrs = '') =>
  `<punica-agenda label="Team calendar" date="2026-03-12" locale="en-US" style="height:600px" ${attrs}></punica-agenda>`;
const html = tag('view="month"');

const at = (y, m, d, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm);
const sample = () => [
  { id: 'standup', title: 'Standup', start: at(2026, 3, 12, 9), end: at(2026, 3, 12, 9, 30), color: 'success' },
  { id: 'review', title: 'Design review', start: at(2026, 3, 12, 9, 15), end: at(2026, 3, 12, 11) },
  { id: 'lunch', title: 'Lunch', start: at(2026, 3, 12, 12), end: at(2026, 3, 12, 13), color: 'warning' },
  { id: 'demo', title: 'Demo', start: at(2026, 3, 12, 15), end: at(2026, 3, 12, 16) },
  { id: 'retro', title: 'Retro', start: at(2026, 3, 12, 16), end: at(2026, 3, 12, 17) },
  { id: 'trip', title: 'Offsite', start: at(2026, 3, 17, 10), end: at(2026, 3, 18, 15), color: 'info' }
];

const q = (el, s) => el.shadowRoot.querySelector(s);
const qa = (el, s) => [...el.shadowRoot.querySelectorAll(s)];
const cell = (el, iso) => {
  const day = Math.round(Date.parse(iso + 'T00:00:00Z') / 864e5);
  return q(el, `[data-day="${day}"]`);
};
const label = (dayCell) => dayCell.querySelector('.day-label').textContent;
const active = (el) => el.shadowRoot.activeElement;
const key = (target, k) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));
const title = (el) => q(el, '.title').textContent;
const button = (el, s) => q(el, `.toolbar button${s}`);

async function make(attrs = 'view="month"', events = sample()) {
  const el = await fixture(tag(attrs));
  el.events = events;
  await settle();
  return el;
}

contract('punica-agenda', {
  html,
  open: (el) => {
    el.events = sample();
  }
});

describe('punica-agenda', () => {
  afterEach(cleanup);

  for (const view of ['day', 'week', 'month', 'year']) {
    it(`has no axe violations in the ${view} view with events`, async () => {
      const el = await make(`view="${view}"`);
      expect(qa(el, '[role=gridcell][data-day]').length).toBeGreaterThan(0);
      expect(await a11y(el.parentElement)).toEqual([]);
    });
  }

  it('renders event text as text in every view, never as markup', async () => {
    const evil = '<img src=x onerror=window.__xss=1>';
    const el = await make('view="day"', [{ id: evil, title: evil, start: at(2026, 3, 12, 9), end: at(2026, 3, 12, 10), color: evil }]);
    for (const view of ['day', 'week', 'month', 'year']) {
      el.view = view;
      await settle();
      expect(q(el, 'img'), view).toBe(null);
      if (view !== 'year') {
        const event = q(el, 'button[data-index]');
        expect(event.querySelector('.event-title').textContent).toBe(evil);
        expect(PALETTE.includes(event.dataset.color)).toBe(true);
      }
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(window.__xss).toBeUndefined();
  });
  const PALETTE = ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'neutral'];

  it('draws the month as a grid of days with events as named buttons', async () => {
    const el = await make();
    const grid = q(el, '[role=grid]');
    expect(grid.getAttribute('aria-label')).toBe('March 2026');
    expect(title(el)).toBe('March 2026');
    expect(qa(el, '[role=columnheader]').map((c) => c.textContent)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(qa(el, '[role=columnheader]')[0].getAttribute('aria-label')).toBe('Sunday');
    expect(qa(el, '[role=gridcell][data-day]').length).toBe(31);
    for (const row of qa(el, '[role=row]')) expect(row.children.length).toBe(7);
    const day = cell(el, '2026-03-12');
    expect(label(day)).toBe('Thursday, March 12, 2026, 5 events');
    expect(day.hasAttribute('aria-label')).toBe(false);
    expect(day.querySelector('.day-number').textContent).toBe('12');
    const events = [...day.querySelectorAll('button[data-index]')];
    expect(events.map((b) => b.querySelector('.event-title').textContent)).toEqual(['Standup', 'Design review', 'Lunch']);
    expect(events[0].tagName).toBe('BUTTON');
    // the button's name is its own text: title, then date, start and end
    expect(events[0].hasAttribute('aria-label')).toBe(false);
    expect(events[0].textContent).toMatch(/^StandupMar 12, 2026, 9:00\s*[–-]\s*9:30\sAM$/);
    expect(events[0].dataset.color).toBe('success');
    expect(day.querySelector('.more-events').textContent).toBe('+2 more');
    // a two-day event is on both of its days
    expect(cell(el, '2026-03-17').textContent).toContain('Offsite');
    expect(cell(el, '2026-03-18').textContent).toContain('Offsite');
    expect(cell(el, '2026-03-19').querySelector('button')).toBe(null);
    // one tab stop
    expect(qa(el, '[role=gridcell][tabindex="0"]')).toEqual([day]);
  });

  it('takes every colour from the palette tokens', async () => {
    const el = await make();
    const event = cell(el, '2026-03-12').querySelector('button[data-color=success]');
    const probe = document.createElement('div');
    probe.style.color = 'var(--punica-color-success)';
    document.body.appendChild(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    expect(getComputedStyle(event.querySelector('.event-dot')).backgroundColor).toBe(token);
  });

  it('places day events by time, side by side when they overlap, and clips to the hour range', async () => {
    const el = await make('view="day" start-hour="10" end-hour="18"');
    const column = cell(el, '2026-03-12');
    const hours = qa(el, '.hours .hour');
    expect(hours.length).toBe(8);
    expect(hours[0].textContent.replace(/\s/g, '')).toBe('10:00AM');
    const events = [...column.querySelectorAll('.event')];
    // Standup (9:00-9:30) is outside the range; the review is cut at 10.
    expect(events.map((e) => e.querySelector('.event-title').textContent)).toEqual(['Design review', 'Lunch', 'Demo', 'Retro']);
    expect(events[0].classList.contains('clipped-start')).toBe(true);
    const top = column.getBoundingClientRect().top;
    const rect = (e) => e.getBoundingClientRect();
    const hour = rect(hours[0]).height;
    expect(Math.round(rect(events[1]).top - top)).toBe(Math.round(2 * hour + 2));
    expect(Math.round(rect(events[1]).height)).toBe(Math.round(hour - 4));
    expect(events[1].querySelector('.event-time').textContent).toMatch(/12:00\s*[–-]\s*1:00\sPM/);

    el.startHour = 0;
    el.endHour = 24;
    await settle();
    const [standup, review] = [...cell(el, '2026-03-12').querySelectorAll('.event')];
    expect(rect(standup).right).toBeLessThanOrEqual(rect(review).left + 1);
    expect(Math.round(rect(standup).width)).toBe(Math.round(rect(review).width));
  });

  it('draws the week with a header per day and one column per day', async () => {
    const el = await make('view="week"');
    expect(title(el)).toMatch(/^March 8\s*[–-]\s*14, 2026$/);
    const headers = qa(el, '[role=columnheader]');
    expect(headers.map((c) => c.textContent)).toEqual(['Sun8', 'Mon9', 'Tue10', 'Wed11', 'Thu12', 'Fri13', 'Sat14']);
    expect(headers[4].getAttribute('aria-label')).toBe('Thursday, March 12, 2026');
    expect(qa(el, '[role=gridcell]').length).toBe(7);
    expect(cell(el, '2026-03-12').querySelectorAll('button.event').length).toBe(5);
    expect(el.range).toEqual({ start: '2026-03-08', end: '2026-03-14' });
  });

  it('puts whole-day and multi-day events in a lane above the hours of the week', async () => {
    const el = await make('view="week"', [
      { id: 'conf', title: 'Conference', start: '2026-03-16', end: '2026-03-19' },
      { id: 'trip', title: 'Offsite', start: at(2026, 3, 17, 10), end: at(2026, 3, 18, 15) },
      { id: 'standup', title: 'Standup', start: at(2026, 3, 17, 9, 30), end: at(2026, 3, 17, 9, 45) },
      { id: 'review', title: 'Review', start: at(2026, 3, 17, 9, 30), end: at(2026, 3, 17, 10) }
    ]);
    el.date = '2026-03-17';
    await settle();
    const tue = cell(el, '2026-03-17');
    const lane = [...tue.querySelectorAll('.event.all-day')].map((e) => e.querySelector('.event-title').textContent);
    expect(lane).toEqual(['Conference', 'Offsite']);
    expect(cell(el, '2026-03-18').querySelectorAll('.event.all-day').length).toBe(2);
    expect(cell(el, '2026-03-19').querySelector('.event')).toBe(null);
    // A day with no all-day event keeps the room, so the hours line up.
    const rect = (e) => e.getBoundingClientRect();
    const [standup, review] = [...tue.querySelectorAll('.event:not(.all-day)')];
    expect(rect(standup).width).toBeGreaterThan(rect(tue).width / 2 - 8);
    expect(rect(review).width).toBeGreaterThan(rect(tue).width / 2 - 8);
    const nine = qa(el, '.hours .hour')[9];
    expect(Math.abs(rect(standup).top - (rect(nine).top + rect(nine).height / 2 + 2))).toBeLessThanOrEqual(1);
    // A quarter of an hour is drawn tall enough for its title.
    expect(rect(standup).height).toBeGreaterThanOrEqual(rect(nine).height / 2 - 4);
    expect(tue.querySelector('.day-label').textContent).toContain('4 events');
  });

  it('labels each week hour at its line and keeps the day headers in view', async () => {
    const el = await make('view="week"');
    const rect = (e) => e.getBoundingClientRect();
    const hours = qa(el, '.hours .hour');
    const content = q(el, '[part=content]');
    const column = cell(el, '2026-03-12');
    // The label of 10:00 sits just under the line where 10:00 starts.
    const ten = hours[10];
    const line = rect(column).top + (rect(ten).top - rect(hours[0]).top);
    expect(rect(ten.querySelector('.clock-text')).top - line).toBeLessThan(rect(ten).height / 3);
    content.scrollTop = 600;
    await new Promise((r) => requestAnimationFrame(r));
    const header = q(el, '.week-header');
    expect(Math.round(rect(header).top)).toBe(Math.round(rect(content).top));
  });

  it('opens a timed view scrolled to its first event', async () => {
    const el = await fixture(tag('view="day"').replace('height:600px', 'height:400px'));
    el.events = sample();
    await settle();
    const content = q(el, '[part=content]');
    const standup = cell(el, '2026-03-12').querySelector('.event');
    const top = standup.getBoundingClientRect().top - content.getBoundingClientRect().top;
    expect(content.scrollTop).toBeGreaterThan(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(40);
  });

  it('fits a month into a narrow agenda: whole day numbers, events as named dots', async () => {
    const el = await fixture(tag('view="month"').replace('style="height:600px"', 'style="height:600px;width:300px;overflow-wrap:anywhere"'));
    el.events = sample();
    await settle();
    const day = cell(el, '2026-03-12');
    const number = day.querySelector('.day-number');
    expect(number.getBoundingClientRect().height).toBeLessThan(30);
    const event = day.querySelector('.month-event');
    expect(event.getBoundingClientRect().right).toBeLessThanOrEqual(day.getBoundingClientRect().right);
    expect(event.textContent).toContain('Standup');
    expect(q(el, '[part=content]').scrollWidth).toBeLessThanOrEqual(q(el, '[part=content]').clientWidth);
    el.locale = 'ar-EG';
    el.view = 'week';
    await settle();
    for (const header of qa(el, '.week-header .day-header')) {
      const name = header.querySelector('.day-name').getBoundingClientRect();
      const box = header.getBoundingClientRect();
      expect(name.left).toBeGreaterThanOrEqual(box.left - 0.5);
      expect(name.right).toBeLessThanOrEqual(box.right + 0.5);
    }
  });

  it('writes the pressed view button in the text colour, which keeps its contrast in both themes', async () => {
    const el = await make('view="week"');
    const pressed = q(el, '.toolbar button[aria-pressed="true"]');
    expect(pressed.dataset.view).toBe('week');
    expect(getComputedStyle(pressed).color).toBe(getComputedStyle(q(el, '.title')).color);
  });

  it('writes month, weekday and time text in the locale', async () => {
    const el = await make();
    el.locale = 'tr';
    await settle();
    expect(title(el)).toBe('Mart 2026');
    expect(qa(el, '[role=columnheader]').map((c) => c.textContent)).toEqual(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']);
    expect(label(cell(el, '2026-03-12'))).toContain('12 Mart 2026 Perşembe');
    expect(button(el, '[data-view=week]').textContent).toBe('Hafta');
    expect(button(el, '[data-today]').textContent).toBe('Bugün');
    expect(cell(el, '2026-03-12').querySelector('button .event-when').textContent).toMatch(/^12 Mar 2026 09:00\s*[–-]\s*09:30$/);

    el.view = 'week';
    await settle();
    expect(title(el)).toMatch(/^9\s*[–-]\s*15 Mart 2026$/);
    expect(q(el, '.hours .hour').textContent).toBe('00:00');

    el.locale = 'ar';
    el.view = 'month';
    await settle();
    expect(title(el)).toContain('مارس');
    expect(title(el)).not.toContain('March');
    const names = qa(el, '[role=columnheader]').map((c) => c.getAttribute('aria-label'));
    expect(names).toContain('الخميس');
    expect(new Set(names).size).toBe(7);
    // Gregorian in every locale, so the grid and its labels agree.
    el.locale = 'ar-SA';
    await settle();
    expect(qa(el, '[role=gridcell][data-day]').length).toBe(31);
    expect(title(el)).toContain('مارس');

    el.locale = 'not a locale';
    await settle();
    expect(title(el)).toBe('March 2026');
  });

  it('falls back to the nearest lang, and the labels can be overridden', async () => {
    const wrap = await fixture('<div lang="de"><punica-agenda view="month" date="2026-03-12" label-today="Jetzt" label-month="Monatsblick" label-previous="Zurück"></punica-agenda></div>');
    const el = wrap.firstElementChild;
    expect(title(el)).toBe('März 2026');
    expect(button(el, '[data-today]').textContent).toBe('Jetzt');
    expect(button(el, '[data-view=month]').textContent).toBe('Monatsblick');
    expect(button(el, '[data-view=week]').textContent).toBe('Woche');
    expect(button(el, '[data-step="-1"]').getAttribute('aria-label')).toBe('Zurück');
    expect(button(el, '[data-step="1"]').getAttribute('aria-label')).toBe('Next');
  });

  it('starts the week where the locale does, unless first-day-of-week says otherwise', async () => {
    const el = await make('view="week"');
    expect(el.range.start).toBe('2026-03-08'); // en-US: Sunday
    el.locale = 'en-GB';
    await settle();
    expect(el.range.start).toBe('2026-03-09'); // Monday
    el.firstDayOfWeek = 3;
    await settle();
    expect(el.range).toEqual({ start: '2026-03-11', end: '2026-03-17' });
    expect(qa(el, '[role=columnheader]')[0].textContent).toBe('Wed11');
    el.view = 'month';
    await settle();
    expect(qa(el, '[role=columnheader]')[0].textContent).toBe('Wed');
    expect(qa(el, '.month-row')[0].children[4].dataset.day).toBe(cell(el, '2026-03-01').dataset.day);
  });

  it('keeps dates on their day across daylight-saving changes', async () => {
    // 2026-03-08 (US), 2026-03-29 (EU), 2026-10-25 (EU), 2026-11-01 (US)
    for (const change of ['2026-03-08', '2026-03-29', '2026-10-25', '2026-11-01']) {
      const [y, m, d] = change.split('-').map(Number);
      const el = await fixture(tag(`view="day" date="${change}"`).replace('date="2026-03-12" ', ''));
      el.events = [
        { title: 'Early', start: at(y, m, d, 0, 30), end: at(y, m, d, 1) },
        { title: 'Late', start: at(y, m, d, 23), end: at(y, m, d, 23, 59) },
        { title: 'Whole day', start: change }
      ];
      await settle();
      expect(cell(el, change).querySelectorAll('button').length, change).toBe(3);
      const late = cell(el, change).querySelectorAll('.event')[2];
      expect(cell(el, change).querySelectorAll('.event')[0].classList.contains('all-day')).toBe(true);
      const midnight = q(el, '.hours .hour').getBoundingClientRect();
      // 23:00 sits 23 hours down whatever the day's real length was
      expect(Math.round(late.getBoundingClientRect().top - midnight.top)).toBe(23 * 120 + 2);

      const days = [];
      el.navigate(-1);
      el.navigate(-1);
      for (let i = 0; i < 5; i++) {
        days.push(el.date);
        el.navigate(1);
      }
      const expected = [-2, -1, 0, 1, 2].map((o) => new Date(Date.UTC(y, m - 1, d + o)).toISOString().slice(0, 10));
      expect(days).toEqual(expected);

      el.date = change;
      el.view = 'week';
      await settle();
      const week = qa(el, '[role=gridcell]').map((c) => Number(c.dataset.day));
      expect(week.length).toBe(7);
      expect(week.every((n, i) => i === 0 || n === week[i - 1] + 1)).toBe(true);
      expect(cell(el, change).querySelectorAll('button').length, `${change} week`).toBe(3);
      const before = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
      const after = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
      for (const other of [before, after]) expect(cell(el, other)?.querySelector('button') ?? null).toBe(null);

      el.view = 'month';
      await settle();
      const month = qa(el, '[role=gridcell][data-day]');
      expect(month.length).toBe(new Date(Date.UTC(y, m, 0)).getUTCDate());
      expect(month.map((c) => c.querySelector('.day-number').textContent)).toEqual(month.map((_, i) => String(i + 1)));
      expect(month.filter((c) => c.querySelector('button')).map((c) => c.dataset.day)).toEqual([cell(el, change).dataset.day]);
      cleanup();
    }
  });

  it('clamps month steps and reads date-only and midnight ends on the right day', async () => {
    const el = await make('view="month"', [
      { title: 'Until midnight', start: at(2026, 3, 30, 22), end: at(2026, 3, 31, 0) },
      { title: 'All of the 5th', start: '2026-03-05' }
    ]);
    el.date = '2026-01-31';
    el.navigate(1);
    expect(el.date).toBe('2026-02-28');
    el.date = '2026-03-12';
    await settle();
    expect(cell(el, '2026-03-30').textContent).toContain('Until midnight');
    expect(cell(el, '2026-03-31').querySelector('button')).toBe(null);
    expect(cell(el, '2026-03-05').textContent).toContain('All of the 5th');
    expect(cell(el, '2026-03-04').querySelector('button')).toBe(null);
  });

  it('fires punica-select with the event id and the event object', async () => {
    const events = sample();
    const el = await make('view="week"', events);
    const picked = once(el, 'punica-select');
    cell(el, '2026-03-12').querySelectorAll('button')[2].click();
    const { detail } = await picked;
    expect(detail.value).toBe('lunch');
    expect(detail.item).toBe(events[2]);
    el.events = [{ title: 'No id', start: at(2026, 3, 12, 9) }];
    await settle();
    const second = once(el, 'punica-select');
    cell(el, '2026-03-12').querySelector('button').click();
    expect((await second).detail.value).toBe(0);
  });

  it('navigates and switches view from native buttons, firing punica-change', async () => {
    const el = await make();
    const changes = [];
    el.addEventListener('punica-change', (e) => changes.push(e.detail));
    for (const b of qa(el, '.toolbar button')) {
      expect(b.tagName).toBe('BUTTON');
      expect(b.type).toBe('button');
      expect((b.getAttribute('aria-label') || b.textContent).length).toBeGreaterThan(0);
    }
    expect(button(el, '[data-step="1"]').getAttribute('aria-label')).toBe('Next');
    expect(button(el, '[data-view=month]').getAttribute('aria-pressed')).toBe('true');
    button(el, '[data-step="1"]').click();
    expect(title(el)).toBe('April 2026');
    button(el, '[data-step="-1"]').click();
    button(el, '[data-step="-1"]').click();
    expect(el.date).toBe('2026-02-12');
    button(el, '[data-view=week]').click();
    expect(el.view).toBe('week');
    expect(button(el, '[data-view=week]').getAttribute('aria-pressed')).toBe('true');
    expect(button(el, '[data-view=month]').getAttribute('aria-pressed')).toBe('false');
    expect(changes).toEqual([
      { view: 'month', date: '2026-04-12' },
      { view: 'month', date: '2026-03-12' },
      { view: 'month', date: '2026-02-12' },
      { view: 'week', date: '2026-02-12' }
    ]);
    button(el, '[data-today]').click();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(changes.at(-1)).toEqual({ view: 'week', date: today });
    expect(el.matches(':state(today)')).toBe(true);
    expect(q(el, '.day-header.today')).not.toBe(null);
    // already there: nothing to announce
    const count = changes.length;
    button(el, '[data-today]').click();
    expect(changes.length).toBe(count);
  });

  it('fires nothing for programmatic changes', async () => {
    const el = await make();
    let fired = 0;
    for (const type of ['punica-change', 'punica-select']) el.addEventListener(type, () => fired++);
    el.navigate(1);
    el.view = 'year';
    el.date = '2027-01-01';
    el.today();
    el.addEvent({ title: 'New', start: new Date() });
    await settle();
    expect(fired).toBe(0);
    expect(el.events.length).toBe(7);
    expect(q(el, '.year-day.today.has-events')).not.toBe(null);
  });

  it('moves between days with the arrow keys, Home, End and the page keys', async () => {
    const el = await make();
    const changes = [];
    el.addEventListener('punica-change', (e) => changes.push(e.detail));
    el.focus();
    expect(active(el)).toBe(cell(el, '2026-03-12'));
    key(active(el), 'ArrowRight');
    expect(active(el)).toBe(cell(el, '2026-03-13'));
    key(active(el), 'ArrowDown');
    expect(active(el)).toBe(cell(el, '2026-03-20'));
    key(active(el), 'ArrowLeft');
    key(active(el), 'ArrowUp');
    expect(active(el)).toBe(cell(el, '2026-03-12'));
    key(active(el), 'Home');
    expect(active(el)).toBe(cell(el, '2026-03-08'));
    key(active(el), 'End');
    expect(active(el)).toBe(cell(el, '2026-03-14'));
    expect(qa(el, '[role=gridcell][tabindex="0"]')).toEqual([active(el)]);
    expect(changes).toEqual([]);
    expect(el.date).toBe('2026-03-12');

    key(active(el), 'PageDown');
    expect(title(el)).toBe('April 2026');
    expect(active(el)).toBe(cell(el, '2026-04-14'));
    key(active(el), 'PageUp');
    key(active(el), 'PageUp');
    expect(active(el)).toBe(cell(el, '2026-02-14'));
    // an arrow past the edge of the month carries on into the next
    key(cell(el, '2026-02-28'), 'ArrowRight');
    expect(title(el)).toBe('March 2026');
    expect(active(el)).toBe(cell(el, '2026-03-01'));
    expect(changes).toEqual([
      { view: 'month', date: '2026-04-14' },
      { view: 'month', date: '2026-03-14' },
      { view: 'month', date: '2026-02-14' },
      { view: 'month', date: '2026-03-01' }
    ]);
  });

  it('mirrors the horizontal arrows in a right-to-left page', async () => {
    const wrap = await fixture(`<div dir="rtl">${html}</div>`);
    const el = wrap.firstElementChild;
    el.focus();
    key(active(el), 'ArrowLeft');
    expect(active(el)).toBe(cell(el, '2026-03-13'));
    const a = cell(el, '2026-03-12').getBoundingClientRect();
    const b = cell(el, '2026-03-13').getBoundingClientRect();
    expect(b.left).toBeLessThan(a.left);
  });

  it('steps into the events of a day with Enter, opens one with Enter, and back out with Escape', async () => {
    const el = await make();
    el.focus();
    const day = active(el);
    const buttons = [...day.querySelectorAll('button')];
    key(day, 'Enter');
    expect(active(el)).toBe(buttons[0]);
    key(active(el), 'ArrowDown');
    expect(active(el)).toBe(buttons[1]);
    key(active(el), 'End');
    expect(active(el)).toBe(buttons.at(-1));
    key(active(el), 'Home');
    key(active(el), 'ArrowDown');
    // Enter on a native button is a click.
    const picked = once(el, 'punica-select');
    active(el).click();
    expect((await picked).detail.value).toBe('review');
    key(active(el), 'Escape');
    expect(active(el)).toBe(day);
    key(day, 'Enter');
    key(active(el), 'ArrowUp');
    expect(active(el)).toBe(day);
  });

  it('walks the week view: days sideways, events downwards, weeks by page', async () => {
    const el = await make('view="week"');
    el.focus();
    const day = cell(el, '2026-03-12');
    expect(active(el)).toBe(day);
    key(day, 'ArrowDown');
    expect(active(el)).toBe(day.querySelector('button'));
    key(active(el), 'ArrowRight');
    expect(active(el)).toBe(cell(el, '2026-03-13'));
    key(active(el), 'End');
    expect(active(el)).toBe(cell(el, '2026-03-14'));
    const moved = once(el, 'punica-change');
    key(active(el), 'ArrowRight');
    expect((await moved).detail).toEqual({ view: 'week', date: '2026-03-15' });
    expect(active(el)).toBe(cell(el, '2026-03-15'));
    key(active(el), 'PageUp');
    expect(active(el)).toBe(cell(el, '2026-03-08'));
    el.view = 'day';
    await settle();
    key(cell(el, '2026-03-08'), 'ArrowRight');
    expect(el.date).toBe('2026-03-09');
    expect(active(el)).toBe(cell(el, '2026-03-09'));
  });

  it('shows hidden month events and year days by opening the day view', async () => {
    const el = await make();
    const more = cell(el, '2026-03-12').querySelector('.more-events');
    expect(more.tagName).toBe('BUTTON');
    let changed = once(el, 'punica-change');
    more.click();
    expect((await changed).detail).toEqual({ view: 'day', date: '2026-03-12' });
    expect(cell(el, '2026-03-12').querySelectorAll('.event').length).toBe(5);

    el.view = 'year';
    await settle();
    expect(title(el)).toBe('2026');
    expect(qa(el, '[role=grid]').length).toBe(12);
    expect(qa(el, '[role=grid]')[2].getAttribute('aria-label')).toBe('March 2026');
    expect(qa(el, '[role=gridcell][data-day]').length).toBe(365);
    expect(qa(el, '.year-day.has-events').length).toBe(3);
    expect(label(cell(el, '2026-03-17'))).toBe('Tuesday, March 17, 2026, 1 events');
    el.focus();
    key(active(el), 'ArrowDown');
    expect(active(el)).toBe(cell(el, '2026-03-19'));
    changed = once(el, 'punica-change');
    key(active(el), 'Enter');
    expect((await changed).detail).toEqual({ view: 'day', date: '2026-03-19' });
    expect(active(el)).toBe(cell(el, '2026-03-19'));
  });

  it('redraws only the day whose events changed', async () => {
    const el = await make();
    const grid = q(el, '[role=grid]');
    const untouched = cell(el, '2026-03-12').querySelector('button');
    const target = cell(el, '2026-03-20');
    target.focus();
    el.addEvent({ id: 'new', title: 'Added', start: at(2026, 3, 20, 9), end: at(2026, 3, 20, 10) });
    await settle();
    expect(q(el, '[role=grid]')).toBe(grid);
    expect(cell(el, '2026-03-20')).toBe(target);
    expect(active(el)).toBe(target);
    expect(target.textContent).toContain('Added');
    expect(label(target)).toContain('1 events');
    expect(cell(el, '2026-03-12').querySelector('button')).toBe(untouched);
    el.labelEvents = '{count} etkinlik';
    el.labelMore = '{count} daha';
    await settle();
    expect(label(cell(el, '2026-03-12'))).toContain('5 etkinlik');
    expect(cell(el, '2026-03-12').querySelector('.more-events').textContent).toBe('2 daha');
  });

  it('hides the toolbar with no-toolbar and ignores events it cannot date', async () => {
    const el = await make('view="month" no-toolbar', [{ title: 'Bad', start: 'nonsense' }, null, { title: 'Good', start: at(2026, 3, 12, 9) }]);
    expect(getComputedStyle(q(el, '.toolbar')).display).toBe('none');
    expect(qa(el, 'button[data-index] .event-title').map((b) => b.textContent)).toEqual(['Good']);
  });
});
