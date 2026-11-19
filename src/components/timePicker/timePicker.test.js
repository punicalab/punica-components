import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './timePicker.js';

const html = '<punica-time-picker lang="en-GB" label="Start time" name="at" value="09:30"></punica-time-picker>';

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const input = (el) => el.shadowRoot.querySelector('input');
const listbox = (el) => el.shadowRoot.querySelector('[part="listbox"]');
const options = (el) => [...listbox(el).children];
const active = (el) => options(el).find((o) => o.active) || null;
const type = (el, text) => {
  input(el).value = text;
  input(el).dispatchEvent(new Event('change'));
};

contract('punica-time-picker', { html, open: (el) => el.show() });

describe('punica-time-picker', () => {
  afterEach(cleanup);

  it('is a combobox input over a listbox of times every step minutes', async () => {
    const el = await fixture(html);
    expect(input(el).getAttribute('role')).toBe('combobox');
    expect(input(el).getAttribute('aria-expanded')).toBe('false');
    expect(input(el).getAttribute('aria-label')).toBe('Start time');
    expect(el.shadowRoot.getElementById(input(el).getAttribute('aria-controls'))).toBe(listbox(el));
    expect(input(el).value).toBe('09:30');
    expect(options(el).length).toBe(48);
    expect(options(el)[1].value).toBe('00:30');
    el.step = 15;
    el.min = '09:00';
    el.max = '10:00';
    await settle();
    expect(options(el).map((o) => o.value)).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00']);
  });

  it('shows 12 or 24 hours as the language does and keeps HH:mm as the value', async () => {
    const el = await fixture('<punica-time-picker locale="en-US" label="Start time" value="14:30"></punica-time-picker>');
    expect(input(el).value.replace(/\s/g, ' ')).toBe('2:30 PM');
    expect(options(el)[0].textContent.replace(/\s/g, ' ')).toBe('12:00 AM');
    el.locale = 'tr';
    await settle();
    expect(input(el).value).toBe('14:30');
    expect(el.value).toBe('14:30');
  });

  it('takes a typed time and fires punica-change', async () => {
    const el = await fixture('<punica-time-picker locale="en-US" label="Start time" value="14:30"></punica-time-picker>');
    const changed = once(el, 'punica-change');
    type(el, '7:05 pm');
    expect((await changed).detail).toEqual({ value: '19:05' });
    await settle();
    expect(el.value).toBe('19:05');
    expect(input(el).value.replace(/\s/g, ' ')).toBe('7:05 PM');
    type(el, 'later');
    await settle();
    expect(el.value).toBe(null);
    expect(el.validity.badInput).toBe(true);
    expect(input(el).value).toBe('later');
    const cleared = once(el, 'punica-change');
    type(el, '08:00');
    expect((await cleared).detail.value).toBe('08:00');
  });

  it('opens with ArrowDown on the held time and moves with the arrows', async () => {
    const el = await fixture(html);
    input(el).focus();
    const opened = once(el, 'punica-open');
    expect(key(input(el), 'ArrowDown').defaultPrevented).toBe(true);
    await opened;
    expect(listbox(el).matches(':popover-open')).toBe(true);
    expect(input(el).getAttribute('aria-expanded')).toBe('true');
    expect(active(el).value).toBe('09:30');
    expect(input(el).ariaActiveDescendantElement).toBe(active(el));
    key(input(el), 'ArrowDown');
    expect(active(el).value).toBe('10:00');
    key(input(el), 'ArrowUp');
    key(input(el), 'ArrowUp');
    expect(active(el).value).toBe('09:00');
    key(input(el), 'PageDown');
    expect(active(el).value).toBe('14:00');
    expect(options(el).filter((o) => o.active).length).toBe(1);
  });

  it('selects with Enter, fires punica-change and punica-close, closes on Escape', async () => {
    const el = await fixture(html);
    input(el).focus();
    key(input(el), 'ArrowDown');
    await settle();
    key(input(el), 'ArrowDown');
    const changed = once(el, 'punica-change');
    const closed = once(el, 'punica-close');
    key(input(el), 'Enter');
    expect((await changed).detail).toEqual({ value: '10:00' });
    expect((await closed).detail).toEqual({ reason: 'select' });
    await settle();
    expect(input(el).value).toBe('10:00');
    expect(listbox(el).matches(':popover-open')).toBe(false);
    expect(options(el).find((o) => o.selected).value).toBe('10:00');
    key(input(el), 'ArrowUp');
    await settle();
    key(input(el), 'ArrowUp');
    const escaped = once(el, 'punica-close');
    key(input(el), 'Escape');
    expect((await escaped).detail.reason).toBe('escape');
    expect(el.value).toBe('10:00');
  });

  it('selects on click', async () => {
    const el = await fixture(html);
    el.shadowRoot.querySelector('[part="toggle"]').click();
    await settle();
    expect(el.open).toBe(true);
    const changed = once(el, 'punica-change');
    options(el)[4].click();
    expect((await changed).detail.value).toBe('02:00');
    await settle();
    expect(el.open).toBe(false);
  });

  it('reports a time outside min and max', async () => {
    const el = await fixture('<punica-time-picker lang="en-GB" label="Start time" min="09:00" max="17:00"></punica-time-picker>');
    type(el, '08:15');
    await settle();
    expect(el.value).toBe('08:15');
    expect(el.validity.rangeUnderflow).toBe(true);
    type(el, '18:00');
    await settle();
    expect(el.validity.rangeOverflow).toBe(true);
    type(el, '12:10');
    await settle();
    expect(el.validity.valid).toBe(true);
  });

  it('keeps two open pickers apart', async () => {
    const wrap = await fixture(`<div>${html}${html.replace('Start time', 'End time')}</div>`);
    const [a, b] = wrap.children;
    a.show();
    b.show();
    await settle();
    expect(listbox(a).matches(':popover-open')).toBe(true);
    expect(listbox(b).matches(':popover-open')).toBe(true);
    key(input(b), 'ArrowDown');
    key(input(b), 'Enter');
    await settle();
    expect(b.value).toBe('10:00');
    expect(a.value).toBe('09:30');
    expect(a.open).toBe(true);
    expect(active(a).value).toBe('09:30');
  });

  it('fires nothing for a programmatic value', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.value = '23:45';
    await settle();
    expect(input(el).value).toBe('23:45');
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
    const form = (attrs = '') => `<form><punica-time-picker lang="en-GB" label="Start time" name="at" ${attrs}></punica-time-picker></form>`;

    it('appears in FormData as HH:mm', async () => {
      const f = await fixture(form('value="09:30"'));
      expect(new FormData(f).get('at')).toBe('09:30');
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form('value="09:30" disabled'));
      expect(new FormData(f).has('at')).toBe(false);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form('value="09:30"'));
      const el = f.firstElementChild;
      type(el, '11:45');
      await settle();
      expect(new FormData(f).get('at')).toBe('11:45');
      f.reset();
      await settle();
      expect(el.value).toBe('09:30');
      expect(input(el).value).toBe('09:30');
      expect(new FormData(f).get('at')).toBe('09:30');
    });

    it('blocks checkValidity when required and empty', async () => {
      const f = await fixture(form('required'));
      const el = f.firstElementChild;
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      type(el, '09:30');
      await settle();
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(`<form><fieldset disabled>${form('value="09:30"').replace(/<\/?form>/g, '')}</fieldset></form>`);
      await settle();
      const el = f.querySelector('punica-time-picker');
      expect(input(el).disabled).toBe(true);
      expect(new FormData(f).has('at')).toBe(false);
    });

    it('submits the form on Enter in the input', async () => {
      const f = await fixture(form('value="09:30"'));
      let data = null;
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        data = new FormData(f).get('at');
      });
      const el = f.firstElementChild;
      input(el).value = '16:20';
      key(input(el), 'Enter');
      expect(data).toBe('16:20');
    });
  });
});
