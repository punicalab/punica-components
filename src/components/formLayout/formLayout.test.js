import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './formLayout.js';
import '../field/field.js';
import '../input/input.js';
import '../button/button.js';

const fields = (n, attrs = () => '') =>
  Array.from({ length: n }, (_, i) => `<punica-field label="${i ? 'Field ' + i : 'A much longer label'}" ${attrs(i)}><punica-input full-width></punica-input></punica-field>`).join('');

const html = `<punica-form-layout columns="2">
  ${fields(4)}
  <punica-button slot="actions" type="submit">Save</punica-button>
</punica-form-layout>`;

contract('punica-form-layout', { html });

const box = (el) => el.getBoundingClientRect();
const wide = (inner, width = 800) => `<div style="inline-size: ${width}px">${inner}</div>`;
const labelOf = (field) => box(field.shadowRoot.querySelector('[part="label"]'));

describe('punica-form-layout', () => {
  afterEach(cleanup);

  it('lays the children in its columns', async () => {
    const wrap = await fixture(wide(html));
    const [a, b, c] = wrap.firstElementChild.querySelectorAll('punica-field');
    expect(Math.round(box(a).top)).toBe(Math.round(box(b).top));
    expect(box(c).top).toBeGreaterThan(box(a).bottom - 1);
    expect(Math.round(box(a).width)).toBe(Math.round(box(b).width));
  });

  it('honours span on a child and caps it at the column count', async () => {
    const wrap = await fixture(wide(`<punica-form-layout columns="3">${fields(3, (i) => (i === 0 ? 'span="2"' : i === 2 ? 'span="4"' : ''))}</punica-form-layout>`, 900));
    const [a, b, c] = wrap.firstElementChild.children;
    expect(Math.round(box(a).top)).toBe(Math.round(box(b).top));
    expect(box(a).width).toBeGreaterThan(box(b).width * 1.9);
    expect(Math.round(box(c).width)).toBe(Math.round(box(wrap.firstElementChild).width));
  });

  it('collapses to one column in a narrow container', async () => {
    const wrap = await fixture(wide(html, 360));
    const [a, b] = wrap.firstElementChild.querySelectorAll('punica-field');
    expect(box(b).top).toBeGreaterThan(box(a).bottom - 1);
    expect(Math.round(box(a).width)).toBe(360);
  });

  it('puts the labels beside the fields in one aligned column', async () => {
    const wrap = await fixture(wide(`<punica-form-layout label-position="start">${fields(3)}<punica-button slot="actions">Save</punica-button></punica-form-layout>`));
    const [a, b, c] = wrap.firstElementChild.querySelectorAll('punica-field');
    const inputs = [a, b, c].map((f) => box(f.querySelector('punica-input')));
    expect(new Set(inputs.map((r) => Math.round(r.left))).size).toBe(1);
    expect(labelOf(a).right).toBeLessThanOrEqual(inputs[0].left);
    expect(Math.round(labelOf(b).left)).toBe(Math.round(labelOf(a).left));
    expect(Math.round(labelOf(a).top)).toBeLessThan(Math.round(inputs[0].bottom));
    // The buttons line up with the fields.
    const save = wrap.querySelector('punica-button');
    expect(Math.round(box(save).left)).toBe(Math.round(inputs[0].left));
  });

  it('fills the column with a control that has no full-width, and sets the label on its baseline', async () => {
    const wrap = await fixture(wide(`<punica-form-layout label-position="start"><punica-field label="Name"><punica-input value="Mira"></punica-input></punica-field></punica-form-layout>`));
    const field = wrap.querySelector('punica-field');
    const input = field.querySelector('punica-input');
    expect(Math.round(box(input).right)).toBe(Math.round(box(wrap.firstElementChild).right));
    const text = input.shadowRoot.querySelector('input');
    // The label's text and the control's text share a baseline: equal bottoms within a pixel.
    expect(Math.abs(labelOf(field).bottom - box(text).bottom)).toBeLessThan(2);
    const top = await fixture(wide(`<punica-form-layout><punica-field label="Name"><punica-input></punica-input></punica-field></punica-form-layout>`));
    expect(Math.round(box(top.querySelector('punica-input')).width)).toBe(800);
  });

  it('puts the labels on the right right-to-left', async () => {
    const wrap = await fixture(`<div dir="rtl">${wide(`<punica-form-layout label-position="start">${fields(2)}</punica-form-layout>`)}</div>`);
    const field = wrap.querySelector('punica-field');
    expect(labelOf(field).left).toBeGreaterThanOrEqual(box(field.querySelector('punica-input')).right);
  });

  it('puts the labels back above in a narrow container', async () => {
    const wrap = await fixture(wide(`<punica-form-layout label-position="start">${fields(2)}</punica-form-layout>`, 360));
    const field = wrap.querySelector('punica-field');
    expect(labelOf(field).bottom).toBeLessThanOrEqual(box(field.querySelector('punica-input')).top + 1);
  });

  it('shows the actions row only when it has content', async () => {
    const el = await fixture(`<punica-form-layout>${fields(1)}</punica-form-layout>`);
    const actions = el.shadowRoot.querySelector('[part="actions"]');
    expect(actions.hidden).toBe(true);
    const button = document.createElement('punica-button');
    button.slot = 'actions';
    button.textContent = 'Save';
    el.append(button);
    await settle();
    expect(actions.hidden).toBe(false);
    expect(el.matches(':state(has-actions)')).toBe(true);
  });

  it('changes the row gap with gap', async () => {
    const el = await fixture(`<punica-form-layout gap="large">${fields(1)}</punica-form-layout>`);
    expect(getComputedStyle(el.shadowRoot.querySelector('.grid')).rowGap).toBe('24px');
    el.gap = 'small';
    await settle();
    expect(getComputedStyle(el.shadowRoot.querySelector('.grid')).rowGap).toBe('8px');
  });
});
