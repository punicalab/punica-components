import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './inputGroup.js';
import '../input/input.js';
import '../select/select.js';
import '../button/button.js';
import '../iconButton/iconButton.js';
import '../numberInput/numberInput.js';

const html = `<punica-input-group label="Price">
  <punica-input-group-text>€</punica-input-group-text>
  <punica-input label="Amount in euros"></punica-input>
  <punica-button>Apply</punica-button>
</punica-input-group>`;

contract('punica-input-group', { html });
contract('punica-input-group-text', { html: '<punica-input-group-text>https://</punica-input-group-text>' });

const radius = (el) => {
  const box = el.localName === 'punica-input-group-text' ? el : el.shadowRoot.querySelector('[part="base"], [part="field"]');
  const s = getComputedStyle(box);
  return [s.borderStartStartRadius, s.borderStartEndRadius, s.borderEndEndRadius, s.borderEndStartRadius].join(' ');
};
const attrs = (el) => [...el.children].map((c) => c.getAttributeNames().sort().join(','));

describe('punica-input-group', () => {
  afterEach(cleanup);

  it('rounds only the outer corners and shares one border', async () => {
    const el = await fixture(html);
    const [text, input, button] = el.children;
    expect(radius(text)).toBe('8px 0px 0px 8px');
    expect(radius(input)).toBe('0px 0px 0px 0px');
    expect(radius(button)).toBe('0px 8px 8px 0px');
    const a = text.getBoundingClientRect();
    const b = input.getBoundingClientRect();
    expect(Math.round(b.left - a.right)).toBe(-1);
    expect(Math.round(a.height)).toBe(Math.round(b.height));
  });

  it('mirrors the corners right-to-left', async () => {
    const wrap = await fixture(`<div dir="rtl">${html}</div>`);
    const [text, , button] = wrap.firstElementChild.children;
    // Logically the same corners; physically the text's are on the right.
    expect(radius(text)).toBe('8px 0px 0px 8px');
    expect(getComputedStyle(text).borderTopRightRadius).toBe('8px');
    expect(getComputedStyle(text).borderTopLeftRadius).toBe('0px');
    expect(radius(button)).toBe('0px 8px 8px 0px');
    expect(text.getBoundingClientRect().left).toBeGreaterThan(button.getBoundingClientRect().left);
  });

  it('rounds every corner of a single part', async () => {
    const el = await fixture(`<punica-input-group><punica-input label="Only"></punica-input></punica-input-group>`);
    expect(radius(el.firstElementChild)).toBe('8px 8px 8px 8px');
  });

  it('gives its size to the children through custom properties, writing no attribute', async () => {
    const el = await fixture(html.replace('label="Price"', 'label="Price" size="small"'));
    const before = attrs(el);
    for (const child of el.children) expect(Math.round(child.getBoundingClientRect().height)).toBe(28);
    el.size = 'large';
    await settle();
    for (const child of el.children) expect(Math.round(child.getBoundingClientRect().height)).toBe(44);
    expect(attrs(el)).toEqual(before);
  });

  it('works with a select, a number input and an icon button', async () => {
    const el = await fixture(`<punica-input-group size="small">
      <punica-number-input label="Weight"></punica-number-input>
      <punica-select label="Unit" value="kg"><punica-option value="kg">kg</punica-option><punica-option value="lb">lb</punica-option></punica-select>
      <punica-icon-button label="Convert" icon="refresh"></punica-icon-button>
    </punica-input-group>`);
    await settle();
    const heights = [...el.children].map((c) => Math.round(c.getBoundingClientRect().height));
    expect(heights).toEqual([28, 28, 28]);
    expect(radius(el.children[1])).toBe('0px 0px 0px 0px');
  });

  it('draws one ring around the group while a part has keyboard focus', async () => {
    const wrap = await fixture(`<div>${html}<button>after</button></div>`);
    const el = wrap.firstElementChild;
    await userEvent.tab();
    await settle();
    expect(el.matches(':state(focus-visible)')).toBe(true);
    const base = el.shadowRoot.querySelector('[part="base"]');
    expect(getComputedStyle(base).outlineStyle).toBe('solid');
    // The field's own ring is switched off inside the group.
    const field = el.children[1].shadowRoot.querySelector('[part="base"]');
    expect(getComputedStyle(field).outlineWidth).toBe('0px');
    await userEvent.tab();
    await settle();
    expect(el.matches(':state(focus-visible)')).toBe(true);
    await userEvent.tab();
    await settle();
    expect(el.matches(':state(focus-visible)')).toBe(false);
    expect(el.matches(':state(focus-within)')).toBe(false);
    expect(getComputedStyle(base).outlineStyle).toBe('none');
  });

  it('is a named group only with a label', async () => {
    const el = await fixture(html);
    expect(el.internals.role).toBe('group');
    expect(el.internals.ariaLabel).toBe('Price');
    el.label = null;
    await settle();
    expect(el.internals.role).toBe(null);
  });

  it('dims and takes no focus while disabled, leaving the controls their values', async () => {
    const form = await fixture(`<form>${html.replace('<punica-input label', '<punica-input name="amount" value="12" label')}</form>`);
    const el = form.firstElementChild;
    el.disabled = true;
    await settle();
    expect(el.shadowRoot.querySelector('[part="base"]').inert).toBe(true);
    expect(el.internals.ariaDisabled).toBe('true');
    await userEvent.tab();
    expect(document.activeElement).toBe(document.body);
    expect([...new FormData(form)]).toEqual([['amount', '12']]);
  });

  it('shows addon text given as markup as text', async () => {
    const el = await fixture(html);
    el.firstElementChild.textContent = '<img src=x onerror=window.__pwn=1>';
    await settle();
    expect(el.querySelector('img')).toBe(null);
    expect(window.__pwn).toBeUndefined();
  });
});
