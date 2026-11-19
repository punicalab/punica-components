import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './radioGroup.js';

const group = (attrs = '', first = '') => `<punica-radio-group label="Plan" ${attrs}>
  <punica-radio value="free" ${first}>Free</punica-radio>
  <punica-radio value="pro">Pro</punica-radio>
  <punica-radio value="team">Team</punica-radio>
</punica-radio-group>`;

contract('punica-radio', { html: '<punica-radio value="free" checked>Free</punica-radio>' });
contract('punica-radio-group', { html: group('name="plan" value="pro"') });

const entries = (form) => [...new FormData(form)];
const checked = (el) => [...el.children].map((r) => r.checked);
const focused = (el) => [...el.children].findIndex((r) => r.matches(':focus'));
const tabindexes = (el) => [...el.children].map((r) => r.getAttribute('tabindex'));

describe('punica-radio-group', () => {
  afterEach(cleanup);

  it('checks the radio its value names, with radiogroup and radio roles', async () => {
    const el = await fixture(group('value="pro" required'));
    expect(checked(el)).toEqual([false, true, false]);
    expect(el.internals.role).toBe('radiogroup');
    expect(el.internals.ariaLabel).toBe('Plan');
    expect(el.internals.ariaRequired).toBe('true');
    expect([...el.children].map((r) => [r.internals.role, r.internals.ariaChecked])).toEqual([
      ['radio', 'false'],
      ['radio', 'true'],
      ['radio', 'false']
    ]);
    expect(tabindexes(el)).toEqual(['-1', '0', '-1']);
  });

  it('takes its first value from a checked radio when it has none', async () => {
    const el = await fixture(group('', 'checked'));
    expect(el.value).toBe('free');
    expect(tabindexes(el)).toEqual(['0', '-1', '-1']);
  });

  it('has one tab stop; arrows, Home and End move and select', async () => {
    const wrap = await fixture(`<div>${group('value="pro"')}<button>after</button></div>`);
    const el = wrap.firstElementChild;
    const seen = [];
    wrap.addEventListener('punica-change', (e) => seen.push([e.target.localName, e.detail, e.bubbles, e.composed]));
    await userEvent.tab();
    expect(focused(el)).toBe(1);
    await userEvent.keyboard('{ArrowDown}');
    expect(focused(el)).toBe(2);
    expect(el.value).toBe('team');
    await userEvent.keyboard('{ArrowRight}');
    expect(el.value).toBe('free');
    await userEvent.keyboard('{ArrowUp}');
    expect(el.value).toBe('team');
    await userEvent.keyboard('{Home}');
    expect(el.value).toBe('free');
    await userEvent.keyboard('{End}');
    expect(el.value).toBe('team');
    expect(checked(el)).toEqual([false, false, true]);
    expect(seen[0]).toEqual(['punica-radio-group', { value: 'team' }, true, true]);
    expect(seen.map((s) => s[1].value)).toEqual(['team', 'free', 'team', 'free', 'team']);
    await userEvent.tab();
    expect(document.activeElement).toBe(wrap.querySelector('button'));
    await userEvent.tab({ shift: true });
    expect(focused(el)).toBe(2);
  });

  it('selects the focused radio on Space when nothing is chosen', async () => {
    const el = await fixture(group());
    await userEvent.tab();
    expect(focused(el)).toBe(0);
    expect(el.value).toBe('');
    await userEvent.keyboard(' ');
    expect(el.value).toBe('free');
  });

  it('mirrors the horizontal arrows in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${group('value="free" orientation="horizontal"')}</div>`);
    const el = wrap.firstElementChild;
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(el.value).toBe('pro');
    expect(el.internals.ariaOrientation).toBe('horizontal');
  });

  it('selects on click, fires once, and fires nothing on a programmatic change', async () => {
    const el = await fixture(group());
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail));
    el.children[1].click();
    el.children[1].click();
    await settle();
    expect(seen).toEqual([{ value: 'pro' }]);
    el.value = 'team';
    await settle();
    expect(checked(el)).toEqual([false, false, true]);
    expect(seen.length).toBe(1);
  });

  it('skips a disabled radio and takes nothing while the group is disabled', async () => {
    const el = await fixture(group('value="free"'));
    el.children[1].disabled = true;
    await settle();
    el.children[1].click();
    expect(el.value).toBe('free');
    expect(el.children[1].internals.ariaDisabled).toBe('true');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(el.value).toBe('team');
    el.disabled = true;
    await settle();
    el.children[0].click();
    expect(el.value).toBe('team');
    expect(tabindexes(el)).toEqual([null, null, null]);
    expect(el.children[0].matches(':state(disabled)')).toBe(true);
  });

  it('appears in the form data, and is left out when empty or disabled', async () => {
    const form = await fixture(`<form>${group('name="plan" value="pro"')}${group('name="none"')}</form>`);
    await settle();
    expect(entries(form)).toEqual([['plan', 'pro']]);
    form.firstElementChild.disabled = true;
    await settle();
    expect(entries(form)).toEqual([]);
  });

  it('goes back to the value attribute, or to its first state, on form.reset()', async () => {
    const form = await fixture(`<form>${group('name="a" value="pro"')}${group('name="b"', 'checked')}${group('name="c"')}</form>`);
    const [a, b, c] = form.children;
    a.children[2].click();
    b.children[2].click();
    c.children[2].click();
    await settle();
    expect(entries(form)).toEqual([['a', 'team'], ['b', 'team'], ['c', 'team']]);
    form.reset();
    await settle();
    expect(entries(form)).toEqual([['a', 'pro'], ['b', 'free']]);
    expect(checked(a)).toEqual([false, true, false]);
    expect(checked(c)).toEqual([false, false, false]);
  });

  it('blocks checkValidity() when required and nothing is chosen', async () => {
    const form = await fixture(`<form>${group('name="a" required')}</form>`);
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage.trim()).not.toBe('');
    el.children[0].click();
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture(`<form><fieldset disabled>${group('name="a" value="free"')}</fieldset></form>`);
    await settle();
    const el = form.querySelector('punica-radio-group');
    expect(el.isDisabled).toBe(true);
    expect(el.children[0].internals.ariaDisabled).toBe('true');
    el.children[1].click();
    expect(el.value).toBe('free');
    expect(entries(form)).toEqual([]);
  });
});
