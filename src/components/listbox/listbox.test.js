import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './listbox.js';
import './listboxItem.js';

const html = (attrs = '', sel = '') => `<punica-listbox label="Fruit" name="fruit" ${attrs}>
  <punica-listbox-item value="apple">Apple</punica-listbox-item>
  <punica-listbox-item value="banana" ${sel}>Banana</punica-listbox-item>
  <punica-listbox-item value="cherry" disabled>Cherry</punica-listbox-item>
  <punica-listbox-item value="date">Date</punica-listbox-item>
  <punica-listbox-item value="elderberry">Elderberry</punica-listbox-item>
</punica-listbox>`;

const key = (el, k, init = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init }));
const itemsOf = (el) => [...el.querySelectorAll('punica-listbox-item')];
const entries = (form) => [...new FormData(form)].map(([k, v]) => `${k}=${v}`);

contract('punica-listbox', { html: html() });
contract('punica-listbox-item', { html: html() });

describe('punica-listbox', () => {
  afterEach(cleanup);

  it('creates both tags with createElement', () => {
    // 1.x set an attribute in the constructor, which made createElement throw.
    expect(document.createElement('punica-listbox').attributes.length).toBe(0);
    expect(document.createElement('punica-listbox-item').attributes.length).toBe(0);
  });

  it('exposes listbox and option semantics', async () => {
    const el = await fixture(html('multiple'));
    const items = itemsOf(el);
    expect(el.internals.role).toBe('listbox');
    expect(el.internals.ariaLabel).toBe('Fruit');
    expect(el.internals.ariaMultiSelectable).toBe('true');
    expect(items[0].internals.role).toBe('option');
    expect(items[0].internals.ariaSelected).toBe('false');
    expect(items[2].internals.ariaDisabled).toBe('true');
    el.multiple = false;
    await settle();
    expect(el.internals.ariaMultiSelectable).toBe(null);
  });

  it('takes its default from the value attribute', async () => {
    const el = await fixture(html('value="date"'));
    await settle();
    expect(el.value).toBe('date');
    expect(itemsOf(el).map((i) => i.selected)).toEqual([false, false, false, true, false]);
    expect(itemsOf(el)[3].internals.ariaSelected).toBe('true');
  });

  it('takes its default from a selected item', async () => {
    const el = await fixture(html('', 'selected'));
    await settle();
    expect(el.value).toBe('banana');
  });

  it('has one item in the tab order: the selected one, else the first', async () => {
    let el = await fixture(html());
    expect(itemsOf(el).map((i) => i.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    el = await fixture(html('value="date"'));
    await settle();
    expect(itemsOf(el).map((i) => i.tabIndex)).toEqual([-1, -1, -1, 0, -1]);
  });

  it('selects on click and fires punica-change with the value', async () => {
    const el = await fixture(html());
    const event = once(el, 'punica-change');
    itemsOf(el)[1].click();
    expect((await event).detail).toEqual({ value: 'banana' });
    await settle();
    expect(el.value).toBe('banana');
    expect(itemsOf(el)[1].selected).toBe(true);
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    itemsOf(el)[1].click();
    itemsOf(el)[2].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    el.value = 'apple';
    await settle();
    expect(fired).toBe(0);
    expect(itemsOf(el)[0].selected).toBe(true);
  });

  it('moves and selects with the arrow keys, Home and End, skipping disabled items', async () => {
    const el = await fixture(html());
    const items = itemsOf(el);
    const values = [];
    el.addEventListener('punica-change', (e) => values.push(e.detail.value));
    items[0].focus();
    key(items[0], 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);
    key(items[1], 'ArrowDown');
    expect(document.activeElement).toBe(items[3]);
    key(items[3], 'End');
    expect(document.activeElement).toBe(items[4]);
    key(items[4], 'ArrowDown');
    expect(document.activeElement).toBe(items[4]);
    key(items[4], 'Home');
    expect(document.activeElement).toBe(items[0]);
    key(items[0], 'ArrowUp');
    expect(document.activeElement).toBe(items[0]);
    expect(values).toEqual(['banana', 'date', 'elderberry', 'apple']);
    await settle();
    expect(items.map((i) => i.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    // Left and Right are not this list's keys.
    key(items[0], 'ArrowRight');
    expect(document.activeElement).toBe(items[0]);
  });

  it('follows Left and Right when horizontal, mirrored in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${html('orientation="horizontal"')}</div>`);
    const items = itemsOf(wrap);
    items[0].focus();
    key(items[0], 'ArrowLeft');
    expect(document.activeElement).toBe(items[1]);
    key(items[1], 'ArrowRight');
    expect(document.activeElement).toBe(items[0]);
    wrap.dir = 'ltr';
    key(items[0], 'ArrowRight');
    expect(document.activeElement).toBe(items[1]);
  });

  it('finds an item by typing', async () => {
    const el = await fixture(html());
    const items = itemsOf(el);
    items[0].focus();
    key(items[0], 'e');
    expect(document.activeElement).toBe(items[4]);
    expect(el.value).toBe('elderberry');
    await new Promise((r) => setTimeout(r, 550));
    key(items[4], 'd');
    key(items[3], 'a');
    expect(document.activeElement).toBe(items[3]);
  });

  it('toggles with Space in multiple, without moving the selection on arrows', async () => {
    const el = await fixture(html('multiple'));
    const items = itemsOf(el);
    const values = [];
    el.addEventListener('punica-change', (e) => values.push(e.detail.value));
    items[0].focus();
    key(items[0], ' ');
    key(items[0], 'ArrowDown');
    expect(el.value).toEqual(['apple']);
    key(items[1], ' ');
    expect(el.value).toEqual(['apple', 'banana']);
    key(items[1], ' ');
    expect(el.value).toEqual(['apple']);
    expect(values).toEqual([['apple'], ['apple', 'banana'], ['apple']]);
    await settle();
    expect(items.map((i) => i.selected)).toEqual([true, false, false, false, false]);
  });

  it('extends with Shift+arrows and selects all with Ctrl+A in multiple', async () => {
    const el = await fixture(html('multiple'));
    const items = itemsOf(el);
    items[0].focus();
    key(items[0], ' ');
    key(items[0], 'ArrowDown', { shiftKey: true });
    key(items[1], 'ArrowDown', { shiftKey: true });
    expect(document.activeElement).toBe(items[3]);
    expect(el.value).toEqual(['apple', 'banana', 'date']);
    key(items[3], 'a', { ctrlKey: true });
    expect(el.value).toEqual(['apple', 'banana', 'date', 'elderberry']);
    key(items[3], 'a', { ctrlKey: true });
    expect(el.value).toEqual([]);
  });

  it('selects a range with Shift+click in multiple', async () => {
    const el = await fixture(html('multiple'));
    const items = itemsOf(el);
    items[0].click();
    items[3].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, shiftKey: true }));
    expect(el.value).toEqual(['apple', 'banana', 'date']);
  });

  it('reads a list from the value attribute in multiple and accepts an array', async () => {
    const el = await fixture(html(`multiple value='["apple","date"]'`));
    await settle();
    expect(el.value).toEqual(['apple', 'date']);
    el.value = ['banana'];
    await settle();
    expect(itemsOf(el).map((i) => i.selected)).toEqual([false, true, false, false, false]);
    const other = await fixture(html('multiple value="apple, banana"'));
    await settle();
    expect(other.value).toEqual(['apple', 'banana']);
  });

  it('works when the items exist before the listbox is connected', async () => {
    const el = document.createElement('punica-listbox');
    const a = document.createElement('punica-listbox-item');
    const b = document.createElement('punica-listbox-item');
    a.value = 'a';
    b.value = 'b';
    b.selected = true;
    a.textContent = 'A';
    b.textContent = 'B';
    el.append(a, b);
    el.label = 'Letters';
    const host = await fixture('<div></div>');
    host.append(el);
    await settle();
    await settle();
    expect(el.value).toBe('b');
    a.click();
    await settle();
    expect(el.value).toBe('a');
    expect(b.selected).toBe(false);
  });

  it('picks up items added later', async () => {
    const el = await fixture(html());
    const item = document.createElement('punica-listbox-item');
    item.value = 'fig';
    item.textContent = 'Fig';
    el.append(item);
    await settle();
    await settle();
    expect(item.tabIndex).toBe(-1);
    item.click();
    expect(el.value).toBe('fig');
  });
});

describe('punica-listbox as a form control', () => {
  afterEach(cleanup);

  it('is in the form data, once per value in multiple', async () => {
    const form = await fixture(`<form>${html('value="date"')}</form>`);
    await settle();
    expect(entries(form)).toEqual(['fruit=date']);
    const el = form.querySelector('punica-listbox');
    expect(el.form).toBe(form);
    itemsOf(el)[0].click();
    await settle();
    expect(entries(form)).toEqual(['fruit=apple']);
    const multi = await fixture(`<form>${html('multiple value="apple,date"')}</form>`);
    await settle();
    expect(entries(multi)).toEqual(['fruit=apple', 'fruit=date']);
  });

  it('submits nothing when nothing is selected', async () => {
    const form = await fixture(`<form>${html()}</form>`);
    await settle();
    expect(entries(form)).toEqual([]);
  });

  it('is left out when disabled, and takes no input', async () => {
    const form = await fixture(`<form>${html('value="date" disabled')}</form>`);
    await settle();
    const el = form.querySelector('punica-listbox');
    expect(entries(form)).toEqual([]);
    itemsOf(el)[0].click();
    key(itemsOf(el)[3], 'ArrowDown');
    await settle();
    expect(el.value).toBe('date');
    expect(itemsOf(el).every((i) => i.tabIndex === -1)).toBe(true);
    expect(el.internals.ariaDisabled).toBe('true');
    el.disabled = false;
    await settle();
    expect(entries(form)).toEqual(['fruit=date']);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture(`<form><fieldset disabled>${html('value="date"')}</fieldset></form>`);
    await settle();
    const el = form.querySelector('punica-listbox');
    expect(el.isDisabled).toBe(true);
    expect(entries(form)).toEqual([]);
    itemsOf(el)[0].click();
    await settle();
    expect(el.value).toBe('date');
    expect(itemsOf(el).every((i) => i.tabIndex === -1)).toBe(true);
    form.querySelector('fieldset').disabled = false;
    await settle();
    expect(entries(form)).toEqual(['fruit=date']);
    expect(itemsOf(el)[3].tabIndex).toBe(0);
  });

  it('goes back to its default on form.reset()', async () => {
    const form = await fixture(`<form>${html('value="date"')}</form>`);
    const el = form.querySelector('punica-listbox');
    await settle();
    itemsOf(el)[0].click();
    await settle();
    form.reset();
    await settle();
    expect(el.value).toBe('date');
    expect(itemsOf(el).map((i) => i.selected)).toEqual([false, false, false, true, false]);
    expect(entries(form)).toEqual(['fruit=date']);
  });

  it('goes back to the items marked selected on form.reset()', async () => {
    const form = await fixture(`<form>${html('multiple', 'selected')}</form>`);
    const el = form.querySelector('punica-listbox');
    await settle();
    expect(el.value).toEqual(['banana']);
    itemsOf(el)[0].click();
    itemsOf(el)[1].click();
    await settle();
    expect(el.value).toEqual(['apple']);
    form.reset();
    await settle();
    expect(el.value).toEqual(['banana']);
    expect(entries(form)).toEqual(['fruit=banana']);
  });

  it('validates required', async () => {
    const form = await fixture(`<form>${html('required')}</form>`);
    const el = form.querySelector('punica-listbox');
    await settle();
    expect(el.validity.valueMissing).toBe(true);
    expect(el.checkValidity()).toBe(false);
    expect(form.checkValidity()).toBe(false);
    expect(el.validationMessage.trim()).not.toBe('');
    expect(el.internals.ariaRequired).toBe('true');
    itemsOf(el)[0].click();
    await settle();
    expect(el.validity.valid).toBe(true);
    expect(form.checkValidity()).toBe(true);
  });

  it('is focused by its label', async () => {
    const wrap = await fixture(`<div><label for="lb">Fruit</label>${html('id="lb"')}</div>`);
    const el = wrap.querySelector('punica-listbox');
    expect([...el.labels].length).toBe(1);
    wrap.querySelector('label').click();
    expect(document.activeElement).toBe(itemsOf(el)[0]);
  });

  it('takes a restored state', async () => {
    const el = await fixture(html('multiple'));
    el.formRestore('["apple","date"]');
    await settle();
    expect(el.value).toEqual(['apple', 'date']);
  });

  it('has a visible border and scrolls itself, not the page, to the default selection', async () => {
    const options = Array.from({ length: 12 }, (_, i) => `<punica-listbox-item value="o${i}">Option ${i}</punica-listbox-item>`).join('');
    const el = await fixture(`<punica-listbox label="Long" value="o10" style="--punica-listbox-max-height: 120px">${options}</punica-listbox>`);
    expect(getComputedStyle(el).borderTopStyle).toBe('solid');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const box = el.getBoundingClientRect();
    const item = el.querySelector('[value=o10]').getBoundingClientRect();
    expect(item.top).toBeGreaterThanOrEqual(box.top - 1);
    expect(item.bottom).toBeLessThanOrEqual(box.bottom + 1);
    expect(document.scrollingElement.scrollTop).toBe(0);
  });

  it('reports a missing selection on its focusable option, not on the unfocusable host', async () => {
    const form = await fixture(`<form><punica-listbox name="room" label="Room" required>
      <punica-listbox-item value="single">Single</punica-listbox-item>
      <punica-listbox-item value="double">Double</punica-listbox-item>
    </punica-listbox></form>`);
    const el = form.querySelector('punica-listbox');
    await settle();
    expect(form.reportValidity()).toBe(false);
    expect(document.activeElement).toBe(el.querySelector('[value=single]'));
  });
});
