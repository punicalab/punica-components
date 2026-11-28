import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './split.js';

const html = (attrs = '') => `<punica-split style="width:400px;height:200px" ${attrs}>
  <div slot="start">Navigation</div>
  <div slot="end">Content</div>
</punica-split>`;

const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const pointer = (el, type, x, y = 10) =>
  el.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 91, bubbles: true, cancelable: true }));
const divider = (el) => el.shadowRoot.querySelector('[role=separator]');
const startWidth = (el) => el.shadowRoot.querySelector('[part=start]').getBoundingClientRect().width;

contract('punica-split', { html: html() });

describe('punica-split', () => {
  afterEach(cleanup);

  it('is created by createElement', () => {
    const el = document.createElement('punica-split');
    expect(el.attributes.length).toBe(0);
    expect(el.position).toBe(50);
  });

  it('lays the panes out by position', async () => {
    const el = await fixture(html('position="25"'));
    expect(Math.round(startWidth(el))).toBe(96);
    el.position = 50;
    await settle();
    expect(Math.round(startWidth(el))).toBe(196);
  });

  it('exposes a focusable separator with its value', async () => {
    const el = await fixture(html('position="30" min="10" max="80"'));
    const d = divider(el);
    expect(d.tabIndex).toBe(0);
    expect(d.getAttribute('aria-valuenow')).toBe('30');
    expect(d.getAttribute('aria-valuemin')).toBe('10');
    expect(d.getAttribute('aria-valuemax')).toBe('80');
    expect(d.getAttribute('aria-orientation')).toBe('vertical');
    expect(d.getAttribute('aria-label')).toBe('Resize');
    expect(d.getAttribute('aria-controls')).toBe(el.shadowRoot.querySelector('[part=start]').id);
  });

  it('moves with the arrow keys by step, Home and End, and fires punica-change', async () => {
    const el = await fixture(html('position="30" min="10" max="80" step="5"'));
    const d = divider(el);
    const seen = [];
    let legacy = 0;
    el.addEventListener('punica-change', (e) => seen.push(e.detail));
    el.addEventListener('split-change', () => legacy++);
    d.focus();
    expect(el.shadowRoot.activeElement).toBe(d);
    key(d, 'ArrowRight');
    expect(el.position).toBe(35);
    key(d, 'ArrowLeft');
    key(d, 'ArrowLeft');
    expect(el.position).toBe(25);
    key(d, 'Home');
    expect(el.position).toBe(10);
    key(d, 'Home');
    key(d, 'End');
    expect(el.position).toBe(80);
    key(d, 'PageUp');
    expect(el.position).toBe(30);
    // Up and Down are not a side-by-side split's keys.
    key(d, 'ArrowDown');
    expect(el.position).toBe(30);
    expect(seen.map((d) => d.position)).toEqual([35, 30, 25, 10, 80, 30]);
    expect(seen[0]).toEqual({ position: 35, value: 35 });
    expect(legacy).toBe(0);
    await settle();
    expect(d.getAttribute('aria-valuenow')).toBe('30');
  });

  it('mirrors Left and Right in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${html('position="30"')}</div>`);
    const el = wrap.querySelector('punica-split');
    key(divider(el), 'ArrowLeft');
    expect(el.position).toBe(31);
    key(divider(el), 'ArrowRight');
    key(divider(el), 'ArrowRight');
    expect(el.position).toBe(29);
  });

  it('uses Up and Down when vertical', async () => {
    const el = await fixture(html('orientation="vertical" position="30"'));
    const d = divider(el);
    expect(d.getAttribute('aria-orientation')).toBe('horizontal');
    key(d, 'ArrowDown');
    expect(el.position).toBe(31);
    key(d, 'ArrowUp');
    key(d, 'ArrowUp');
    expect(el.position).toBe(29);
    key(d, 'ArrowRight');
    expect(el.position).toBe(29);
    await settle();
    expect(Math.round(el.shadowRoot.querySelector('[part=start]').getBoundingClientRect().height)).toBe(54);
  });

  it('drags with the pointer: punica-input while moving, punica-change at the end', async () => {
    const el = await fixture(html('position="50" min="20"'));
    const d = divider(el);
    const left = el.getBoundingClientRect().left;
    const inputs = [];
    const changes = [];
    el.addEventListener('punica-input', (e) => inputs.push(e.detail.position));
    el.addEventListener('punica-change', (e) => changes.push(e.detail.position));
    pointer(d, 'pointerdown', left + 200);
    pointer(d, 'pointermove', left + 100);
    expect(el.position).toBe(25);
    pointer(d, 'pointermove', left + 300);
    expect(el.position).toBe(75);
    pointer(d, 'pointermove', left + 10);
    expect(el.position).toBe(20);
    pointer(d, 'pointerup', left + 10);
    expect(inputs).toEqual([25, 75, 20]);
    expect(changes).toEqual([20]);
    // A move after the release is not a drag.
    pointer(d, 'pointermove', left + 300);
    expect(el.position).toBe(20);
  });

  it('takes focus on a drag without drawing a keyboard focus ring', async () => {
    const el = await fixture(html());
    const d = divider(el);
    const calls = [];
    const focus = d.focus.bind(d);
    d.focus = (options) => {
      calls.push(options);
      focus(options);
    };
    pointer(d, 'pointerdown', el.getBoundingClientRect().left + 200);
    expect(calls).toEqual([{ focusVisible: false }]);
    expect(el.shadowRoot.activeElement).toBe(d);
  });

  it('measures a drag from the inline start in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${html()}</div>`);
    const el = wrap.querySelector('punica-split');
    const d = divider(el);
    const right = el.getBoundingClientRect().right;
    pointer(d, 'pointerdown', right - 200);
    pointer(d, 'pointermove', right - 100);
    pointer(d, 'pointerup', right - 100);
    expect(el.position).toBe(25);
  });

  it('fires nothing for a programmatic change and clamps what it shows', async () => {
    const el = await fixture(html('min="10" max="80"'));
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    el.addEventListener('punica-input', () => fired++);
    el.position = 95;
    await settle();
    expect(fired).toBe(0);
    expect(divider(el).getAttribute('aria-valuenow')).toBe('80');
  });

  it('cannot be moved while disabled', async () => {
    const el = await fixture(html('disabled'));
    const d = divider(el);
    expect(d.tabIndex).toBe(-1);
    key(d, 'ArrowRight');
    pointer(d, 'pointerdown', 10);
    pointer(d, 'pointermove', 100);
    expect(el.position).toBe(50);
  });

  it('keeps one shadow tree across reconnects', async () => {
    // 1.x duplicated its shadow tree on reconnect.
    const el = await fixture(html());
    const parent = el.parentElement;
    for (let i = 0; i < 3; i++) {
      el.remove();
      parent.append(el);
    }
    expect(el.shadowRoot.querySelectorAll('[role=separator]').length).toBe(1);
    key(divider(el), 'ArrowRight');
    expect(el.position).toBe(51);
  });

  it('stretches pane content, so a split nested in a pane fills it', async () => {
    const el = await fixture(`<punica-split position="25" label="Outer" style="height:300px;width:600px">
      <div slot="start">Navigation</div>
      <punica-split slot="end" orientation="vertical" position="65" label="Inner">
        <div slot="start">Editor</div>
        <div slot="end">Terminal</div>
      </punica-split>
    </punica-split>`);
    await settle();
    const inner = el.querySelector('punica-split');
    expect(Math.round(inner.getBoundingClientRect().height)).toBe(300);
    const end = inner.shadowRoot.querySelector('[part=end]').getBoundingClientRect().height;
    expect(end).toBeGreaterThan(90);
    expect(Math.round(el.querySelector('[slot=start]').getBoundingClientRect().height)).toBe(300);
  });
});
