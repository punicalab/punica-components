import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './checkbox.js';

contract('punica-checkbox', {
  html: '<punica-checkbox name="terms" checked>Accept the terms</punica-checkbox>'
});
contract('punica-checkbox', {
  html: '<punica-checkbox label="Select row"></punica-checkbox>'
});

const entries = (form) => [...new FormData(form)];

describe('punica-checkbox', () => {
  afterEach(cleanup);

  it('is named by an aria-label on the element, label first', async () => {
    const el = await fixture(
      '<punica-checkbox aria-label="Hook token"></punica-checkbox>'
    );
    await settle();
    const inner = el.shadowRoot.querySelector('input');
    expect(inner.getAttribute('aria-label')).toBe('Hook token');
    el.label = 'Token';
    await settle();
    expect(inner.getAttribute('aria-label')).toBe('Token');
  });

  it('is a native checkbox reached by Tab and toggled by Space', async () => {
    const el = await fixture('<punica-checkbox>Accept</punica-checkbox>');
    const input = el.shadowRoot.querySelector('input');
    expect(input.type).toBe('checkbox');
    const seen = [];
    el.addEventListener('punica-change', (e) =>
      seen.push([e.detail, e.bubbles, e.composed])
    );
    await userEvent.tab();
    expect(el.matches(':focus')).toBe(true);
    await userEvent.keyboard(' ');
    expect(el.checked).toBe(true);
    expect(el.hasAttribute('checked')).toBe(true);
    expect(el.matches(':state(checked)')).toBe(true);
    await userEvent.keyboard(' ');
    expect(el.checked).toBe(false);
    expect(el.hasAttribute('checked')).toBe(false);
    expect(seen).toEqual([
      [{ checked: true, value: 'on' }, true, true],
      [{ checked: false, value: 'on' }, true, true]
    ]);
  });

  it('toggles from a click on its label text, and fires nothing on a programmatic change', async () => {
    const el = await fixture(
      '<punica-checkbox value="yes"><span id="t">Accept</span></punica-checkbox>'
    );
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail));
    el.querySelector('#t').click();
    expect(el.checked).toBe(true);
    expect(seen).toEqual([{ checked: true, value: 'yes' }]);
    el.checked = false;
    await settle();
    expect(el.shadowRoot.querySelector('input').checked).toBe(false);
    expect(seen.length).toBe(1);
  });

  it('keeps attribute, property and native state together; "false" is still checked', async () => {
    const el = await fixture(
      '<punica-checkbox checked="false">Accept</punica-checkbox>'
    );
    const input = el.shadowRoot.querySelector('input');
    expect(el.checked).toBe(true);
    expect(input.checked).toBe(true);
    el.removeAttribute('checked');
    await settle();
    expect(el.checked).toBe(false);
    expect(input.checked).toBe(false);
    el.checked = true;
    await settle();
    expect(el.hasAttribute('checked')).toBe(true);
    expect(input.checked).toBe(true);
  });

  it('shows indeterminate as mixed until the user toggles', async () => {
    const el = await fixture(
      '<punica-checkbox indeterminate>All</punica-checkbox>'
    );
    const input = el.shadowRoot.querySelector('input');
    expect(input.indeterminate).toBe(true);
    expect(el.matches(':state(indeterminate)')).toBe(true);
    input.click();
    await settle();
    expect(el.indeterminate).toBe(false);
    expect(el.hasAttribute('indeterminate')).toBe(false);
    expect(el.checked).toBe(true);
  });

  it('is toggled and named by a <label for>', async () => {
    const wrap = await fixture(
      '<div><label for="c1">Remember me</label><punica-checkbox id="c1"></punica-checkbox></div>'
    );
    const el = wrap.querySelector('punica-checkbox');
    expect(
      el.shadowRoot.querySelector('input').getAttribute('aria-label')
    ).toBe('Remember me');
    expect(el.shadowRoot.querySelector('[part=label]').hidden).toBe(true);
    wrap.querySelector('label').click();
    expect(el.checked).toBe(true);
  });

  it('takes no toggle while disabled', async () => {
    const el = await fixture(
      '<punica-checkbox disabled>Accept</punica-checkbox>'
    );
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.checked).toBe(false);
  });

  it('appears in the form data only while checked, with value "on" by default', async () => {
    const form = await fixture(
      '<form><punica-checkbox name="a">A</punica-checkbox><punica-checkbox name="b" value="yes" checked>B</punica-checkbox></form>'
    );
    expect(entries(form)).toEqual([['b', 'yes']]);
    form.firstElementChild.click();
    await settle();
    expect(entries(form)).toEqual([
      ['a', 'on'],
      ['b', 'yes']
    ]);
  });

  it('is left out of the form data when disabled', async () => {
    const form = await fixture(
      '<form><punica-checkbox name="b" checked disabled>B</punica-checkbox></form>'
    );
    expect(entries(form)).toEqual([]);
  });

  it('goes back to its first state on form.reset()', async () => {
    const form = await fixture(
      '<form><punica-checkbox name="a">A</punica-checkbox><punica-checkbox name="b" checked>B</punica-checkbox></form>'
    );
    const [a, b] = form.children;
    a.click();
    b.click();
    await settle();
    expect(entries(form)).toEqual([['a', 'on']]);
    form.reset();
    await settle();
    expect([a.checked, b.checked]).toEqual([false, true]);
    expect(entries(form)).toEqual([['b', 'on']]);
  });

  it('blocks checkValidity() when required and not checked', async () => {
    const form = await fixture(
      '<form><punica-checkbox name="a" required>A</punica-checkbox></form>'
    );
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage).not.toBe('');
    el.click();
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture(
      '<form><fieldset disabled><punica-checkbox name="a" checked>A</punica-checkbox></fieldset></form>'
    );
    await settle();
    expect(
      form.querySelector('punica-checkbox').shadowRoot.querySelector('input')
        .disabled
    ).toBe(true);
    expect(entries(form)).toEqual([]);
  });
});
