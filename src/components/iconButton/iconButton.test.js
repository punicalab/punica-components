import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './iconButton.js';

const html = '<punica-icon-button label="Close"><svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path d="M6 6l12 12"/></svg></punica-icon-button>';

contract('punica-icon-button', { html });

describe('punica-icon-button', () => {
  afterEach(cleanup);

  it('takes its accessible name from label on a native button', async () => {
    const el = await fixture(html);
    const inner = el.shadowRoot.querySelector('button');
    expect(inner.getAttribute('aria-label')).toBe('Close');
    el.label = null;
    await settle();
    expect(inner.hasAttribute('aria-label')).toBe(false);
    expect(el.hasAttribute('label')).toBe(false);
  });

  it('is reached by Tab and activated by Enter and Space', async () => {
    const el = await fixture(html);
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    await userEvent.tab();
    expect(el.matches(':focus')).toBe(true);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicks).toBe(2);
  });

  it('takes no click and no focus while disabled, and "false" is still disabled', async () => {
    const el = await fixture('<punica-icon-button label="Close" disabled="false">x</punica-icon-button>');
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicks).toBe(0);
    expect(el.disabled).toBe(true);
    await userEvent.tab();
    expect(el.matches(':focus')).toBe(false);
  });

  it('ignores clicks and says busy while loading', async () => {
    const el = await fixture('<punica-icon-button label="Save" loading>s</punica-icon-button>');
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicks).toBe(0);
    const inner = el.shadowRoot.querySelector('button');
    expect([inner.getAttribute('aria-busy'), inner.getAttribute('aria-disabled'), inner.disabled]).toEqual(['true', 'true', false]);
    el.loading = false;
    await settle();
    el.click();
    expect(clicks).toBe(1);
  });

  it('submits its form with its name and value, and resets it', async () => {
    const form = await fixture(
      `<form><input name="a" value="1">
        <punica-icon-button type="submit" name="go" value="yes" label="Go">g</punica-icon-button>
        <punica-icon-button type="reset" label="Reset">r</punica-icon-button></form>`
    );
    let data;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      data = Object.fromEntries(new FormData(form));
    });
    const [go, reset] = form.querySelectorAll('punica-icon-button');
    go.click();
    expect(data).toEqual({ a: '1', go: 'yes' });
    expect(Object.fromEntries(new FormData(form))).toEqual({ a: '1' });
    form.querySelector('input').value = 'changed';
    reset.click();
    expect(form.querySelector('input').value).toBe('1');
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-icon-button label="Go">g</punica-icon-button></fieldset></form>');
    await settle();
    expect(form.querySelector('punica-icon-button').shadowRoot.querySelector('button').disabled).toBe(true);
  });
});
