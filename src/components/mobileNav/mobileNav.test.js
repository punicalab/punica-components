import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './mobileNav.js';

const html = `<punica-mobile-nav label="Main menu">
  <button slot="trigger" type="button" id="trigger">Menu</button>
  <strong slot="header">Northwind</strong>
  <nav aria-label="Sections">
    <a href="#orders" id="orders">Orders</a>
    <a href="#customers" id="customers">Customers</a>
    <button type="button" id="action">Sync</button>
  </nav>
</punica-mobile-nav>`;
const native = (el) => el.shadowRoot.querySelector('dialog');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const instant = (el) => el.style.setProperty('--punica-duration-slow', '0ms');

contract('punica-mobile-nav', {
  html,
  open: async (el) => {
    el.show();
    await settle();
  }
});

describe('punica-mobile-nav', () => {
  afterEach(cleanup);

  it('opens from its trigger as a modal dialog named by label, with aria-expanded on the trigger', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('#trigger');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    const opened = once(el, 'punica-open');
    trigger.click();
    await opened;
    await settle();
    expect(el.open).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
    expect(native(el).matches(':modal')).toBe(true);
    expect(native(el).getAttribute('aria-label')).toBe('Main menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('is named Navigation by default and names its close button', async () => {
    const el = await fixture('<punica-mobile-nav><a href="#a">A</a></punica-mobile-nav>');
    el.show();
    await settle();
    expect(native(el).getAttribute('aria-label')).toBe('Navigation');
    const close = el.shadowRoot.querySelector('.close');
    expect(close.getAttribute('aria-label')).toBe('Close');
    el.labelClose = 'Kapat';
    await settle();
    expect(close.getAttribute('aria-label')).toBe('Kapat');
  });

  it('slides from the inline-start edge, the right one in RTL, and from inline-end when asked', async () => {
    const wrap = await fixture(`<div>${html}</div>`);
    const el = wrap.querySelector('punica-mobile-nav');
    instant(el);
    el.show();
    await settle();
    await wait(50);
    const rect = () => native(el).getBoundingClientRect();
    expect(Math.round(rect().left)).toBe(0);
    expect(Math.round(rect().width)).toBe(Math.min(320, Math.floor(window.innerWidth * 0.85)));
    expect(Math.round(rect().height)).toBe(window.innerHeight);
    wrap.dir = 'rtl';
    await settle();
    expect(Math.round(rect().right)).toBe(window.innerWidth);
    wrap.dir = 'ltr';
    el.side = 'inline-end';
    await settle();
    expect(Math.round(rect().right)).toBe(window.innerWidth);
  });

  it('traps focus, closes on a real Escape and gives focus back to the trigger', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('#trigger');
    trigger.focus();
    trigger.click();
    await settle();
    const inside = () => el.contains(document.activeElement) && document.activeElement !== trigger;
    expect(inside() || el.shadowRoot.activeElement !== null).toBe(true);
    for (let i = 0; i < 6; i++) {
      await userEvent.keyboard('{Tab}');
      expect(document.activeElement).not.toBe(trigger);
    }
    const asked = once(el, 'punica-request-close');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await asked).detail).toEqual({ reason: 'escape' });
    expect((await closed).detail).toEqual({ reason: 'escape', returnValue: '' });
    await settle();
    expect(el.open).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when a link inside is activated, and not for a button or with keep-open', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    el.querySelector('#action').click();
    await settle();
    expect(el.open).toBe(true);
    const asked = once(el, 'punica-request-close');
    const closed = once(el, 'punica-close');
    el.querySelector('#orders').click();
    expect((await asked).detail).toEqual({ reason: 'navigate' });
    expect((await closed).detail.reason).toBe('navigate');
    expect(el.open).toBe(false);

    el.keepOpen = true;
    el.show();
    await settle();
    el.querySelector('#customers').click();
    await settle();
    expect(el.open).toBe(true);

    el.keepOpen = false;
    const keep = (event) => event.preventDefault();
    el.addEventListener('punica-request-close', keep);
    el.querySelector('#customers').click();
    await settle();
    expect(el.open).toBe(true);
    el.removeEventListener('punica-request-close', keep);
  });

  it('closes on a link inside a shadow root, such as a side nav item', async () => {
    const el = await fixture(`<punica-mobile-nav><div id="host"></div></punica-mobile-nav>`);
    const root = el.querySelector('#host').attachShadow({ mode: 'open' });
    const a = document.createElement('a');
    a.href = '#deep';
    a.textContent = 'Deep';
    root.append(a);
    el.show();
    await settle();
    const closed = once(el, 'punica-close');
    a.click();
    expect((await closed).detail.reason).toBe('navigate');
  });

  it('closes from the close button and the backdrop', async () => {
    const el = await fixture(html);
    instant(el);
    el.show();
    await settle();
    let closed = once(el, 'punica-close');
    el.shadowRoot.querySelector('.close').click();
    expect((await closed).detail.reason).toBe('close-button');
    el.show();
    await settle();
    await wait(50);
    const rect = native(el).getBoundingClientRect();
    closed = once(el, 'punica-close');
    for (const type of ['pointerdown', 'click']) {
      native(el).dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, clientX: rect.right + 10, clientY: 10 }));
    }
    expect((await closed).detail.reason).toBe('backdrop');
  });

  it('hides the header row with no header and no close button, and opens again after a move', async () => {
    const el = await fixture('<punica-mobile-nav no-close-button><a href="#a">A</a></punica-mobile-nav>');
    expect(el.shadowRoot.querySelector('[part=header]').hidden).toBe(true);
    el.show();
    await settle();
    const parent = el.parentElement;
    el.remove();
    await settle();
    expect(native(el).open).toBe(false);
    parent.append(el);
    await settle();
    await settle();
    expect(el.open).toBe(true);
    expect(native(el).matches(':modal')).toBe(true);
    el.hide();
    await settle();
  });

  it('writes the label as text', async () => {
    const el = await fixture(html);
    el.label = '<img src=x onerror="window.__mobileNavXss = 1">';
    el.show();
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(native(el).getAttribute('aria-label')).toContain('<img');
    expect(window.__mobileNavXss).toBeUndefined();
  });
});
