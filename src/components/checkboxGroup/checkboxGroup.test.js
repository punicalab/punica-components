import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './checkboxGroup.js';

const group = (attrs = '', boxes = '') => `<punica-checkbox-group label="Toppings" ${attrs}>
  <punica-checkbox value="cheese" ${boxes}>Cheese</punica-checkbox>
  <punica-checkbox value="olives">Olives</punica-checkbox>
  <punica-checkbox value="basil">Basil</punica-checkbox>
</punica-checkbox-group>`;

contract('punica-checkbox-group', { html: group('name="top" value="olives"') });

const entries = (form) => [...new FormData(form)];
const ticks = (el) => el.items.map((b) => b.checked);

describe('punica-checkbox-group', () => {
  afterEach(cleanup);

  it('ticks the boxes its value names, as a group named by its label', async () => {
    const el = await fixture(group('value="cheese basil"'));
    expect(el.value).toEqual(['cheese', 'basil']);
    expect(ticks(el)).toEqual([true, false, true]);
    expect(el.internals.role).toBe('group');
    expect(el.internals.ariaLabel).toBe('Toppings');
    const legend = el.shadowRoot.querySelector('[part="label"]');
    expect(legend.hidden).toBe(false);
    expect(legend.textContent.trim()).toBe('Toppings');
  });

  it('takes its default from the boxes ticked in the markup', async () => {
    const el = await fixture(group('', 'checked'));
    expect(el.value).toEqual(['cheese']);
  });

  it('draws no legend inside a punica-field or with label-hidden', async () => {
    const wrap = await fixture(`<div><punica-field label="Extras">${group()}</punica-field>${group('label-hidden')}</div>`);
    await settle();
    const [inField, hidden] = wrap.querySelectorAll('punica-checkbox-group');
    expect(inField.shadowRoot.querySelector('[part="label"]').hidden).toBe(true);
    expect(hidden.shadowRoot.querySelector('[part="label"]').hidden).toBe(true);
    expect(hidden.internals.ariaLabel).toBe('Toppings');
  });

  it('names itself by rich content in the label slot', async () => {
    const el = await fixture(`<punica-checkbox-group><span slot="label">Extras <b>free</b></span><punica-checkbox value="a">A</punica-checkbox></punica-checkbox-group>`);
    await settle();
    expect(el.internals.ariaLabelledByElements).toEqual([el.querySelector('span')]);
    expect(el.shadowRoot.querySelector('[part="label"]').hidden).toBe(false);
  });

  it('fires punica-change with the new array when a box is toggled, and the box event stops at the group', async () => {
    const wrap = await fixture(`<div>${group('value="olives"')}</div>`);
    const el = wrap.firstElementChild;
    const seen = [];
    wrap.addEventListener('punica-change', (e) => seen.push([e.target.localName, e.detail, e.bubbles, e.composed]));
    el.items[0].click();
    await settle();
    expect(seen).toEqual([['punica-checkbox-group', { value: ['cheese', 'olives'] }, true, true]]);
    el.items[1].click();
    await settle();
    expect(seen.at(-1)[1]).toEqual({ value: ['cheese'] });
    el.value = ['basil'];
    await settle();
    expect(ticks(el)).toEqual([false, false, true]);
    expect(seen.length).toBe(2);
  });

  it('gives its own listeners only the group event', async () => {
    const el = await fixture(group());
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail));
    el.items[2].click();
    await settle();
    expect(seen).toEqual([{ value: ['basil'] }]);
  });

  it('puts focus on the first box when a submit finds it invalid', async () => {
    const form = await fixture(`<form>${group('name="a" required')}</form>`);
    const el = form.firstElementChild;
    expect(form.reportValidity()).toBe(false);
    expect(document.activeElement).toBe(el.items[0]);
  });

  it('keeps each box a tab stop that Space toggles', async () => {
    const el = await fixture(group());
    await userEvent.tab();
    await userEvent.keyboard(' ');
    await userEvent.tab();
    await userEvent.keyboard(' ');
    await settle();
    expect(el.value).toEqual(['cheese', 'olives']);
  });

  it('submits one entry per ticked box under its name, nothing from the boxes', async () => {
    const form = await fixture(`<form>${group('name="top" value="cheese basil"')}${group('name="none"')}</form>`);
    await settle();
    expect(entries(form)).toEqual([['top', 'cheese'], ['top', 'basil']]);
  });

  it('disables every box, submits nothing, and gives back only what it disabled', async () => {
    const form = await fixture(`<form>${group('name="top" value="cheese"')}</form>`);
    const el = form.firstElementChild;
    el.items[2].disabled = true;
    el.disabled = true;
    await settle();
    expect(el.items.map((b) => b.disabled)).toEqual([true, true, true]);
    expect(el.internals.ariaDisabled).toBe('true');
    expect(entries(form)).toEqual([]);
    el.disabled = false;
    await settle();
    expect(el.items.map((b) => b.disabled)).toEqual([false, false, true]);
    expect(entries(form)).toEqual([['top', 'cheese']]);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture(`<form><fieldset disabled>${group('name="top" value="cheese"')}</fieldset></form>`);
    await settle();
    const el = form.querySelector('punica-checkbox-group');
    expect(el.isDisabled).toBe(true);
    expect(el.matches(':state(disabled)')).toBe(true);
    expect(entries(form)).toEqual([]);
  });

  it('goes back to its default on form.reset()', async () => {
    const form = await fixture(`<form>${group('name="a" value="olives"')}${group('name="b"', 'checked')}</form>`);
    const [a, b] = form.children;
    a.items[0].click();
    b.items[2].click();
    await settle();
    expect(entries(form)).toEqual([['a', 'cheese'], ['a', 'olives'], ['b', 'cheese'], ['b', 'basil']]);
    form.reset();
    await settle();
    expect(entries(form)).toEqual([['a', 'olives'], ['b', 'cheese']]);
    expect(ticks(a)).toEqual([false, true, false]);
  });

  it('blocks the form while required and nothing is ticked, with the browser message', async () => {
    const form = await fixture(`<form>${group('name="a" required')}</form>`);
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage.trim()).not.toBe('');
    el.items[1].click();
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('checks min and max with its own messages', async () => {
    const form = await fixture(`<form>${group('name="a" min="2" max="2"')}</form>`);
    const el = form.firstElementChild;
    expect(el.validity.valid).toBe(true);
    el.items[0].click();
    await settle();
    expect(el.validity.rangeUnderflow).toBe(true);
    expect(el.validationMessage).toBe('Choose at least 2.');
    el.items[1].click();
    await settle();
    expect(el.validity.valid).toBe(true);
    el.labelTooMany = 'Höchstens {max}.';
    el.items[2].click();
    await settle();
    expect(el.validity.rangeOverflow).toBe(true);
    expect(el.validationMessage).toBe('Höchstens 2.');
  });

  it('lays the boxes in a row when horizontal', async () => {
    const el = await fixture(group('orientation="horizontal"'));
    const [a, b] = el.items.map((x) => x.getBoundingClientRect());
    expect(Math.round(a.top)).toBe(Math.round(b.top));
  });

  it('takes boxes added later and restores from FormData', async () => {
    const el = await fixture(group('name="top"'));
    const box = document.createElement('punica-checkbox');
    box.value = 'chili';
    box.textContent = 'Chili';
    el.append(box);
    await settle();
    el.value = ['chili'];
    await settle();
    expect(box.checked).toBe(true);
    const data = new FormData();
    data.append('top', 'olives');
    el.formRestore(data);
    await settle();
    expect(ticks(el)).toEqual([false, true, false, false]);
  });

  it('shows a label given as markup as text', async () => {
    const el = await fixture(group());
    el.label = '<img src=x onerror=window.__pwn=1>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('.label-text').textContent).toBe('<img src=x onerror=window.__pwn=1>');
    expect(window.__pwn).toBeUndefined();
  });
});
