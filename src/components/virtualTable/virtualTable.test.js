import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './virtualTable.js';
import '../table/tableSelectionToolbar.js';

const html = '<punica-virtual-table label="People" style="height:300px"></punica-virtual-table>';
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'company', label: 'Company', width: 160, sortable: true },
  { key: 'age', label: 'Age', width: '80px', align: 'end' }
];
const people = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Person ${i}`, company: `Co ${i % 7}`, age: 20 + (i % 50) }));

const q = (el, s) => el.shadowRoot.querySelector(s);
const qa = (el, s) => [...el.shadowRoot.querySelectorAll(s)];
const viewport = (el) => q(el, '.viewport');
const bodyRows = (el) => qa(el, '.body [role=row]');
const rowAt = (el, index) => q(el, `.body [role=row][aria-rowindex="${index + 2}"]`);
const key = (target, k) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));

async function make(n = 100000, extra = '') {
  const el = await fixture(html.replace('<punica-virtual-table', `<punica-virtual-table ${extra}`));
  el.columns = columns;
  el.rows = people(n);
  await settle();
  return el;
}

const fill = (el) => {
  el.columns = columns;
  el.rows = people(1000);
};

contract('punica-virtual-table', { html, open: fill });

describe('punica-virtual-table', () => {
  afterEach(cleanup);

  it('has no axe violations with data, as a table and as a grid', async () => {
    const el = await make(1000);
    expect(await a11y(el.parentElement)).toEqual([]);
    el.selectable = true;
    el.rowKey = 'id';
    el.value = 'p2';
    el.sortColumn = 'name';
    await settle();
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('renders a window of 100 000 rows with table roles and indices', async () => {
    const el = await make();
    const rows = bodyRows(el);
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.length).toBeLessThan(100);
    const table = viewport(el);
    expect(table.getAttribute('role')).toBe('table');
    expect(table.getAttribute('aria-rowcount')).toBe('100001');
    expect(table.getAttribute('aria-colcount')).toBe('3');
    expect(table.getAttribute('aria-label')).toBe('People');
    expect(qa(el, '.header [role=columnheader]').map((c) => c.textContent)).toEqual(['Name', 'Company', 'Age']);
    expect(q(el, '.header [role=row]').getAttribute('aria-rowindex')).toBe('1');
    expect(rows[0].getAttribute('aria-rowindex')).toBe('2');
    expect([...rows[3].children].map((c) => [c.getAttribute('role'), c.textContent])).toEqual([
      ['cell', 'Person 3'],
      ['cell', 'Co 3'],
      ['cell', '23']
    ]);
    // column widths and alignment
    const cells = [...rows[0].children].map((c) => c.getBoundingClientRect());
    expect(Math.round(cells[1].width)).toBe(160);
    expect(Math.round(cells[2].width)).toBe(80);
    expect(getComputedStyle(rows[0].children[2]).textAlign).toBe('end');
  });

  it('keeps the header in place and scrollToIndex puts the row under it', async () => {
    const el = await make();
    el.scrollToIndex(54321);
    await settle();
    const v = viewport(el).getBoundingClientRect();
    const header = q(el, '.header').getBoundingClientRect();
    expect(Math.round(header.top)).toBe(Math.round(v.top));
    const row = rowAt(el, 54321);
    expect(row.textContent).toContain('Person 54321');
    expect(Math.round(row.getBoundingClientRect().top)).toBe(Math.round(header.bottom));
    expect(bodyRows(el).length).toBeLessThan(100);
    el.scrollToIndex(99999, { align: 'end' });
    expect(Math.round(rowAt(el, 99999).getBoundingClientRect().bottom)).toBe(Math.round(v.bottom));
    expect(el.range.end).toBe(100000);
  });

  it('renders cell and header text as text, never as markup', async () => {
    const el = await fixture(html);
    const evil = '<img src=x onerror=window.__xss=1>';
    el.columns = [{ key: 'a', label: evil, sortable: true }, { key: 'b', label: 'B', render: () => evil }];
    el.rows = [{ a: evil, b: 1 }];
    await settle();
    await new Promise((r) => setTimeout(r, 50));
    expect(q(el, '[role=columnheader]').textContent).toBe(evil);
    expect(bodyRows(el)[0].children[0].textContent).toBe(evil);
    expect(bodyRows(el)[0].children[1].textContent).toBe(evil);
    expect(q(el, 'img')).toBe(null);
    expect(window.__xss).toBeUndefined();
  });

  it('places the Node a column render returns', async () => {
    const el = await fixture(html);
    el.columns = [
      {
        key: 'name',
        label: 'Name',
        render: (row, index, column) => {
          const a = document.createElement('a');
          a.href = '#' + row.id;
          a.textContent = `${index}:${column.key}:${row.name}`;
          return a;
        }
      }
    ];
    el.rows = people(5);
    await settle();
    const link = bodyRows(el)[2].querySelector('a');
    expect(link.textContent).toBe('2:name:Person 2');
    expect(link.parentElement.getAttribute('role')).toBe('cell');
  });

  it('sort headers are native buttons that fire punica-sort and show aria-sort, without reordering rows', async () => {
    const el = await make(100);
    const headers = qa(el, '[role=columnheader]');
    const button = headers[0].querySelector('button');
    expect(button.type).toBe('button');
    expect(headers[2].querySelector('button')).toBe(null);
    expect(headers[0].getAttribute('aria-sort')).toBe('none');
    expect(headers[2].hasAttribute('aria-sort')).toBe(false);

    let sorted = once(el, 'punica-sort');
    button.focus();
    button.click();
    expect((await sorted).detail).toEqual({ column: 'name', direction: 'ascending' });
    await settle();
    expect(headers[0].getAttribute('aria-sort')).toBe('ascending');
    expect(el.sortColumn).toBe('name');
    expect(el.shadowRoot.activeElement).toBe(button);
    expect(bodyRows(el)[0].textContent).toContain('Person 0');

    sorted = once(el, 'punica-sort');
    button.click();
    expect((await sorted).detail).toEqual({ column: 'name', direction: 'descending' });
    await settle();
    expect(headers[0].getAttribute('aria-sort')).toBe('descending');

    sorted = once(el, 'punica-sort');
    headers[1].querySelector('button').click();
    expect((await sorted).detail).toEqual({ column: 'company', direction: 'ascending' });
    await settle();
    expect(headers[0].getAttribute('aria-sort')).toBe('none');
    expect(headers[1].getAttribute('aria-sort')).toBe('ascending');

    el.addEventListener('punica-sort', (e) => e.preventDefault());
    headers[0].querySelector('button').click();
    await settle();
    expect(el.sortColumn).toBe('company');
  });

  it('a programmatic sort or value change fires nothing', async () => {
    const el = await make(100, 'selectable row-key="id"');
    let fired = 0;
    for (const type of ['punica-sort', 'punica-select']) el.addEventListener(type, () => fired++);
    el.sortColumn = 'company';
    el.sortDirection = 'descending';
    el.value = 'p3';
    await settle();
    expect(fired).toBe(0);
    expect(qa(el, '[role=columnheader]')[1].getAttribute('aria-sort')).toBe('descending');
    expect(rowAt(el, 3).getAttribute('aria-selected')).toBe('true');
  });

  it('selects a row by click and fires punica-select with its key and row', async () => {
    const el = await make(1000, 'selectable row-key="id"');
    expect(viewport(el).getAttribute('role')).toBe('grid');
    expect(viewport(el).hasAttribute('tabindex')).toBe(false);
    expect(bodyRows(el)[0].children[0].getAttribute('role')).toBe('gridcell');
    const picked = once(el, 'punica-select');
    rowAt(el, 4).children[0].click();
    const { detail } = await picked;
    expect(detail.value).toBe('p4');
    expect(detail.item).toBe(el.rows[4]);
    await settle();
    expect(el.value).toBe('p4');
    expect(rowAt(el, 4).getAttribute('aria-selected')).toBe('true');
    expect(rowAt(el, 3).getAttribute('aria-selected')).toBe('false');
    expect(rowAt(el, 4).tabIndex).toBe(0);
    expect(qa(el, '.body [role=row][tabindex="0"]').length).toBe(1);
  });

  it('falls back to the row index as key, and a plain table selects nothing', async () => {
    const grid = await make(10, 'selectable');
    const picked = once(grid, 'punica-select');
    rowAt(grid, 2).click();
    expect((await picked).detail.value).toBe(2);
    const table = await make(10);
    let fired = 0;
    table.addEventListener('punica-select', () => fired++);
    rowAt(table, 2).click();
    expect(fired).toBe(0);
    expect(rowAt(table, 2).hasAttribute('tabindex')).toBe(false);
    expect(viewport(table).tabIndex).toBe(0);
  });

  it('moves between rows of a grid with the keyboard and selects with Enter and Space', async () => {
    const el = await make(1000, 'selectable row-key="id"');
    const focused = () => el.shadowRoot.activeElement;
    rowAt(el, 0).focus();
    key(focused(), 'ArrowDown');
    key(focused(), 'ArrowDown');
    expect(focused()).toBe(rowAt(el, 2));
    key(focused(), 'ArrowUp');
    expect(focused()).toBe(rowAt(el, 1));
    key(focused(), 'PageDown');
    const paged = Number(focused().getAttribute('aria-rowindex')) - 2;
    expect(paged).toBeGreaterThan(2);
    key(focused(), 'End');
    expect(focused()).toBe(rowAt(el, 999));
    expect(focused().textContent).toContain('Person 999');
    const v = viewport(el).getBoundingClientRect();
    expect(Math.round(focused().getBoundingClientRect().bottom)).toBeLessThanOrEqual(Math.round(v.bottom));
    key(focused(), 'ArrowDown');
    expect(focused()).toBe(rowAt(el, 999));
    let picked = once(el, 'punica-select');
    key(focused(), 'Enter');
    expect((await picked).detail.value).toBe('p999');
    key(focused(), 'Home');
    expect(focused()).toBe(rowAt(el, 0));
    expect(viewport(el).scrollTop).toBe(0);
    picked = once(el, 'punica-select');
    key(focused(), ' ');
    expect((await picked).detail).toEqual({ value: 'p0', item: el.rows[0] });
    await settle();
    expect(focused()).toBe(rowAt(el, 0));
    expect(bodyRows(el).length).toBeLessThan(100);
  });

  it('focus() reaches the scroller of a table and the current row of a grid', async () => {
    const plain = await make(100);
    plain.focus();
    expect(plain.shadowRoot.activeElement).toBe(viewport(plain));
    const grid = await make(1000, 'selectable row-key="id"');
    grid.value = 'p7';
    await settle();
    grid.focus();
    expect(grid.shadowRoot.activeElement).toBe(rowAt(grid, 7));
  });

  it('leaves the selection alone when a control inside a cell is clicked, also one with a shadow root', async () => {
    customElements.get('x-vt-button') ||
      customElements.define(
        'x-vt-button',
        class extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' }).innerHTML = '<button type="button">Go</button>';
          }
        }
      );
    const el = await make(20, 'selectable row-key="id"');
    el.columns = [...columns, { key: 'act', label: 'Act', render: () => document.createElement('x-vt-button') }];
    await settle();
    let fired = 0;
    el.addEventListener('punica-select', () => fired++);
    rowAt(el, 3).querySelector('x-vt-button').shadowRoot.querySelector('button').click();
    expect(fired).toBe(0);
    expect(el.value ?? null).toBe(null);
    rowAt(el, 3).children[0].click();
    expect(fired).toBe(1);
  });

  it('makes the selected row the tab stop when value is set from code', async () => {
    const el = await make(1000, 'selectable row-key="id"');
    el.value = 'p40';
    await settle();
    expect(rowAt(el, 40).tabIndex).toBe(0);
    expect(qa(el, '.body [role=row][tabindex="0"]').length).toBe(1);
  });

  it('is pressed anywhere in a sortable header cell, padding included', async () => {
    const el = await make(10);
    const cell = qa(el, '.header .cell')[0];
    const button = cell.querySelector('.sort');
    const r = cell.getBoundingClientRect();
    for (const x of [r.left + 2, r.left + r.width / 2, r.right - 2]) {
      for (const y of [r.top + 2, r.bottom - 3]) {
        expect(button.contains(el.shadowRoot.elementFromPoint(x, y)), `${x},${y}`).toBe(true);
      }
    }
  });

  it('lines an end-aligned sortable label up with the cells under it', async () => {
    const el = await make(10);
    el.columns = [
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age', width: 120, align: 'end', sortable: true }
    ];
    await settle();
    const header = qa(el, '.header .cell')[1];
    const text = header.querySelector('.text').getBoundingClientRect();
    const cell = bodyRows(el)[0].children[1].querySelector('.text').getBoundingClientRect();
    expect(Math.abs(text.right - cell.right)).toBeLessThanOrEqual(1);
  });

  it('keeps the focused row and the tab stop mounted while scrolled away', async () => {
    const el = await make(100000, 'selectable');
    rowAt(el, 3).click();
    rowAt(el, 3).focus();
    const row = rowAt(el, 3);
    el.scrollToIndex(60000);
    await settle();
    expect(row.isConnected).toBe(true);
    expect(el.shadowRoot.activeElement).toBe(row);
    expect(bodyRows(el)[0]).toBe(row);
    row.blur();
    el.scrollToIndex(70000);
    await settle();
    // still the grid's one tab stop
    expect(rowAt(el, 3)).toBe(row);
    expect(row.tabIndex).toBe(0);
    el.scrollToIndex(0);
    await settle();
    expect(qa(el, '.body [role=row][aria-rowindex="5"]').length).toBe(1);
  });

  it('scrolls a plain table with the keyboard from the focused scroller', async () => {
    const el = await make(1000);
    viewport(el).focus();
    expect(el.shadowRoot.activeElement).toBe(viewport(el));
    await userEvent.keyboard('{End}');
    await expect.poll(() => bodyRows(el).at(-1).textContent).toContain('Person 999');
  });

  it('fires punica-range-change and punica-near-end', async () => {
    const el = await make(1000, 'row-height="40" overscan="2"');
    const headerHeight = q(el, '.header').offsetHeight;
    expect(el.range).toEqual({ start: 0, end: Math.ceil((300 - headerHeight) / 40) });
    const changed = once(el, 'punica-range-change');
    viewport(el).scrollTop = 400;
    expect((await changed).detail.start).toBe(10);
    let near = 0;
    el.addEventListener('punica-near-end', (e) => (near += e.detail.end === 1000 ? 1 : 100));
    el.scrollToIndex(999);
    el.scrollToIndex(500);
    el.scrollToIndex(999);
    expect(near).toBe(1);
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
      const made = document.createElement('punica-virtual-table');
      expect(live.size).toBe(0);
      made.style.height = '120px';
      fill(made);
      const host = await fixture('<div></div>');
      host.appendChild(made);
      await settle();
      expect(live.size).toBe(1);
      const small = bodyRows(made).length;
      made.remove();
      expect(live.size).toBe(0);
      host.appendChild(made);
      expect(live.size).toBe(1);
      made.style.height = '400px';
      await expect.poll(() => bodyRows(made).length).toBeGreaterThan(small);
      made.remove();
      expect(live.size).toBe(0);
    } finally {
      window.ResizeObserver = Native;
    }
  });
});

describe('punica-virtual-table with a selection toolbar', () => {
  afterEach(cleanup);

  it('exposes selectedValues and clears from code without an event', async () => {
    const el = await make(50, 'selectable row-key="id"');
    expect(el.selectedValues).toEqual([]);
    el.value = 'p3';
    expect(el.selectedValues).toEqual(['p3']);
    let fired = 0;
    el.addEventListener('punica-select', () => fired++);
    el.clearSelection();
    await settle();
    expect(el.value).toBe(null);
    expect(el.selectedValues).toEqual([]);
    expect(fired).toBe(0);
  });

  it('drives a toolbar named by for: count, a selection from code, and clear as a person', async () => {
    const wrap = await fixture(`<div>
      <punica-table-selection-toolbar for="vt"><button type="button">Open</button></punica-table-selection-toolbar>
      <punica-virtual-table id="vt" label="People" selectable row-key="id" style="height:300px"></punica-virtual-table>
    </div>`);
    const el = wrap.querySelector('punica-virtual-table');
    const bar = wrap.querySelector('punica-table-selection-toolbar');
    el.columns = columns;
    el.rows = people(50);
    await settle();
    const count = bar.shadowRoot.querySelector('[part="count"]');
    expect(bar.matches(':state(empty)')).toBe(true);
    rowAt(el, 4).click();
    await settle();
    expect(bar.count).toBe(1);
    expect(count.textContent).toBe('1 selected');
    el.value = null;
    await settle();
    await settle();
    expect(bar.matches(':state(empty)')).toBe(true);
    el.value = 'p7';
    await settle();
    await settle();
    expect(bar.matches(':state(empty)')).toBe(false);
    const clear = bar.shadowRoot.querySelector('[part="clear-button"]');
    clear.focus();
    const selected = once(el, 'punica-select');
    clear.click();
    expect((await selected).detail).toEqual({ value: null, item: null });
    await settle();
    expect(el.value).toBe(null);
    expect(bar.matches(':state(empty)')).toBe(true);
    // Focus goes back to the grid's current row.
    expect(el.shadowRoot.activeElement?.getAttribute('role')).toBe('row');
  });
});
