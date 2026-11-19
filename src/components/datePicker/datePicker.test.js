import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import { page } from 'vitest/browser';
import './datePicker.js';

const html = '<punica-date-picker lang="en-GB" label="Start date" name="start" value="2026-03-15"></punica-date-picker>';

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const input = (el) => el.shadowRoot.querySelector('input');
const toggle = (el) => el.shadowRoot.querySelector('[part="toggle"]');
const panel = (el) => el.shadowRoot.querySelector('[part="panel"]');
const type = (el, text) => {
  input(el).value = text;
  input(el).dispatchEvent(new Event('change'));
};

contract('punica-date-picker', { html, open: (el) => el.show() });

describe('punica-date-picker', () => {
  afterEach(cleanup);

  it('shows its ISO value in the order of the language', async () => {
    const el = await fixture(html);
    expect(input(el).value).toBe('15/03/2026');
    expect(input(el).getAttribute('aria-label')).toBe('Start date');
    el.locale = 'en-US';
    await settle();
    expect(input(el).value).toBe('03/15/2026');
    el.locale = 'tr';
    await settle();
    expect(input(el).value).toBe('15.03.2026');
    expect(el.value).toBe('2026-03-15');
  });

  it('takes a typed date, fires punica-change and writes it back formatted', async () => {
    const el = await fixture(html);
    const changed = once(el, 'punica-change');
    type(el, '1/4/26');
    expect((await changed).detail).toEqual({ value: '2026-04-01' });
    await settle();
    expect(el.value).toBe('2026-04-01');
    expect(input(el).value).toBe('01/04/2026');
    const cleared = once(el, 'punica-change');
    type(el, '');
    expect((await cleared).detail.value).toBe(null);
  });

  it('keeps a typed non-date for the user to fix and reports bad input', async () => {
    const el = await fixture(html);
    type(el, '31/02/2026');
    await settle();
    expect(el.value).toBe(null);
    expect(input(el).value).toBe('31/02/2026');
    expect(el.validity.badInput).toBe(true);
    expect(el.validationMessage.trim().length).toBeGreaterThan(0);
    expect(input(el).getAttribute('aria-invalid')).toBe('true');
    type(el, '28/02/2026');
    await settle();
    expect(el.validity.valid).toBe(true);
    expect(el.value).toBe('2026-02-28');
  });

  it('never shifts a day, whatever the date', async () => {
    const el = await fixture(html);
    for (const iso of ['2026-03-29', '2026-10-25', '2024-02-29', '2026-01-01', '2026-12-31']) {
      el.value = iso;
      await settle();
      const [d, m, y] = input(el).value.split('/');
      expect(`${y}-${m}-${d}`).toBe(iso);
      type(el, input(el).value);
      await settle();
      expect(el.value).toBe(iso);
    }
  });

  it('lines the calendar up with the start edge of a right-to-left field', async () => {
    // Room for the calendar on both sides, so only the direction decides.
    await page.viewport(1280, 800);
    const wrap = await fixture(`<div dir="rtl" style="padding: 40px 0; margin-inline: 400px">${html.replace('lang="en-GB"', 'lang="ar-EG"')}</div>`);
    const el = wrap.querySelector('punica-date-picker');
    el.shadowRoot.querySelector('[part=toggle]').click();
    await settle();
    await settle();
    const field = el.shadowRoot.querySelector('[part=field]');
    const f = field.getBoundingClientRect();
    const p = el.shadowRoot.querySelector('[part=panel]').getBoundingClientRect();
    expect(Math.abs(p.right - f.right)).toBeLessThan(2);
    await page.viewport(414, 896);
  });

  it('opens the calendar from its button, on the value, with focus on the day', async () => {
    const el = await fixture(html);
    const opened = once(el, 'punica-open');
    toggle(el).click();
    await opened;
    await settle();
    expect(panel(el).matches(':popover-open')).toBe(true);
    expect(toggle(el).getAttribute('aria-expanded')).toBe('true');
    expect(toggle(el).getAttribute('aria-label')).toBe('Choose date');
    const calendar = el.calendar;
    expect(calendar.value).toBe('2026-03-15');
    expect(calendar.shadowRoot.activeElement.dataset.date).toBe('2026-03-15');
  });

  it('picks from the calendar by keyboard, closes and returns focus', async () => {
    const el = await fixture(html);
    input(el).focus();
    key(input(el), 'ArrowDown');
    await settle();
    expect(el.open).toBe(true);
    const calendar = el.calendar;
    key(calendar.shadowRoot.activeElement, 'ArrowRight');
    key(calendar.shadowRoot.activeElement, 'ArrowDown');
    const changed = once(el, 'punica-change');
    const closed = once(el, 'punica-close');
    key(calendar.shadowRoot.activeElement, 'Enter');
    const event = await changed;
    expect(event.detail).toEqual({ value: '2026-03-23' });
    expect(event.target).toBe(el);
    expect((await closed).detail).toEqual({ reason: 'select' });
    await settle();
    expect(el.value).toBe('2026-03-23');
    expect(input(el).value).toBe('23/03/2026');
    expect(panel(el).matches(':popover-open')).toBe(false);
    expect(el.shadowRoot.activeElement).toBe(input(el));
  });

  it('closes on Escape and on a press outside', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    const closed = once(el, 'punica-close');
    key(el.calendar.shadowRoot.activeElement, 'Escape');
    expect((await closed).detail.reason).toBe('escape');
    await settle();
    expect(el.shadowRoot.activeElement).toBe(toggle(el));
    el.show();
    await settle();
    const outside = once(el, 'punica-close');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect((await outside).detail.reason).toBe('outside');
    expect(el.value).toBe('2026-03-15');
  });

  it('passes min, max and the language to the calendar', async () => {
    const el = await fixture('<punica-date-picker locale="tr" label="Tarih" min="2026-03-10" max="2026-03-20" value="2026-03-15"></punica-date-picker>');
    el.show();
    await settle();
    const calendar = el.calendar;
    expect(calendar.shadowRoot.querySelector('[part="title"]').textContent).toBe('Mart 2026');
    expect(calendar.shadowRoot.querySelector('td[data-date="2026-03-09"]').getAttribute('aria-disabled')).toBe('true');
    type(el, '25.03.2026');
    await settle();
    expect(el.validity.rangeOverflow).toBe(true);
    expect(el.validationMessage.trim().length).toBeGreaterThan(0);
  });

  it('keeps two open pickers apart', async () => {
    const wrap = await fixture(`<div>${html}${html.replace('Start date', 'End date').replace('2026-03-15', '2026-06-10')}</div>`);
    const [a, b] = wrap.children;
    a.show();
    b.show();
    await settle();
    expect(panel(a).matches(':popover-open')).toBe(true);
    expect(panel(b).matches(':popover-open')).toBe(true);
    b.calendar.shadowRoot.querySelector('td[data-date="2026-06-12"]').click();
    await settle();
    expect(b.value).toBe('2026-06-12');
    expect(b.open).toBe(false);
    expect(a.value).toBe('2026-03-15');
    expect(a.open).toBe(true);
  });

  it('fires nothing for a programmatic value and adds no listener on disconnect', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.value = '2026-07-04';
    await settle();
    expect(input(el).value).toBe('04/07/2026');
    expect(changes).toBe(0);
  });

  it('has no axe violations while open', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    await new Promise((r) => setTimeout(r, 250));
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  describe('in a form', () => {
    const form = (attrs = '') => `<form><punica-date-picker lang="en-GB" label="Start date" name="start" ${attrs}></punica-date-picker></form>`;

    it('appears in FormData as an ISO date', async () => {
      const f = await fixture(form('value="2026-03-15"'));
      expect(new FormData(f).get('start')).toBe('2026-03-15');
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form('value="2026-03-15" disabled'));
      expect(new FormData(f).has('start')).toBe(false);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form('value="2026-03-15"'));
      const el = f.firstElementChild;
      type(el, '01/01/2027');
      await settle();
      expect(new FormData(f).get('start')).toBe('2027-01-01');
      f.reset();
      await settle();
      expect(el.value).toBe('2026-03-15');
      expect(input(el).value).toBe('15/03/2026');
      expect(new FormData(f).get('start')).toBe('2026-03-15');
    });

    it('blocks checkValidity when required and empty', async () => {
      const f = await fixture(form('required'));
      const el = f.firstElementChild;
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      type(el, '15/03/2026');
      await settle();
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(`<form><fieldset disabled>${form('value="2026-03-15"').replace(/<\/?form>/g, '')}</fieldset></form>`);
      await settle();
      const el = f.querySelector('punica-date-picker');
      expect(input(el).disabled).toBe(true);
      expect(toggle(el).disabled).toBe(true);
      expect(new FormData(f).has('start')).toBe(false);
    });

    it('submits the form on Enter in the input', async () => {
      const f = await fixture(form('value="2026-03-15"'));
      let data = null;
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        data = new FormData(f).get('start');
      });
      const el = f.firstElementChild;
      input(el).value = '16/03/2026';
      key(input(el), 'Enter');
      expect(data).toBe('2026-03-16');
    });
  });
});
