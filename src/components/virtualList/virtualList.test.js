import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './virtualList.js';

const html = '<punica-virtual-list label="People" style="height:300px"></punica-virtual-list>';
const people = (n) => Array.from({ length: n }, (_, i) => `Person ${i}`);
const rows = (el) => [...el.shadowRoot.querySelectorAll('[role=listitem]')];
const viewport = (el) => el.shadowRoot.querySelector('.viewport');

async function make(n = 100000, extra = '') {
  const el = await fixture(html.replace('<punica-virtual-list', `<punica-virtual-list ${extra}`));
  el.items = people(n);
  await settle();
  return el;
}

contract('punica-virtual-list', {
  html,
  open: (el) => {
    el.items = people(1000);
  }
});

describe('punica-virtual-list focus', () => {
  afterEach(cleanup);
  it('focus() reaches the scroller, which then scrolls with the keyboard', async () => {
    const el = await fixture('<punica-virtual-list label="Rows" style="height:200px"></punica-virtual-list>');
    el.items = Array.from({ length: 1000 }, (_, i) => 'Row ' + i);
    await settle();
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(el.shadowRoot.querySelector('[part=viewport]'));
  });
});

describe('punica-virtual-list', () => {
  afterEach(cleanup);

  it('renders a window of 100 000 items, each with its place in the set', async () => {
    const el = await make();
    const list = rows(el);
    expect(list.length).toBeGreaterThan(5);
    expect(list.length).toBeLessThan(100);
    expect(list[0].textContent).toBe('Person 0');
    expect(list[0].getAttribute('aria-posinset')).toBe('1');
    expect(list[0].getAttribute('aria-setsize')).toBe('100000');
    expect(viewport(el).getAttribute('role')).toBe('list');
    expect(viewport(el).getAttribute('aria-label')).toBe('People');
    expect(viewport(el).scrollHeight).toBe(100000 * 48);
  });

  it('does not render everything when the host has no height', async () => {
    const el = await fixture('<punica-virtual-list></punica-virtual-list>');
    el.items = people(100000);
    await settle();
    expect(rows(el).length).toBeLessThan(200);
  });

  it('scrollToIndex shows the row, with each alignment', async () => {
    const el = await make();
    const inView = (index) => {
      const row = rows(el).find((r) => r.getAttribute('aria-posinset') === String(index + 1));
      if (!row) return null;
      const v = viewport(el).getBoundingClientRect();
      const r = row.getBoundingClientRect();
      return { top: Math.round(r.top - v.top), bottom: Math.round(v.bottom - r.bottom), text: row.textContent };
    };
    el.scrollToIndex(54321);
    expect(inView(54321)).toEqual({ top: 0, bottom: 300 - 48, text: 'Person 54321' });
    expect(rows(el).length).toBeLessThan(100);
    el.scrollToIndex(777, { align: 'end' });
    expect(inView(777).bottom).toBe(0);
    el.scrollToIndex(9000, { align: 'center' });
    expect(inView(9000).top).toBe((300 - 48) / 2);
    const before = viewport(el).scrollTop;
    el.scrollToIndex(9001, { align: 'nearest' });
    expect(viewport(el).scrollTop).toBe(before);
    el.scrollToIndex(99999);
    expect(inView(99999).bottom).toBe(0);
    expect(el.range.end).toBe(100000);
  });

  it('renders item text as text, never as markup', async () => {
    const el = await fixture(html);
    el.items = ['<img src=x onerror=window.__xss=1>'];
    await settle();
    await new Promise((r) => setTimeout(r, 50));
    expect(rows(el)[0].textContent).toBe('<img src=x onerror=window.__xss=1>');
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(window.__xss).toBeUndefined();
  });

  it('builds rows with renderItem and re-renders only rows whose item changed', async () => {
    const el = await fixture(html);
    let calls = 0;
    el.renderItem = (item, index) => {
      calls++;
      const b = document.createElement('b');
      b.textContent = `${index}: ${item}`;
      return b;
    };
    el.items = people(1000);
    await settle();
    expect(rows(el)[1].firstElementChild.outerHTML).toBe('<b>1: Person 1</b>');
    const first = calls;
    const kept = rows(el)[0];
    const next = el.items.slice();
    next[1] = 'Changed';
    el.items = next;
    await settle();
    expect(calls).toBe(first + 1);
    expect(rows(el)[0]).toBe(kept);
    expect(rows(el)[1].textContent).toBe('1: Changed');
  });

  it('fires punica-range-change with the rows in view and punica-near-end once', async () => {
    const el = await make(1000, 'item-height="50" overscan="2"');
    expect(el.range).toEqual({ start: 0, end: 6 });
    expect(rows(el).length).toBe(8);
    const changed = once(el, 'punica-range-change');
    viewport(el).scrollTop = 500;
    expect((await changed).detail).toEqual({ start: 10, end: 16 });
    let near = 0;
    el.addEventListener('punica-near-end', () => near++);
    el.scrollToIndex(999);
    el.scrollToIndex(990);
    el.scrollToIndex(999);
    expect(near).toBe(1);
    el.items = people(2000);
    await settle();
    el.scrollToIndex(1999);
    expect(near).toBe(2);
  });

  it('scrolls with the keyboard from the focused scroller', async () => {
    const el = await make(1000);
    viewport(el).focus();
    expect(el.shadowRoot.activeElement).toBe(viewport(el));
    await userEvent.keyboard('{End}');
    await settle();
    await expect.poll(() => rows(el).at(-1).textContent).toBe('Person 999');
    await expect.poll(() => viewport(el).scrollTop).toBe(1000 * 48 - 300);
    await new Promise((r) => setTimeout(r, 100));
    await userEvent.keyboard('{Home}');
    await expect.poll(() => rows(el)[0].textContent).toBe('Person 0');
    await userEvent.keyboard('{PageDown}');
    await expect.poll(() => el.range.start).toBeGreaterThan(2);
  });

  it('keeps a focused row mounted while it is scrolled out and back', async () => {
    const el = await fixture(html);
    el.renderItem = (item) => {
      const b = document.createElement('button');
      b.textContent = item;
      return b;
    };
    el.items = people(100000);
    await settle();
    const button = rows(el)[2].firstElementChild;
    button.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
    el.scrollToIndex(50000);
    await settle();
    expect(button.isConnected).toBe(true);
    expect(el.shadowRoot.activeElement).toBe(button);
    expect(rows(el).length).toBeLessThan(100);
    // In document order, so Tab leaves it in the right direction.
    expect(rows(el)[0].textContent).toBe('Person 2');
    el.scrollToIndex(0);
    await settle();
    expect(el.shadowRoot.activeElement).toBe(button);
    expect(rows(el).filter((r) => r.getAttribute('aria-posinset') === '3').length).toBe(1);
    button.blur();
    el.scrollToIndex(50000);
    expect(button.isConnected).toBe(false);
  });

  it('observes its size only while connected', async () => {
    const Native = window.ResizeObserver;
    const live = new Set();
    window.ResizeObserver = class extends Native {
      observe(...args) {
        live.add(this);
        return super.observe(...args);
      }
      disconnect() {
        live.delete(this);
        return super.disconnect();
      }
    };
    try {
      const made = document.createElement('punica-virtual-list');
      expect(live.size).toBe(0);
      made.style.height = '100px';
      made.items = people(1000);
      const host = await fixture('<div></div>');
      host.appendChild(made);
      await settle();
      expect(live.size).toBe(1);
      const small = rows(made).length;
      made.remove();
      expect(live.size).toBe(0);
      host.appendChild(made);
      expect(live.size).toBe(1);
      made.style.height = '400px';
      await expect.poll(() => rows(made).length).toBeGreaterThan(small);
      made.remove();
      expect(live.size).toBe(0);
    } finally {
      window.ResizeObserver = Native;
    }
  });
});
