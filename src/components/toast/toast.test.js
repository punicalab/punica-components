import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './toast.js';
import '../button/button.js';
import { toast } from './toaster.js';

const html = `<punica-toaster>
  <punica-toast color="info" duration="0">Saved</punica-toast>
</punica-toaster>`;
const still = '--punica-duration:0ms;--punica-duration-slow:0ms';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const region = (el) => el.shadowRoot.querySelector('[part=region]');

// color-contrast is off in the contract run only: a toast fades in as soon as
// it connects and axe samples it half transparent. Both elements are checked
// with the rule on, after the transition, in the tests below.
contract('punica-toaster', { html, axeDisable: ['color-contrast'] });
contract('punica-toast', { html: '<punica-toast duration="0">Saved</punica-toast>', axeDisable: ['color-contrast'] });

describe('punica-toaster', () => {
  afterEach(() => {
    cleanup();
    document.querySelectorAll('punica-toaster').forEach((el) => el.remove());
  });

  it('is a polite live region in the top layer while it holds a toast', async () => {
    const el = await fixture(html);
    await settle();
    const r = region(el);
    expect(r.getAttribute('role')).toBe('region');
    expect(r.getAttribute('aria-live')).toBe('polite');
    expect(r.getAttribute('aria-label')).toBe('Notifications');
    expect(r.getAttribute('popover')).toBe('manual');
    expect(r.matches(':popover-open')).toBe(true);
    await wait(400);
    expect(await a11y(el.parentElement)).toEqual([]);
    el.querySelector('punica-toast').remove();
    await settle();
    expect(r.matches(':popover-open')).toBe(false);
  });

  it('places the region by logical position', async () => {
    const el = await fixture(html);
    await settle();
    const toastEl = el.querySelector('punica-toast');
    const rect = () => toastEl.getBoundingClientRect();
    expect(window.innerWidth - rect().right).toBeLessThan(20);
    expect(window.innerHeight - rect().bottom).toBeLessThan(20);
    el.position = 'block-start-start';
    await settle();
    expect(rect().left).toBeLessThan(20);
    expect(rect().top).toBeLessThan(20);
    el.position = 'block-start-center';
    await settle();
    expect(Math.abs(rect().left + rect().width / 2 - window.innerWidth / 2)).toBeLessThan(2);
    el.position = 'block-end-start';
    el.parentElement.dir = 'rtl';
    await settle();
    expect(window.innerWidth - rect().right).toBeLessThan(20);
    expect(window.innerHeight - rect().bottom).toBeLessThan(20);
  });

  it('toast() finds or creates the toaster, sets the message as text and returns the toast', async () => {
    expect(window.Toast).toBeUndefined();
    const first = toast('<img src=x onerror="window.__toastXss = 1">', { color: 'error', duration: 0, labelClose: 'Kapat' });
    await settle();
    const toaster = document.querySelector('punica-toaster');
    expect(toaster.parentElement).toBe(document.body);
    expect(first.localName).toBe('punica-toast');
    expect(first.parentElement).toBe(toaster);
    expect(first.querySelector('img')).toBe(null);
    expect(first.textContent).toBe('<img src=x onerror="window.__toastXss = 1">');
    expect(first.color).toBe('error');
    expect(first.duration).toBe(0);
    expect(first.shadowRoot.querySelector('.close').getAttribute('aria-label')).toBe('Kapat');
    const second = toast('Second', { duration: 0 });
    expect(document.querySelectorAll('punica-toaster').length).toBe(1);
    expect(second.parentElement).toBe(toaster);
    const own = await fixture('<div><punica-toaster position="block-start-end"></punica-toaster></div>');
    const third = toast('Third', { toaster: own.firstElementChild, duration: 0 });
    expect(third.parentElement).toBe(own.firstElementChild);
    await wait(20);
    expect(window.__toastXss).toBeUndefined();
  });
});

describe('punica-toast', () => {
  afterEach(cleanup);

  it('has no axe violations once it has faded in, in every colour that passes AA', async () => {
    const wrap = await fixture(
      `<div>${['neutral', 'primary', 'secondary', 'error', 'info', 'success']
        .map((color) => `<punica-toast color="${color}" duration="0">Saved</punica-toast>`)
        .join('')}</div>`
    );
    await wait(400);
    expect(await a11y(wrap)).toEqual([]);
  });

  it('draws an action button in the toast colour, readable on every accent', async () => {
    const wrap = await fixture(
      `<div style="${still}">${['neutral', 'primary', 'error', 'success']
        .map((color) => `<punica-toast color="${color}" duration="0">Archived<punica-button slot="action" variant="text" size="small">Undo</punica-button></punica-toast>`)
        .join('')}</div>`
    );
    await wait(50);
    for (const t of wrap.querySelectorAll('punica-toast')) {
      const label = getComputedStyle(t.querySelector('punica-button').shadowRoot.querySelector('button')).color;
      expect(label).toBe(getComputedStyle(t.shadowRoot.querySelector('[part=base]')).color);
    }
    expect(await a11y(wrap)).toEqual([]);
  });

  it('goes away after its duration and reports why', async () => {
    const wrap = await fixture(`<div style="${still}"><punica-toast duration="60">Saved</punica-toast></div>`);
    const el = wrap.firstElementChild;
    const dismissed = once(el, 'punica-dismiss');
    expect((await dismissed).detail).toEqual({ reason: 'timeout' });
    await settle();
    expect(el.isConnected).toBe(false);
  });

  it('is dismissed by its close button and by Escape, by keyboard', async () => {
    const wrap = await fixture(
      `<div style="${still}"><punica-toast duration="0">One</punica-toast><punica-toast duration="0">Two</punica-toast></div>`
    );
    const [a, b] = wrap.querySelectorAll('punica-toast');
    const button = a.shadowRoot.querySelector('.close');
    expect(button.getAttribute('aria-label')).toBe('Close');
    expect(button.localName).toBe('button');
    button.focus();
    expect(a.shadowRoot.activeElement).toBe(button);
    const first = once(a, 'punica-dismiss');
    button.click();
    expect((await first).detail).toEqual({ reason: 'user' });
    await settle();
    expect(a.isConnected).toBe(false);
    // The other toast is untouched.
    expect(b.isConnected).toBe(true);
    const second = once(b, 'punica-dismiss');
    const close = b.shadowRoot.querySelector('.close');
    close.focus();
    close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true }));
    expect((await second).detail).toEqual({ reason: 'user' });
    await settle();
    expect(b.isConnected).toBe(false);
  });

  it('pauses while hovered or focused and resumes after', async () => {
    const wrap = await fixture(`<div style="${still}"><punica-toast duration="120">Saved</punica-toast></div>`);
    const el = wrap.firstElementChild;
    const base = el.shadowRoot.querySelector('[part=base]');
    base.dispatchEvent(new PointerEvent('pointerenter'));
    expect(el.paused).toBe(true);
    await wait(220);
    expect(el.isConnected).toBe(true);
    el.shadowRoot.querySelector('.close').focus();
    base.dispatchEvent(new PointerEvent('pointerleave'));
    // Focus still holds it.
    expect(el.paused).toBe(true);
    await wait(220);
    expect(el.isConnected).toBe(true);
    const dismissed = once(el, 'punica-dismiss');
    el.shadowRoot.querySelector('.close').blur();
    expect(el.paused).toBe(false);
    expect((await dismissed).detail.reason).toBe('timeout');
  });

  it('keeps its timer to itself: removal stops it, dismiss() fires nothing', async () => {
    const wrap = await fixture(`<div style="${still}"><punica-toast duration="50">A</punica-toast><punica-toast duration="0">B</punica-toast></div>`);
    const [a, b] = wrap.querySelectorAll('punica-toast');
    let events = 0;
    wrap.addEventListener('punica-dismiss', () => events++);
    a.remove();
    b.dismiss();
    await wait(120);
    expect(events).toBe(0);
    expect(b.isConnected).toBe(false);
  });

  it('waits for the exit transition before it leaves', async () => {
    const wrap = await fixture('<div style="--punica-duration-slow:80ms"><punica-toast duration="0">Saved</punica-toast></div>');
    const el = wrap.firstElementChild;
    el.shadowRoot.querySelector('.close').click();
    await settle();
    expect(el.isConnected).toBe(true);
    await wait(160);
    expect(el.isConnected).toBe(false);
  });
});
