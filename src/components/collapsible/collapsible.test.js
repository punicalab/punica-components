import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './collapsible.js';

const html = `<punica-collapsible>
  <button slot="trigger">Shipping details</button>
  <p>Ships in two days. <a href="#track">Track</a></p>
</punica-collapsible>`;

contract('punica-collapsible', { html });

describe('punica-collapsible', () => {
  afterEach(cleanup);

  it('is created by createElement', () => {
    expect(document.createElement('punica-collapsible').open).toBe(false);
  });

  it('wires aria-expanded and aria-controls on the trigger', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('button');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(el.id);
    expect(el.id).not.toBe('');
  });

  it('keeps an id the author gave', async () => {
    const el = await fixture(html.replace('<punica-collapsible', '<punica-collapsible id="ship"'));
    expect(el.querySelector('button').getAttribute('aria-controls')).toBe('ship');
  });

  it('toggles on a trigger click and fires punica-toggle with open', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('button');
    const content = el.shadowRoot.querySelector('[part=content]');
    expect(getComputedStyle(content).visibility).toBe('hidden');
    let event = once(el, 'punica-toggle');
    trigger.click();
    expect((await event).detail).toEqual({ open: true });
    await settle();
    expect(el.open).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(getComputedStyle(content).visibility).toBe('visible');
    event = once(el, 'punica-toggle');
    trigger.click();
    expect((await event).detail).toEqual({ open: false });
  });

  it('is operated by the keyboard through the native button', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('button');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    // Enter and Space on a native button are a click.
    trigger.click();
    await settle();
    expect(el.open).toBe(true);
  });

  it('fires nothing for a programmatic change', async () => {
    const el = await fixture(html);
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    el.open = true;
    el.toggle();
    el.show();
    el.hide();
    await settle();
    expect(fired).toBe(0);
    expect(el.open).toBe(false);
  });

  it('does not toggle while disabled', async () => {
    const el = await fixture(html.replace('<punica-collapsible', '<punica-collapsible disabled'));
    el.querySelector('button').click();
    await settle();
    expect(el.open).toBe(false);
  });

  it('hides closed content from focus', async () => {
    const el = await fixture(html);
    const link = el.querySelector('a');
    link.focus();
    expect(document.activeElement).not.toBe(link);
    el.open = true;
    await settle();
    link.focus();
    expect(document.activeElement).toBe(link);
  });
});
