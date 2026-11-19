import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './toggleButton.js';

contract('punica-toggle-button', { html: '<punica-toggle-button value="bold" pressed>Bold</punica-toggle-button>' });

const entries = (form) => [...new FormData(form)];

describe('punica-toggle-button', () => {
  afterEach(cleanup);

  it('is a native button with aria-pressed that Space and Enter toggle', async () => {
    const el = await fixture('<punica-toggle-button value="bold">Bold</punica-toggle-button>');
    const inner = el.shadowRoot.querySelector('button');
    expect(inner.getAttribute('aria-pressed')).toBe('false');
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push([e.detail, e.bubbles, e.composed]));
    await userEvent.tab();
    expect(el.matches(':focus')).toBe(true);
    await userEvent.keyboard(' ');
    await settle();
    expect(el.pressed).toBe(true);
    expect(el.hasAttribute('pressed')).toBe(true);
    expect(inner.getAttribute('aria-pressed')).toBe('true');
    expect(el.matches(':state(pressed)')).toBe(true);
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(el.pressed).toBe(false);
    expect(seen).toEqual([
      [{ pressed: true, checked: true, value: 'bold' }, true, true],
      [{ pressed: false, checked: false, value: 'bold' }, true, true]
    ]);
  });

  it('fires nothing on a programmatic change and takes no click while disabled', async () => {
    const el = await fixture('<punica-toggle-button disabled>Bold</punica-toggle-button>');
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.pressed).toBe(false);
    el.pressed = true;
    await settle();
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-pressed')).toBe('true');
    expect(fired).toBe(0);
  });

  it('names an icon-only button from label', async () => {
    const el = await fixture('<punica-toggle-button label="Bold"></punica-toggle-button>');
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-label')).toBe('Bold');
  });

  it('appears in the form data only while pressed, and is left out when disabled', async () => {
    const form = await fixture('<form><punica-toggle-button name="a" value="x">A</punica-toggle-button><punica-toggle-button name="b" pressed>B</punica-toggle-button><punica-toggle-button name="c" pressed disabled>C</punica-toggle-button></form>');
    expect(entries(form)).toEqual([['b', 'on']]);
    form.firstElementChild.click();
    await settle();
    expect(entries(form)).toEqual([['a', 'x'], ['b', 'on']]);
  });

  it('goes back to its first state on form.reset()', async () => {
    const form = await fixture('<form><punica-toggle-button name="a">A</punica-toggle-button><punica-toggle-button name="b" pressed>B</punica-toggle-button></form>');
    const [a, b] = form.children;
    a.click();
    b.click();
    await settle();
    form.reset();
    await settle();
    expect([a.pressed, b.pressed]).toEqual([false, true]);
    expect(entries(form)).toEqual([['b', 'on']]);
  });

  it('blocks checkValidity() when required and not pressed', async () => {
    const form = await fixture('<form><punica-toggle-button name="a" required>A</punica-toggle-button></form>');
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    el.click();
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-toggle-button name="a" pressed>A</punica-toggle-button></fieldset></form>');
    await settle();
    expect(form.querySelector('punica-toggle-button').shadowRoot.querySelector('button').disabled).toBe(true);
    expect(entries(form)).toEqual([]);
  });
});
