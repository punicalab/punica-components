import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import { page } from 'vitest/browser';
import { parseFieldMonth, formatFieldMonth } from '../calendar/dates.js';
import './monthPicker.js';

const html = '<punica-month-picker lang="en-GB" label="Closing month" name="month" value="2026-03"></punica-month-picker>';

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const input = (el) => el.shadowRoot.querySelector('input');
const toggle = (el) => el.shadowRoot.querySelector('[part="toggle"]');
const panel = (el) => el.shadowRoot.querySelector('[part="panel"]');
const active = (el) => el.shadowRoot.activeElement;
const cell = (el, month) => el.shadowRoot.querySelector(`td[data-month="${month}"]`);
const type = (el, text) => {
  input(el).value = text;
  input(el).dispatchEvent(new Event('change'));
};

contract('punica-month-picker', { html, open: (el) => el.show() });

describe('month text', () => {
  it('is written all-numeric in the language order', () => {
    const march = { y: 2026, m: 3 };
    expect(formatFieldMonth('en-GB', march)).toBe('03/2026');
    expect(formatFieldMonth('tr', march)).toBe('03.2026');
    expect(formatFieldMonth('ja', march)).toBe('2026/03');
    expect(formatFieldMonth('tr', null)).toBe('');
  });

  it('is read in the language order, ISO, or with the year wherever it stands', () => {
    expect(parseFieldMonth('3/2026', 'en-GB')).toEqual({ y: 2026, m: 3 });
    expect(parseFieldMonth('03.26', 'tr')).toEqual({ y: 2026, m: 3 });
    expect(parseFieldMonth('2026-03', 'tr')).toEqual({ y: 2026, m: 3 });
    expect(parseFieldMonth('2026/3', 'en-GB')).toEqual({ y: 2026, m: 3 });
    expect(parseFieldMonth('26/3', 'ja')).toEqual({ y: 2026, m: 3 });
    expect(parseFieldMonth('13/2026', 'en-GB')).toBe(null);
    expect(parseFieldMonth('March 2026', 'en-GB')).toBe(null);
    expect(parseFieldMonth('1/3/2026', 'en-GB')).toBe(null);
  });
});

describe('punica-month-picker', () => {
  afterEach(cleanup);

  it('shows its ISO value in the order of the language', async () => {
    const el = await fixture(html);
    expect(input(el).value).toBe('03/2026');
    expect(input(el).getAttribute('aria-label')).toBe('Closing month');
    el.locale = 'tr';
    await settle();
    expect(input(el).value).toBe('03.2026');
    expect(el.value).toBe('2026-03');
  });

  it('takes a typed month, fires punica-change and writes it back formatted', async () => {
    const el = await fixture(html);
    const changed = once(el, 'punica-change');
    type(el, '4/26');
    expect((await changed).detail).toEqual({ value: '2026-04' });
    await settle();
    expect(el.value).toBe('2026-04');
    expect(input(el).value).toBe('04/2026');
    const cleared = once(el, 'punica-change');
    type(el, '');
    expect((await cleared).detail.value).toBe(null);
  });

  it('keeps a typed non-month for the user to fix and reports bad input', async () => {
    const el = await fixture(html);
    type(el, '13/2026');
    await settle();
    expect(el.value).toBe(null);
    expect(input(el).value).toBe('13/2026');
    expect(el.validity.badInput).toBe(true);
    expect(input(el).getAttribute('aria-invalid')).toBe('true');
    type(el, '12/2026');
    await settle();
    expect(el.validity.valid).toBe(true);
    expect(el.value).toBe('2026-12');
  });

  it('opens on the value with focus on its month, the year as title', async () => {
    const el = await fixture(html);
    const opened = once(el, 'punica-open');
    toggle(el).click();
    await opened;
    await settle();
    expect(panel(el).matches(':popover-open')).toBe(true);
    expect(toggle(el).getAttribute('aria-expanded')).toBe('true');
    expect(toggle(el).getAttribute('aria-label')).toBe('Choose month');
    expect(el.shadowRoot.querySelector('[part="title"]').textContent).toBe('2026');
    expect(active(el).dataset.month).toBe('2026-03');
    expect(active(el).getAttribute('aria-selected')).toBe('true');
    expect(active(el).querySelector('.spoken').textContent).toBe('March 2026');
    expect(active(el).querySelector('[aria-hidden]').textContent).toBe('Mar');
  });

  it('picks by keyboard across a year, closes and returns focus', async () => {
    const el = await fixture(html);
    input(el).focus();
    key(input(el), 'ArrowDown');
    await settle();
    expect(el.open).toBe(true);
    key(active(el), 'ArrowUp');
    expect(active(el).dataset.month).toBe('2025-12');
    expect(el.shadowRoot.querySelector('[part="title"]').textContent).toBe('2025');
    key(active(el), 'ArrowRight');
    key(active(el), 'PageDown');
    expect(active(el).dataset.month).toBe('2027-01');
    key(active(el), 'End');
    expect(active(el).dataset.month).toBe('2027-03');
    const changed = once(el, 'punica-change');
    const closed = once(el, 'punica-close');
    key(active(el), 'Enter');
    expect((await changed).detail).toEqual({ value: '2027-03' });
    expect((await closed).detail).toEqual({ reason: 'select' });
    await settle();
    expect(input(el).value).toBe('03/2027');
    expect(panel(el).matches(':popover-open')).toBe(false);
    expect(active(el)).toBe(input(el));
  });

  it('moves the year with its buttons and picks with a click', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    const [previous, next] = el.shadowRoot.querySelectorAll('[part="nav"]');
    expect(previous.getAttribute('aria-label')).toBe('Previous year');
    next.click();
    expect(el.shadowRoot.querySelector('[part="title"]').textContent).toBe('2027');
    cell(el, '2027-06').click();
    await settle();
    expect(el.value).toBe('2027-06');
    expect(el.open).toBe(false);
  });

  it('closes on Escape and on a press outside', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    const closed = once(el, 'punica-close');
    key(active(el), 'Escape');
    expect((await closed).detail.reason).toBe('escape');
    await settle();
    expect(active(el)).toBe(toggle(el));
    el.show();
    await settle();
    const outside = once(el, 'punica-close');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect((await outside).detail.reason).toBe('outside');
    expect(el.value).toBe('2026-03');
  });

  it('holds to min, max, disabledMonths and the language', async () => {
    const el = await fixture('<punica-month-picker locale="tr" label="Ay" min="2026-02" max="2026-10" value="2026-03"></punica-month-picker>');
    el.disabledMonths = (month) => month === '2026-05';
    el.show();
    await settle();
    expect(cell(el, '2026-01').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2026-05').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2026-11').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2026-03').querySelector('[aria-hidden]').textContent).toBe('Mar');
    expect(cell(el, '2026-03').querySelector('.spoken').textContent).toBe('Mart 2026');
    const [previous, next] = el.shadowRoot.querySelectorAll('[part="nav"]');
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);
    cell(el, '2026-05').click();
    expect(el.value).toBe('2026-03');
    key(active(el), 'PageUp');
    expect(active(el).dataset.month).toBe('2026-02');
    el.hide();
    type(el, '11.2026');
    await settle();
    expect(el.validity.rangeOverflow).toBe(true);
    expect(el.validationMessage.trim().length).toBeGreaterThan(0);
  });

  it('mirrors the arrows right to left', async () => {
    const wrap = await fixture(`<div dir="rtl">${html}</div>`);
    const el = wrap.firstElementChild;
    el.show();
    await settle();
    key(active(el), 'ArrowLeft');
    expect(active(el).dataset.month).toBe('2026-04');
  });

  it('lines the panel up with the start edge of a right-to-left field', async () => {
    await page.viewport(1280, 800);
    const wrap = await fixture(`<div dir="rtl" style="padding: 40px 0; margin-inline: 400px">${html.replace('lang="en-GB"', 'lang="ar-EG"')}</div>`);
    const el = wrap.querySelector('punica-month-picker');
    toggle(el).click();
    await settle();
    await settle();
    const f = el.shadowRoot.querySelector('[part=field]').getBoundingClientRect();
    const p = panel(el).getBoundingClientRect();
    expect(Math.abs(p.right - f.right)).toBeLessThan(2);
    await page.viewport(414, 896);
  });

  it('fires nothing for a programmatic value', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.value = '2026-07';
    await settle();
    expect(input(el).value).toBe('07/2026');
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
    const form = (attrs = '') => `<form><punica-month-picker lang="en-GB" label="Closing month" name="month" ${attrs}></punica-month-picker></form>`;

    it('appears in FormData as an ISO month', async () => {
      const f = await fixture(form('value="2026-03"'));
      expect(new FormData(f).get('month')).toBe('2026-03');
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form('value="2026-03" disabled'));
      expect(new FormData(f).has('month')).toBe(false);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form('value="2026-03"'));
      const el = f.firstElementChild;
      type(el, '01/2027');
      await settle();
      expect(new FormData(f).get('month')).toBe('2027-01');
      f.reset();
      await settle();
      expect(el.value).toBe('2026-03');
      expect(input(el).value).toBe('03/2026');
    });

    it('blocks checkValidity when required and empty', async () => {
      const f = await fixture(form('required'));
      const el = f.firstElementChild;
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      type(el, '03/2026');
      await settle();
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(`<form><fieldset disabled>${form('value="2026-03"').replace(/<\/?form>/g, '')}</fieldset></form>`);
      await settle();
      const el = f.querySelector('punica-month-picker');
      expect(input(el).disabled).toBe(true);
      expect(toggle(el).disabled).toBe(true);
      expect(new FormData(f).has('month')).toBe(false);
    });

    it('submits the form on Enter in the input', async () => {
      const f = await fixture(form('value="2026-03"'));
      let data = null;
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        data = new FormData(f).get('month');
      });
      const el = f.firstElementChild;
      input(el).value = '04/2026';
      key(input(el), 'Enter');
      expect(data).toBe('2026-04');
    });
  });
});
