import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './dateRangeInput.js';

const html = '<punica-date-range-input lang="en-GB" label="Stay" name="stay" value-start="2026-03-10" value-end="2026-03-14"></punica-date-range-input>';

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const inputs = (el) => [...el.shadowRoot.querySelectorAll('input')];
const toggle = (el) => el.shadowRoot.querySelector('[part="toggle"]');
const panel = (el) => el.shadowRoot.querySelector('[part="panel"]');
const day = (el, iso) => el.calendar.shadowRoot.querySelector(`td[data-date="${iso}"]`);
const type = (el, index, text) => {
  inputs(el)[index].value = text;
  inputs(el)[index].dispatchEvent(new Event('change'));
};

contract('punica-date-range-input', { html, open: (el) => el.show() });

describe('punica-date-range-input', () => {
  afterEach(cleanup);

  it('shows both dates in named inputs inside a named group', async () => {
    const el = await fixture(html);
    const [start, end] = inputs(el);
    expect(start.value).toBe('10/03/2026');
    expect(end.value).toBe('14/03/2026');
    expect(start.getAttribute('aria-label')).toBe('Start date');
    expect(end.getAttribute('aria-label')).toBe('End date');
    const group = el.shadowRoot.querySelector('[part="field"]');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Stay');
    expect(el.value).toBe('2026-03-10/2026-03-14');
  });

  it('takes typed dates and fires punica-change with both', async () => {
    const el = await fixture(html);
    const changed = once(el, 'punica-change');
    type(el, 1, '20/03/2026');
    expect((await changed).detail).toEqual({ value: '2026-03-10/2026-03-20', valueStart: '2026-03-10', valueEnd: '2026-03-20' });
    await settle();
    expect(el.valueEnd).toBe('2026-03-20');
    type(el, 0, 'soon');
    await settle();
    expect(el.valueStart).toBe(null);
    expect(el.validity.badInput).toBe(true);
    expect(inputs(el)[0].value).toBe('soon');
    expect(inputs(el)[1].value).toBe('20/03/2026');
    type(el, 0, '25/03/2026');
    await settle();
    expect(el.validity.rangeUnderflow).toBe(true);
    type(el, 0, '15/03/2026');
    await settle();
    expect(el.validity.valid).toBe(true);
  });

  it('picks a range on the calendar by keyboard: start, then end', async () => {
    const el = await fixture(html);
    toggle(el).focus();
    const opened = once(el, 'punica-open');
    toggle(el).click();
    await opened;
    await settle();
    expect(panel(el).matches(':popover-open')).toBe(true);
    const calendar = el.calendar;
    expect(calendar.range).toBe(true);
    expect(calendar.shadowRoot.activeElement.dataset.date).toBe('2026-03-10');
    expect(day(el, '2026-03-12').classList.contains('in-range')).toBe(true);
    key(calendar.shadowRoot.activeElement, 'ArrowDown');
    const first = once(el, 'punica-input');
    key(calendar.shadowRoot.activeElement, 'Enter');
    expect((await first).detail).toEqual({ value: null, valueStart: '2026-03-17', valueEnd: null });
    await settle();
    expect(el.open).toBe(true);
    expect(inputs(el)[1].value).toBe('');
    key(calendar.shadowRoot.activeElement, 'ArrowRight');
    key(calendar.shadowRoot.activeElement, 'ArrowRight');
    const done = once(el, 'punica-change');
    const closed = once(el, 'punica-close');
    key(calendar.shadowRoot.activeElement, ' ');
    const event = await done;
    expect(event.detail).toEqual({ value: '2026-03-17/2026-03-19', valueStart: '2026-03-17', valueEnd: '2026-03-19' });
    expect(event.target).toBe(el);
    expect((await closed).detail.reason).toBe('select');
    await settle();
    expect(inputs(el).map((i) => i.value)).toEqual(['17/03/2026', '19/03/2026']);
    expect(panel(el).matches(':popover-open')).toBe(false);
  });

  it('closes on Escape and returns focus to the button', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    const closed = once(el, 'punica-close');
    key(el.calendar.shadowRoot.activeElement, 'Escape');
    expect((await closed).detail.reason).toBe('escape');
    await settle();
    expect(el.shadowRoot.activeElement).toBe(toggle(el));
    expect(el.value).toBe('2026-03-10/2026-03-14');
  });

  it('keeps two open range inputs apart', async () => {
    const wrap = await fixture(`<div>${html}${html.replace('Stay', 'Trip')}</div>`);
    const [a, b] = wrap.children;
    a.show();
    b.show();
    await settle();
    expect(panel(a).matches(':popover-open')).toBe(true);
    expect(panel(b).matches(':popover-open')).toBe(true);
    day(b, '2026-03-02').click();
    day(b, '2026-03-04').click();
    await settle();
    expect(b.value).toBe('2026-03-02/2026-03-04');
    expect(b.open).toBe(false);
    expect(a.value).toBe('2026-03-10/2026-03-14');
    expect(a.open).toBe(true);
  });

  it('has no axe violations while open', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    await new Promise((r) => setTimeout(r, 250));
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  describe('in a form', () => {
    const form = (attrs = '') => `<form><punica-date-range-input lang="en-GB" label="Stay" name="stay" ${attrs}></punica-date-range-input></form>`;
    const both = 'value-start="2026-03-10" value-end="2026-03-14"';

    it('appears in FormData as <name>-start and <name>-end', async () => {
      const f = await fixture(form(both));
      expect(Object.fromEntries(new FormData(f))).toEqual({ 'stay-start': '2026-03-10', 'stay-end': '2026-03-14' });
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form(`${both} disabled`));
      expect([...new FormData(f)].length).toBe(0);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form(both));
      const el = f.firstElementChild;
      type(el, 0, '01/03/2026');
      type(el, 1, '');
      await settle();
      expect(Object.fromEntries(new FormData(f))).toEqual({ 'stay-start': '2026-03-01' });
      f.reset();
      await settle();
      expect(el.valueStart).toBe('2026-03-10');
      expect(inputs(el).map((i) => i.value)).toEqual(['10/03/2026', '14/03/2026']);
      expect(Object.fromEntries(new FormData(f))).toEqual({ 'stay-start': '2026-03-10', 'stay-end': '2026-03-14' });
    });

    it('blocks checkValidity when required and either date is empty', async () => {
      const f = await fixture(form('required value-start="2026-03-10"'));
      const el = f.firstElementChild;
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      type(el, 1, '12/03/2026');
      await settle();
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(`<form><fieldset disabled>${form(both).replace(/<\/?form>/g, '')}</fieldset></form>`);
      await settle();
      const el = f.querySelector('punica-date-range-input');
      expect(inputs(el).every((i) => i.disabled)).toBe(true);
      expect(toggle(el).disabled).toBe(true);
      expect([...new FormData(f)].length).toBe(0);
    });

    it('submits the form on Enter in an input', async () => {
      const f = await fixture(form(both));
      let data = null;
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        data = Object.fromEntries(new FormData(f));
      });
      const el = f.firstElementChild;
      inputs(el)[1].value = '16/03/2026';
      key(inputs(el)[1], 'Enter');
      expect(data).toEqual({ 'stay-start': '2026-03-10', 'stay-end': '2026-03-16' });
    });
  });
});
