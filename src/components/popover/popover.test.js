import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import '../button/button.js';
import './popover.js';

const html = `<punica-popover label="Details">
  <button slot="trigger">Open</button>
  <p>Content <button id="inner">Inside</button></p>
</punica-popover>`;

contract('punica-popover', { html, open: (el) => el.show() });

describe('punica-popover', () => {
  afterEach(cleanup);

  it('opens from its trigger in the top layer, beside the trigger', async () => {
    const wrap = await fixture(`<div style="margin:40px">${html}</div>`);
    const el = wrap.querySelector('punica-popover');
    const trigger = el.querySelector('[slot=trigger]');
    const opened = once(el, 'punica-open');
    trigger.click();
    await opened;
    await settle();
    expect(el.open).toBe(true);
    expect(el.panel.matches(':popover-open')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const a = trigger.getBoundingClientRect();
    const p = el.panel.getBoundingClientRect();
    expect(p.width).toBeGreaterThan(0);
    expect(Math.round(p.top)).toBeGreaterThanOrEqual(Math.round(a.bottom));
    expect(Math.abs(p.left - a.left)).toBeLessThan(2);
  });

  it('moves focus in on open and back on Escape', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('[slot=trigger]');
    trigger.focus();
    trigger.click();
    await settle();
    expect(document.activeElement).toBe(el.querySelector('#inner'));
    const closed = once(el, 'punica-close');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect((await closed).detail.reason).toBe('escape');
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a pointer down outside, not inside', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    el.querySelector('#inner').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(el.open).toBe(true);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle();
    expect(el.open).toBe(false);
    expect(el.panel.matches(':popover-open')).toBe(false);
  });

  it('flips to the other side when there is no room', async () => {
    const el = await fixture(`<div style="position:fixed;bottom:0;left:40px">${html}</div>`);
    const pop = el.querySelector('punica-popover');
    pop.show();
    await settle();
    await settle();
    const a = pop.querySelector('[slot=trigger]').getBoundingClientRect();
    const p = pop.panel.getBoundingClientRect();
    expect(p.bottom).toBeLessThanOrEqual(a.top + 1);
  });

  it('opens at a point', async () => {
    const el = await fixture(html);
    el.point = { x: 120, y: 90 };
    el.show();
    await settle();
    const p = el.panel.getBoundingClientRect();
    expect(Math.round(p.left)).toBe(120);
    expect(Math.round(p.top)).toBe(94);
  });

  it('stays closed with manual until told', async () => {
    const el = await fixture(html.replace('<punica-popover', '<punica-popover manual'));
    el.show();
    await settle();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle();
    expect(el.open).toBe(true);
    el.hide();
    await settle();
    expect(el.open).toBe(false);
  });

  it('aligns to the start edge of a right-to-left anchor on a left-to-right page', async () => {
    const wrap = await fixture(`<div dir="rtl" style="margin:40px 200px">${html}</div>`);
    const el = wrap.querySelector('punica-popover');
    el.show();
    await settle();
    await settle();
    const a = el.querySelector('[slot=trigger]').getBoundingClientRect();
    const p = el.panel.getBoundingClientRect();
    expect(Math.abs(p.right - a.right)).toBeLessThan(2);
  });

  it('goes with its anchor when the anchor scrolls out of view', async () => {
    const wrap = await fixture(`<div style="height:3000px;padding-top:100px">${html.replace('<punica-popover', '<punica-popover manual')}</div>`);
    const el = wrap.querySelector('punica-popover');
    el.show();
    await settle();
    window.scrollTo(0, 1500);
    window.dispatchEvent(new Event('scroll'));
    await settle();
    await settle();
    const p = el.panel.getBoundingClientRect();
    const a = el.querySelector('[slot=trigger]').getBoundingClientRect();
    expect(a.bottom).toBeLessThan(0);
    expect(p.top).toBeLessThan(0);
    window.scrollTo(0, 0);
  });

  it('ignores the align attribute as a text alignment', async () => {
    const el = await fixture(html.replace('<punica-popover', '<punica-popover align="center"'));
    expect(getComputedStyle(el.querySelector('p')).textAlign).not.toBe('center');
  });
});

