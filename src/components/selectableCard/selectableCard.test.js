import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './selectableCardGroup.js';

const card = (value, attrs = '') => `<punica-selectable-card value="${value}" ${attrs}>
  <span slot="title">${value[0].toUpperCase() + value.slice(1)}</span>
  <span slot="description">The ${value} plan</span>
</punica-selectable-card>`;

const group = (attrs = '', first = '') => `<punica-selectable-card-group label="Plan" ${attrs}>
  ${card('free', first)}${card('pro')}${card('team')}
</punica-selectable-card-group>`;

contract('punica-selectable-card', { html: card('backup', 'name="addon" checked') });
contract('punica-selectable-card-group', { html: group('name="plan" value="pro"') });

const entries = (form) => [...new FormData(form)];
const checked = (el) => [...el.children].map((c) => c.checked);
const focused = (el) => [...el.children].findIndex((c) => c.matches(':focus'));

describe('punica-selectable-card', () => {
  afterEach(cleanup);

  it('is a checkbox named by its title and described by its description', async () => {
    const el = await fixture(card('backup'));
    expect(el.internals.role).toBe('checkbox');
    expect(el.internals.ariaChecked).toBe('false');
    expect(el.internals.ariaLabelledByElements).toEqual([el.querySelector('[slot=title]')]);
    expect(el.internals.ariaDescribedByElements).toEqual([el.querySelector('[slot=description]')]);
    expect(el.tabIndex).toBe(0);
    el.label = 'Nightly backup';
    await settle();
    expect(el.internals.ariaLabel).toBe('Nightly backup');
    expect(el.internals.ariaLabelledByElements).toBe(null);
  });

  it('toggles on click, Space and Enter, firing punica-change with checked and value', async () => {
    const wrap = await fixture(`<div>${card('backup')}</div>`);
    const el = wrap.firstElementChild;
    const seen = [];
    wrap.addEventListener('punica-change', (e) => seen.push([e.detail, e.bubbles, e.composed]));
    el.click();
    expect(el.checked).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(el);
    await userEvent.keyboard(' ');
    expect(el.checked).toBe(false);
    await userEvent.keyboard('{Enter}');
    expect(el.checked).toBe(true);
    expect(seen).toEqual([
      [{ checked: true, value: 'backup' }, true, true],
      [{ checked: false, value: 'backup' }, true, true],
      [{ checked: true, value: 'backup' }, true, true]
    ]);
    expect(el.matches(':state(checked)')).toBe(true);
    el.checked = false;
    await settle();
    expect(seen.length).toBe(3);
  });

  it('keeps the click of a link inside it', async () => {
    const el = await fixture(`<punica-selectable-card><span slot="title">Pro</span><a href="#terms">Terms</a></punica-selectable-card>`);
    el.querySelector('a').click();
    expect(el.checked).toBe(false);
  });

  it('submits its value while checked, takes part in reset and required', async () => {
    const form = await fixture(`<form>${card('backup', 'name="addon" checked')}${card('support', 'name="addon" required')}</form>`);
    const [a, b] = form.children;
    expect(entries(form)).toEqual([['addon', 'backup']]);
    expect(form.checkValidity()).toBe(false);
    expect(b.validity.valueMissing).toBe(true);
    expect(b.validationMessage.trim()).not.toBe('');
    a.click();
    b.click();
    await settle();
    expect(entries(form)).toEqual([['addon', 'support']]);
    expect(form.checkValidity()).toBe(true);
    form.reset();
    await settle();
    expect(entries(form)).toEqual([['addon', 'backup']]);
    expect(b.checked).toBe(false);
  });

  it('takes no input, no focus and submits nothing while disabled or in a disabled fieldset', async () => {
    const form = await fixture(`<form>${card('backup', 'name="addon" checked disabled')}<fieldset disabled>${card('support', 'name="addon" checked')}</fieldset></form>`);
    const [a, b] = form.querySelectorAll('punica-selectable-card');
    await settle();
    expect(entries(form)).toEqual([]);
    a.click();
    b.click();
    expect([a.checked, b.checked]).toEqual([true, true]);
    expect(a.hasAttribute('tabindex')).toBe(false);
    expect(b.isDisabled).toBe(true);
    expect(a.internals.ariaDisabled).toBe('true');
  });

  it('shows the media slot only when it has content', async () => {
    const el = await fixture(card('backup'));
    expect(el.shadowRoot.querySelector('[part="media"]').hidden).toBe(true);
    const img = document.createElement('img');
    img.slot = 'media';
    img.alt = '';
    el.prepend(img);
    await settle();
    expect(el.shadowRoot.querySelector('[part="media"]').hidden).toBe(false);
  });

  it('shows a title given as markup as text', async () => {
    const el = await fixture(card('backup'));
    el.querySelector('[slot=title]').textContent = '<img src=x onerror=window.__pwn=1>';
    await settle();
    expect(el.querySelector('img')).toBe(null);
    expect(window.__pwn).toBeUndefined();
  });
});

describe('punica-selectable-card-group', () => {
  afterEach(cleanup);

  it('makes its cards radios with one tab stop', async () => {
    const el = await fixture(group('value="pro"'));
    expect(el.internals.role).toBe('radiogroup');
    expect([...el.children].map((c) => [c.internals.role, c.internals.ariaChecked])).toEqual([
      ['radio', 'false'],
      ['radio', 'true'],
      ['radio', 'false']
    ]);
    expect([...el.children].map((c) => c.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    expect(el.children[1].matches(':state(radio)')).toBe(true);
  });

  it('moves and chooses with the arrows, Home and End, and chooses with Space and Enter', async () => {
    const wrap = await fixture(`<div>${group()}</div>`);
    const el = wrap.firstElementChild;
    const seen = [];
    wrap.addEventListener('punica-change', (e) => seen.push([e.target.localName, e.detail]));
    await userEvent.tab();
    expect(focused(el)).toBe(0);
    await userEvent.keyboard('{Enter}');
    expect(el.value).toBe('free');
    await userEvent.keyboard('{ArrowRight}');
    expect(el.value).toBe('pro');
    await userEvent.keyboard('{End}');
    expect(el.value).toBe('team');
    await userEvent.keyboard('{Home}');
    expect(focused(el)).toBe(0);
    expect(checked(el)).toEqual([true, false, false]);
    expect(seen).toEqual([
      ['punica-selectable-card-group', { value: 'free' }],
      ['punica-selectable-card-group', { value: 'pro' }],
      ['punica-selectable-card-group', { value: 'team' }],
      ['punica-selectable-card-group', { value: 'free' }]
    ]);
  });

  it('mirrors the arrows right-to-left', async () => {
    const wrap = await fixture(`<div dir="rtl">${group('value="free"')}</div>`);
    const el = wrap.firstElementChild;
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(el.value).toBe('pro');
  });

  it('chooses on click, and the cards submit nothing of their own', async () => {
    const form = await fixture(`<form>${group('name="plan"').replace(/value="(\w+)"/g, 'value="$1" name="card"')}</form>`);
    const el = form.firstElementChild;
    el.children[2].click();
    await settle();
    expect(el.value).toBe('team');
    expect(entries(form)).toEqual([['plan', 'team']]);
  });

  it('resets, blocks when required, and is disabled by a fieldset', async () => {
    const form = await fixture(`<form><fieldset>${group('name="plan" value="pro" required')}${group('name="other" required')}</fieldset></form>`);
    const [a, b] = form.querySelectorAll('punica-selectable-card-group');
    expect(form.checkValidity()).toBe(false);
    expect(b.validity.valueMissing).toBe(true);
    b.children[0].click();
    a.children[2].click();
    await settle();
    expect(form.checkValidity()).toBe(true);
    form.reset();
    await settle();
    expect(entries(form)).toEqual([['plan', 'pro']]);
    form.firstElementChild.disabled = true;
    await settle();
    expect(entries(form)).toEqual([]);
    expect(a.children[0].internals.ariaDisabled).toBe('true');
    a.children[0].click();
    expect(a.value).toBe('pro');
  });

  it('lays the cards in a row that wraps, or in a column', async () => {
    const wrap = await fixture(`<div style="inline-size: 900px">${group()}</div>`);
    const el = wrap.firstElementChild;
    const tops = () => [...el.children].map((c) => Math.round(c.getBoundingClientRect().top));
    expect(new Set(tops()).size).toBe(1);
    el.orientation = 'vertical';
    await settle();
    expect(new Set(tops()).size).toBe(3);
  });
});
