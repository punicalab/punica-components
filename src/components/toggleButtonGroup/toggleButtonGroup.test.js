import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './toggleButtonGroup.js';

const group = (attrs = '', inner = '') => `<punica-toggle-button-group label="Alignment" ${attrs}>
  <punica-toggle-button value="left" ${inner}>Left</punica-toggle-button>
  <punica-toggle-button value="center">Center</punica-toggle-button>
  <punica-toggle-button value="right">Right</punica-toggle-button>
</punica-toggle-button-group>`;

contract('punica-toggle-button-group', { html: group('name="align" value="center"') });

const entries = (form) => [...new FormData(form)];
const pressed = (el) => [...el.children].map((b) => b.pressed);
const focused = (el) => [...el.children].findIndex((b) => b.matches(':focus'));

describe('punica-toggle-button-group', () => {
  afterEach(cleanup);

  it('presses the button its value names and is a labelled toolbar', async () => {
    const el = await fixture(group('value="center"'));
    expect(pressed(el)).toEqual([false, true, false]);
    expect(el.internals.role).toBe('toolbar');
    expect(el.internals.ariaLabel).toBe('Alignment');
    expect(el.attributes.role).toBe(undefined);
  });

  it('takes its first value from a pressed button when it has none', async () => {
    const el = await fixture(group('', 'pressed'));
    expect(el.value).toBe('left');
    expect(pressed(el)).toEqual([true, false, false]);
  });

  it('has one tab stop; arrows, Home and End move focus and Space presses', async () => {
    const wrap = await fixture(`<div>${group('value="center"')}<button>after</button></div>`);
    const el = wrap.firstElementChild;
    const seen = [];
    wrap.addEventListener('punica-change', (e) => seen.push([e.target.localName, e.detail]));
    await userEvent.tab();
    expect(focused(el)).toBe(1);
    await userEvent.keyboard('{ArrowRight}');
    expect(focused(el)).toBe(2);
    await userEvent.keyboard('{ArrowRight}');
    expect(focused(el)).toBe(0);
    await userEvent.keyboard('{End}');
    expect(focused(el)).toBe(2);
    await userEvent.keyboard('{Home}');
    expect(focused(el)).toBe(0);
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused(el)).toBe(2);
    expect(el.value).toBe('center');
    await userEvent.keyboard(' ');
    await settle();
    expect(el.value).toBe('right');
    expect(pressed(el)).toEqual([false, false, true]);
    expect(seen).toEqual([['punica-toggle-button-group', { value: 'right', values: ['right'] }]]);
    await userEvent.tab();
    expect(document.activeElement).toBe(wrap.querySelector('button'));
    await userEvent.tab({ shift: true });
    expect(focused(el)).toBe(2);
  });

  it('mirrors the arrow keys in RTL and follows a vertical orientation', async () => {
    const wrap = await fixture(`<div dir="rtl">${group()}</div>`);
    const el = wrap.firstElementChild;
    await userEvent.tab();
    expect(focused(el)).toBe(0);
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused(el)).toBe(1);
    el.orientation = 'vertical';
    await settle();
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused(el)).toBe(1);
    await userEvent.keyboard('{ArrowDown}');
    expect(focused(el)).toBe(2);
    expect(el.internals.ariaOrientation).toBe('vertical');
  });

  it('releases the pressed button on a second click, leaving the value empty', async () => {
    const el = await fixture(group('value="left"'));
    el.children[0].click();
    await settle();
    expect(el.value).toBe('');
    expect(pressed(el)).toEqual([false, false, false]);
  });

  it('holds several values with multiple and fires nothing on a programmatic change', async () => {
    const el = await fixture(group('multiple value="left right"'));
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail));
    expect(pressed(el)).toEqual([true, false, true]);
    expect(el.values).toEqual(['left', 'right']);
    el.children[1].click();
    await settle();
    expect(el.value).toBe('left center right');
    expect(seen).toEqual([{ value: 'left center right', values: ['left', 'center', 'right'] }]);
    el.values = ['center'];
    await settle();
    expect(pressed(el)).toEqual([false, true, false]);
    expect(seen.length).toBe(1);
  });

  it('skips a disabled button and disables every button when the group is disabled', async () => {
    const el = await fixture(group());
    el.children[1].disabled = true;
    await settle();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused(el)).toBe(2);
    el.disabled = true;
    await settle();
    expect([...el.children].map((b) => b.shadowRoot.querySelector('button').disabled)).toEqual([true, true, true]);
    el.children[0].click();
    expect(el.value).toBe('');
  });

  it('appears in the form data, one entry per value, and is left out when disabled', async () => {
    const form = await fixture(`<form>${group('name="align" value="center"')}${group('name="many" multiple value="left right"')}</form>`);
    await settle();
    expect(entries(form)).toEqual([['align', 'center'], ['many', 'left'], ['many', 'right']]);
    form.children[0].disabled = true;
    form.children[1].disabled = true;
    await settle();
    expect(entries(form)).toEqual([]);
  });

  it('goes back to the value attribute, or to its first state, on form.reset()', async () => {
    const form = await fixture(`<form>${group('name="a" value="center"')}${group('name="b"', 'pressed')}</form>`);
    const [a, b] = form.children;
    a.children[2].click();
    b.children[1].click();
    await settle();
    expect(entries(form)).toEqual([['a', 'right'], ['b', 'center']]);
    form.reset();
    await settle();
    expect(entries(form)).toEqual([['a', 'center'], ['b', 'left']]);
    expect(pressed(a)).toEqual([false, true, false]);
    expect(pressed(b)).toEqual([true, false, false]);
  });

  it('blocks checkValidity() when required and nothing is pressed', async () => {
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
    const form = await fixture(`<form><fieldset disabled>${group('name="a" value="left"')}</fieldset></form>`);
    await settle();
    const el = form.querySelector('punica-toggle-button-group');
    expect([...el.children].every((b) => b.shadowRoot.querySelector('button').disabled)).toBe(true);
    expect(entries(form)).toEqual([]);
  });
});
