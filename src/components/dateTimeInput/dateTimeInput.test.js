import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './dateTimeInput.js';

const html = '<punica-date-time-input lang="en-GB" label="Departure" name="departure" value="2026-03-15T09:30"></punica-date-time-input>';

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const date = (el) => el.shadowRoot.querySelector('punica-date-picker');
const time = (el) => el.shadowRoot.querySelector('punica-time-picker');
const dateInput = (el) => date(el).shadowRoot.querySelector('input');
const timeInput = (el) => time(el).shadowRoot.querySelector('input');
const type = (input, text) => {
  input.value = text;
  input.dispatchEvent(new Event('change'));
};

contract('punica-date-time-input', { html, open: (el) => el.shadowRoot.querySelector('punica-time-picker').show() });

describe('punica-date-time-input', () => {
  afterEach(cleanup);

  it('splits its value over a date field and a time field in a named group', async () => {
    const el = await fixture(html);
    await settle();
    expect(dateInput(el).value).toBe('15/03/2026');
    expect(timeInput(el).value).toBe('09:30');
    expect(dateInput(el).getAttribute('aria-label')).toBe('Date');
    expect(timeInput(el).getAttribute('aria-label')).toBe('Time');
    const group = el.shadowRoot.querySelector('[part="group"]');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Departure');
  });

  it('fires one punica-change with the whole value when either part changes', async () => {
    const el = await fixture(html);
    await settle();
    const events = [];
    el.addEventListener('punica-change', (event) => events.push([event.target, event.detail]));
    type(timeInput(el), '14:45');
    await settle();
    type(dateInput(el), '01/04/2026');
    await settle();
    expect(events).toEqual([
      [el, { value: '2026-03-15T14:45' }],
      [el, { value: '2026-04-01T14:45' }]
    ]);
    expect(el.value).toBe('2026-04-01T14:45');
  });

  it('is empty and invalid while only one part is filled, and keeps the part', async () => {
    const el = await fixture(html);
    await settle();
    const changed = once(el, 'punica-change');
    type(timeInput(el), '');
    expect((await changed).detail.value).toBe(null);
    await settle();
    expect(el.value).toBe(null);
    expect(dateInput(el).value).toBe('15/03/2026');
    expect(el.validity.badInput).toBe(true);
    type(timeInput(el), '10:00');
    await settle();
    expect(el.value).toBe('2026-03-15T10:00');
    expect(el.validity.valid).toBe(true);
  });

  it('is operated by keyboard through both parts', async () => {
    const el = await fixture(html);
    await settle();
    timeInput(el).focus();
    key(timeInput(el), 'ArrowDown');
    await settle();
    expect(time(el).open).toBe(true);
    key(timeInput(el), 'ArrowDown');
    const changed = once(el, 'punica-change');
    key(timeInput(el), 'Enter');
    expect((await changed).detail.value).toBe('2026-03-15T10:00');
    await settle();
    key(dateInput(el), 'ArrowDown');
    await settle();
    expect(date(el).open).toBe(true);
    const calendar = date(el).calendar;
    key(calendar.shadowRoot.activeElement, 'ArrowRight');
    const next = once(el, 'punica-change');
    key(calendar.shadowRoot.activeElement, 'Enter');
    expect((await next).detail.value).toBe('2026-03-16T10:00');
  });

  it('holds min and max across the two parts', async () => {
    const el = await fixture('<punica-date-time-input lang="en-GB" label="Departure" value="2026-03-15T09:30" min="2026-03-15T09:00" max="2026-03-20T18:00"></punica-date-time-input>');
    await settle();
    await settle();
    expect(date(el).min).toBe('2026-03-15');
    expect(date(el).max).toBe('2026-03-20');
    expect(time(el).min).toBe('09:00');
    expect(time(el).max).toBe(null);
    type(timeInput(el), '08:00');
    await settle();
    expect(el.validity.rangeUnderflow).toBe(true);
    type(dateInput(el), '16/03/2026');
    await settle();
    await settle();
    expect(el.validity.valid).toBe(true);
    expect(time(el).min).toBe(null);
  });

  it('keeps two open instances apart', async () => {
    const wrap = await fixture(`<div>${html}${html.replace('Departure', 'Return')}</div>`);
    const [a, b] = wrap.children;
    await settle();
    time(a).show();
    time(b).show();
    await settle();
    key(timeInput(b), 'ArrowDown');
    key(timeInput(b), 'Enter');
    await settle();
    expect(b.value).toBe('2026-03-15T10:00');
    expect(a.value).toBe('2026-03-15T09:30');
    expect(time(a).open).toBe(true);
  });

  it('fires nothing for a programmatic value', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.value = '2027-01-02T03:04';
    await settle();
    await settle();
    expect(dateInput(el).value).toBe('02/01/2027');
    expect(timeInput(el).value).toBe('03:04');
    expect(changes).toBe(0);
  });

  it('has no axe violations while a part is open', async () => {
    const el = await fixture(html);
    date(el).show();
    await settle();
    await new Promise((r) => setTimeout(r, 250));
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  describe('in a form', () => {
    const form = (attrs = '') => `<form><punica-date-time-input lang="en-GB" label="Departure" name="departure" ${attrs}></punica-date-time-input></form>`;

    it('appears in FormData as one ISO local date-time', async () => {
      const f = await fixture(form('value="2026-03-15T09:30"'));
      expect([...new FormData(f)]).toEqual([['departure', '2026-03-15T09:30']]);
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form('value="2026-03-15T09:30" disabled'));
      expect(new FormData(f).has('departure')).toBe(false);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form('value="2026-03-15T09:30"'));
      const el = f.firstElementChild;
      await settle();
      type(timeInput(el), '11:45');
      await settle();
      expect(new FormData(f).get('departure')).toBe('2026-03-15T11:45');
      f.reset();
      await settle();
      await settle();
      expect(el.value).toBe('2026-03-15T09:30');
      expect(timeInput(el).value).toBe('09:30');
      expect(new FormData(f).get('departure')).toBe('2026-03-15T09:30');
    });

    it('blocks checkValidity when required and empty', async () => {
      const f = await fixture(form('required'));
      const el = f.firstElementChild;
      await settle();
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      type(dateInput(el), '15/03/2026');
      type(timeInput(el), '09:30');
      await settle();
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(`<form><fieldset disabled>${form('value="2026-03-15T09:30"').replace(/<\/?form>/g, '')}</fieldset></form>`);
      await settle();
      await settle();
      const el = f.querySelector('punica-date-time-input');
      expect(dateInput(el).disabled).toBe(true);
      expect(timeInput(el).disabled).toBe(true);
      expect(new FormData(f).has('departure')).toBe(false);
    });

    it('submits the form on Enter in either input', async () => {
      const f = await fixture(form('value="2026-03-15T09:30"'));
      let data = null;
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        data = new FormData(f).get('departure');
      });
      const el = f.firstElementChild;
      await settle();
      timeInput(el).value = '16:20';
      key(timeInput(el), 'Enter');
      expect(data).toBe('2026-03-15T16:20');
    });
  });
});
