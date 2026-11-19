import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './bottomSheet.js';

const html = `<punica-bottom-sheet snap-points="0.3 0.6 0.9">
  <span slot="header">Share</span>
  <p>Choose where to send it. <button id="copy">Copy link</button></p>
</punica-bottom-sheet>`;
const page = `<div style="--punica-duration:0ms;--punica-duration-slow:0ms"><button id="opener">Open</button>${html}</div>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const native = (el) => el.shadowRoot.querySelector('dialog');
const handleOf = (el) => el.shadowRoot.querySelector('.handle');
const open = async (el) => {
  el.show();
  await settle();
};
const drag = (el, dy) => {
  const handle = handleOf(el);
  const y = handle.getBoundingClientRect().top + 5;
  const init = { bubbles: true, composed: true, button: 0, pointerId: 91 };
  handle.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientY: y }));
  handle.dispatchEvent(new PointerEvent('pointermove', { ...init, clientY: y + dy / 2 }));
  handle.dispatchEvent(new PointerEvent('pointermove', { ...init, clientY: y + dy }));
  handle.dispatchEvent(new PointerEvent('pointerup', { ...init, clientY: y + dy }));
};
const heightFraction = (el) => native(el).getBoundingClientRect().height / window.innerHeight;

contract('punica-bottom-sheet', { html, open });

describe('punica-bottom-sheet', () => {
  afterEach(cleanup);

  it('is a modal native dialog on the bottom edge at its first snap height', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-bottom-sheet');
    const opened = once(el, 'punica-open');
    el.open = true;
    await opened;
    await settle();
    const dialog = native(el);
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Share');
    expect(Math.round(dialog.getBoundingClientRect().bottom)).toBe(window.innerHeight);
    expect(heightFraction(el)).toBeCloseTo(0.3, 1);
    expect(await a11y(wrap)).toEqual([]);
  });

  it('exposes the handle as a slider and moves between heights with the keyboard', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-bottom-sheet');
    const opener = wrap.querySelector('#opener');
    opener.focus();
    await open(el);
    const handle = handleOf(el);
    expect(el.shadowRoot.activeElement).toBe(handle);
    expect(handle.getAttribute('role')).toBe('slider');
    expect(handle.getAttribute('aria-label')).toBe('Sheet height');
    expect(handle.getAttribute('aria-valuenow')).toBe('30');
    expect(handle.getAttribute('aria-valuemin')).toBe('30');
    expect(handle.getAttribute('aria-valuemax')).toBe('90');
    const values = [];
    el.addEventListener('punica-change', (event) => values.push(event.detail.value));
    await userEvent.keyboard('{ArrowUp}');
    await settle();
    expect(el.snap).toBe(1);
    expect(handle.getAttribute('aria-valuenow')).toBe('60');
    expect(heightFraction(el)).toBeCloseTo(0.6, 1);
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Home}');
    await settle();
    expect(values).toEqual([1, 2, 1, 0]);
    expect(el.snap).toBe(0);
    // ArrowDown on the lowest height closes; focus returns to the opener.
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{ArrowDown}');
    expect((await closed).detail.reason).toBe('handle');
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on a real Escape after asking', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-bottom-sheet');
    wrap.querySelector('#opener').focus();
    await open(el);
    const asked = once(el, 'punica-request-close');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await asked).detail).toEqual({ reason: 'escape' });
    expect((await closed).detail).toEqual({ reason: 'escape', returnValue: '' });
    expect(native(el).open).toBe(false);
    expect(document.activeElement).toBe(wrap.querySelector('#opener'));
  });

  it('snaps to the nearest height after a drag', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-bottom-sheet');
    await open(el);
    const changed = once(el, 'punica-change');
    drag(el, -0.28 * window.innerHeight);
    expect((await changed).detail).toEqual({ value: 1 });
    await settle();
    expect(el.snap).toBe(1);
    expect(heightFraction(el)).toBeCloseTo(0.6, 1);
    expect(native(el).classList.contains('dragging')).toBe(false);
    drag(el, -0.5 * window.innerHeight);
    await settle();
    expect(el.snap).toBe(2);
    // A small drag falls back to the same height and reports nothing.
    let count = 0;
    el.addEventListener('punica-change', () => count++);
    drag(el, 10);
    await settle();
    expect(count).toBe(0);
    expect(el.snap).toBe(2);
  });

  it('closes when dragged below the lowest height, unless prevented', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-bottom-sheet');
    await open(el);
    const keep = (event) => event.preventDefault();
    el.addEventListener('punica-request-close', keep);
    drag(el, 0.25 * window.innerHeight);
    await settle();
    expect(el.open).toBe(true);
    expect(heightFraction(el)).toBeCloseTo(0.3, 1);
    el.removeEventListener('punica-request-close', keep);
    const closed = once(el, 'punica-close');
    drag(el, 0.25 * window.innerHeight);
    expect((await closed).detail.reason).toBe('drag');
    expect(el.open).toBe(false);
  });

  it('keeps two instances apart and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-bottom-sheet');
    await open(a);
    await open(b);
    expect(document.body.children.length).toBe(before + 1);
    drag(b, -0.28 * window.innerHeight);
    await settle();
    expect(b.snap).toBe(1);
    expect(a.snap).toBe(0);
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(b.open).toBe(false);
    expect(a.open).toBe(true);
  });

  it('renders markup in label and label-handle as text', async () => {
    const el = await fixture(html);
    el.label = '<img src=x onerror="window.__sheetXss = 1">';
    el.labelHandle = '<img src=x onerror="window.__sheetXss = 1">';
    await open(el);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(native(el).getAttribute('aria-label')).toContain('<img');
    await wait(20);
    expect(window.__sheetXss).toBeUndefined();
  });
});
