import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './switch.js';

contract('punica-switch', { html: '<punica-switch name="wifi" checked label-on="On" label-off="Off">Wi-Fi</punica-switch>' });
contract('punica-switch', { html: '<punica-switch label="Dark mode"></punica-switch>' });

const entries = (form) => [...new FormData(form)];

describe('punica-switch', () => {
  afterEach(cleanup);

  it('is one role=switch element that Space and Enter toggle', async () => {
    const el = await fixture('<punica-switch>Wi-Fi</punica-switch>');
    const inner = el.shadowRoot.querySelector('button');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.shadowRoot.querySelectorAll('[role]').length).toBe(1);
    expect(inner.getAttribute('role')).toBe('switch');
    expect(inner.getAttribute('aria-checked')).toBe('false');
    expect(el.shadowRoot.querySelector('input')).toBe(null);
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push([e.detail, e.bubbles, e.composed]));
    await userEvent.tab();
    expect(el.matches(':focus')).toBe(true);
    await userEvent.keyboard(' ');
    await settle();
    expect(el.checked).toBe(true);
    expect(el.hasAttribute('checked')).toBe(true);
    expect(inner.getAttribute('aria-checked')).toBe('true');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(el.checked).toBe(false);
    expect(inner.getAttribute('aria-checked')).toBe('false');
    expect(seen).toEqual([
      [{ checked: true, value: 'on' }, true, true],
      [{ checked: false, value: 'on' }, true, true]
    ]);
  });

  it('is named by its content or label, never by a built-in string', async () => {
    const el = await fixture('<punica-switch>Wi-Fi</punica-switch>');
    const inner = el.shadowRoot.querySelector('button');
    expect(inner.hasAttribute('aria-label')).toBe(false);
    el.label = 'Wireless';
    await settle();
    expect(inner.getAttribute('aria-label')).toBe('Wireless');
  });

  it('shows the on and off texts from label-on and label-off', async () => {
    const el = await fixture('<punica-switch label="Power" label-on="On" label-off="Off"></punica-switch>');
    const on = el.shadowRoot.querySelector('[part=label-on]');
    const off = el.shadowRoot.querySelector('[part=label-off]');
    expect([on.textContent, on.hidden, off.textContent, off.hidden]).toEqual(['On', false, 'Off', false]);
    el.labelOn = null;
    await settle();
    expect(on.hidden).toBe(true);
    expect(el.hasAttribute('label-on')).toBe(false);
  });

  it('keeps working after being moved in the DOM', async () => {
    const wrap = await fixture('<div><punica-switch>Wi-Fi</punica-switch><p></p></div>');
    const el = wrap.querySelector('punica-switch');
    wrap.querySelector('p').appendChild(el);
    await settle();
    el.click();
    await settle();
    expect(el.checked).toBe(true);
    expect(el.internals).toBeTruthy();
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-checked')).toBe('true');
  });

  it('moves its thumb to the inline end, mirrored in RTL', async () => {
    const wrap = await fixture('<div><punica-switch checked label="A"></punica-switch><div dir="rtl"><punica-switch checked label="B"></punica-switch></div></div>');
    const [ltr, rtl] = wrap.querySelectorAll('punica-switch');
    const offset = (el) => {
      const track = el.shadowRoot.querySelector('.track').getBoundingClientRect();
      const thumb = el.shadowRoot.querySelector('.thumb').getBoundingClientRect();
      return (thumb.left + thumb.width / 2) - (track.left + track.width / 2);
    };
    await new Promise((r) => setTimeout(r, 200));
    expect(offset(ltr)).toBeGreaterThan(0);
    expect(offset(rtl)).toBeLessThan(0);
  });

  it('treats checked="false" as checked and takes no toggle while disabled', async () => {
    const el = await fixture('<punica-switch checked="false" disabled>Wi-Fi</punica-switch>');
    expect(el.checked).toBe(true);
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.checked).toBe(true);
  });

  it('is toggled by a <label for>', async () => {
    const wrap = await fixture('<div><label for="s1">Sync</label><punica-switch id="s1"></punica-switch></div>');
    const el = wrap.querySelector('punica-switch');
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-label')).toBe('Sync');
    wrap.querySelector('label').click();
    expect(el.checked).toBe(true);
  });

  it('appears in the form data only while on, and is left out when disabled', async () => {
    const form = await fixture('<form><punica-switch name="a">A</punica-switch><punica-switch name="b" value="yes" checked>B</punica-switch><punica-switch name="c" checked disabled>C</punica-switch></form>');
    expect(entries(form)).toEqual([['b', 'yes']]);
    form.firstElementChild.click();
    await settle();
    expect(entries(form)).toEqual([['a', 'on'], ['b', 'yes']]);
  });

  it('goes back to its first state on form.reset()', async () => {
    const form = await fixture('<form><punica-switch name="a">A</punica-switch><punica-switch name="b" checked>B</punica-switch></form>');
    const [a, b] = form.children;
    a.click();
    b.click();
    await settle();
    form.reset();
    await settle();
    expect([a.checked, b.checked]).toEqual([false, true]);
    expect(entries(form)).toEqual([['b', 'on']]);
  });

  it('blocks checkValidity() when required and off', async () => {
    const form = await fixture('<form><punica-switch name="a" required>A</punica-switch></form>');
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage.trim()).not.toBe('');
    el.click();
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-switch name="a" checked>A</punica-switch></fieldset></form>');
    await settle();
    expect(form.querySelector('punica-switch').shadowRoot.querySelector('button').disabled).toBe(true);
    expect(entries(form)).toEqual([]);
  });
});
