import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './table.js';
import './tableHeader.js';
import './tableBody.js';
import './tableFooter.js';
import './tableRow.js';
import './tableHeaderCell.js';
import './tableCell.js';
import './tableSelectionToolbar.js';

const table = (attrs = '', body) => `<punica-table ${attrs}>
  <punica-table-header>
    <punica-table-row>
      <punica-table-header-cell sortable column="name">Name</punica-table-header-cell>
      <punica-table-header-cell sortable column="size" sort="ascending" align="end">Size</punica-table-header-cell>
      <punica-table-header-cell>Kind</punica-table-header-cell>
    </punica-table-row>
  </punica-table-header>
  <punica-table-body>${
    body ??
    `
    <punica-table-row value="a"><punica-table-cell>Alpha</punica-table-cell><punica-table-cell align="end">1</punica-table-cell><punica-table-cell>File</punica-table-cell></punica-table-row>
    <punica-table-row value="b" selected><punica-table-cell>Beta</punica-table-cell><punica-table-cell align="end">2</punica-table-cell><punica-table-cell>File</punica-table-cell></punica-table-row>
    <punica-table-row value="c"><punica-table-cell>Gamma</punica-table-cell><punica-table-cell align="end">3</punica-table-cell><punica-table-cell>Folder</punica-table-cell></punica-table-row>`
  }
  </punica-table-body>
  <punica-table-footer>
    <punica-table-row><punica-table-cell>Total</punica-table-cell><punica-table-cell align="end">6</punica-table-cell><punica-table-cell></punica-table-cell></punica-table-row>
  </punica-table-footer>
  <p slot="empty">Nothing here yet</p>
</punica-table>`;

contract('punica-table', { html: table('label="Files" selectable="multiple" striped dividers sticky-header') });
contract('punica-table', { html: table('caption="Files" dense') });
contract('punica-table-header', { html: table('label="Files"').replace('<punica-table ', '<punica-table-header></punica-table-header><punica-table ') });
contract('punica-table-body', { html: '<punica-table-body></punica-table-body>' });
contract('punica-table-footer', { html: '<punica-table-footer></punica-table-footer>' });
contract('punica-table-row', {
  html: '<punica-table-row value="a"><punica-table-cell>Alpha</punica-table-cell></punica-table-row>'
});
contract('punica-table-header-cell', { html: '<punica-table-header-cell sortable sort="descending">Name</punica-table-header-cell>' });
contract('punica-table-cell', { html: '<punica-table-cell align="end">12</punica-table-cell>' });
contract('punica-table-selection-toolbar', {
  html: `<punica-table-selection-toolbar for="contract-table"><button type="button">Archive</button></punica-table-selection-toolbar>${table(
    'id="contract-table" label="Files" selectable="multiple"'
  )}`
});

const bodyRows = (el) => [...el.querySelectorAll('punica-table-body punica-table-row')];
const headerRow = (el) => el.querySelector('punica-table-header punica-table-row');
const box = (row) => row.shadowRoot.querySelector('input[type=checkbox]');
const toggle = (row) => box(row).click();

describe('punica-table', () => {
  afterEach(cleanup);

  it('is a table of row groups, rows, column headers and cells to assistive technology', async () => {
    const el = await fixture(table('label="Files"'));
    expect(el.internals.role).toBe('table');
    expect(el.internals.ariaLabel).toBe('Files');
    for (const tag of ['header', 'body', 'footer']) {
      expect(el.querySelector(`punica-table-${tag}`).internals.role).toBe('rowgroup');
    }
    expect(headerRow(el).internals.role).toBe('row');
    expect(el.querySelector('punica-table-header-cell').internals.role).toBe('columnheader');
    expect(el.querySelector('punica-table-cell').internals.role).toBe('cell');
    // No role attribute is written on any host.
    expect(el.querySelectorAll('[role]').length).toBe(0);
  });

  it('lays out as a table: columns line up across header, body and footer', async () => {
    const el = await fixture(table('label="Files" selectable="multiple"'));
    expect(getComputedStyle(el).display).toBe('table');
    expect(getComputedStyle(el.querySelector('punica-table-header')).display).toBe('table-header-group');
    expect(getComputedStyle(el.querySelector('punica-table-body')).display).toBe('table-row-group');
    expect(getComputedStyle(el.querySelector('punica-table-footer')).display).toBe('table-footer-group');
    expect(getComputedStyle(headerRow(el)).display).toBe('table-row');
    const left = (cell) => Math.round(cell.getBoundingClientRect().left);
    const head = [...headerRow(el).children].map(left);
    const first = [...bodyRows(el)[0].children].map(left);
    const foot = [...el.querySelector('punica-table-footer punica-table-row').children].map(left);
    expect(first).toEqual(head);
    expect(foot).toEqual(head);
    expect(head[0]).toBeLessThan(head[1]);
    expect(head[1]).toBeLessThan(head[2]);
  });

  it('names itself from caption, shown as text, and label wins', async () => {
    const el = await fixture(table('caption="Recent files"'));
    const caption = el.shadowRoot.querySelector('[part=caption]');
    expect(caption.hidden).toBe(false);
    expect(caption.textContent).toBe('Recent files');
    expect(el.internals.ariaLabel).toBe('Recent files');
    el.caption = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(caption.textContent).toBe('<img src=x onerror=alert(1)>');
    el.label = 'Files';
    await settle();
    expect(el.internals.ariaLabel).toBe('Files');
  });

  it('applies dense, striped, dividers and sticky-header to the cells', async () => {
    const el = await fixture(table('label="Files"'));
    const cell = el.querySelector('punica-table-cell');
    const head = el.querySelector('punica-table-header-cell');
    const [first, second] = bodyRows(el);
    second.removeAttribute('selected');
    second.getAnimations().forEach((animation) => animation.finish());
    const pad = getComputedStyle(cell).paddingInlineStart;
    expect(getComputedStyle(head).position).toBe('static');
    expect(getComputedStyle(cell).borderInlineEndStyle).toBe('none');
    const plain = getComputedStyle(first).backgroundColor;
    el.dense = el.striped = el.dividers = el.stickyHeader = true;
    await settle();
    expect(parseFloat(getComputedStyle(cell).paddingInlineStart)).toBeLessThan(parseFloat(pad));
    expect(getComputedStyle(head).position).toBe('sticky');
    expect(getComputedStyle(cell).borderInlineEndStyle).toBe('solid');
    second.getAnimations().forEach((animation) => animation.finish());
    expect(getComputedStyle(second).backgroundColor).not.toBe(plain);
    expect(getComputedStyle(first).backgroundColor).toBe(plain);
  });

  it('shows the empty slot only while the body has no row', async () => {
    const el = await fixture(table('label="Files"'));
    const empty = el.shadowRoot.querySelector('[part=empty]');
    expect(empty.hidden).toBe(true);
    const body = el.querySelector('punica-table-body');
    const rows = bodyRows(el);
    rows.forEach((row) => row.remove());
    await settle();
    expect(empty.hidden).toBe(false);
    expect(el.querySelector('[slot=empty]').checkVisibility()).toBe(true);
    body.append(rows[0]);
    await settle();
    expect(empty.hidden).toBe(true);
  });

  describe('sorting', () => {
    it('puts a native button in a sortable header and aria-sort on the header', async () => {
      const el = await fixture(table('label="Files"'));
      const [name, size, kind] = el.querySelectorAll('punica-table-header-cell');
      const button = name.shadowRoot.querySelector('button');
      expect(button.hidden).toBe(false);
      expect(button.type).toBe('button');
      // The header text is the button's content, so it is its name.
      expect(button.querySelector('slot').assignedNodes()[0].textContent).toBe('Name');
      expect(name.internals.ariaSort).toBe('none');
      expect(size.internals.ariaSort).toBe('ascending');
      expect(kind.internals.ariaSort).toBe(null);
      expect(kind.shadowRoot.querySelector('button').hidden).toBe(true);
      expect(kind.shadowRoot.querySelector('button slot')).toBe(null);
      name.focus();
      expect(name.shadowRoot.activeElement).toBe(button);
    });

    it('is pressed anywhere in a sortable header cell, padding included', async () => {
      const el = await fixture(table('label="Files"'));
      for (const cell of [...el.querySelectorAll('punica-table-header-cell')].slice(0, 2)) {
        const r = cell.getBoundingClientRect();
        const button = cell.shadowRoot.querySelector('button');
        for (const x of [r.left + 2, r.left + r.width / 2, r.right - 2]) {
          for (const y of [r.top + 2, r.bottom - 3]) {
            expect(button.contains(cell.shadowRoot.elementFromPoint(x, y)), `${x},${y}`).toBe(true);
          }
        }
      }
    });

    it('lines an end-aligned sortable header up with the cells under it', async () => {
      const el = await fixture(table('label="Files"'));
      const size = el.querySelectorAll('punica-table-header-cell')[1];
      const range = document.createRange();
      range.selectNodeContents(size);
      const text = range.getBoundingClientRect();
      const cell = bodyRows(el)[0].querySelectorAll('punica-table-cell')[1];
      range.selectNodeContents(cell);
      expect(Math.abs(text.right - range.getBoundingClientRect().right)).toBeLessThanOrEqual(1);
    });

    it('fires punica-sort with column and direction and moves the indicator', async () => {
      const el = await fixture(table('label="Files"'));
      const [name, size] = el.querySelectorAll('punica-table-header-cell');
      const order = () => bodyRows(el).map((row) => row.value);
      let sorted = once(el, 'punica-sort');
      name.shadowRoot.querySelector('button').click();
      expect((await sorted).detail).toEqual({ column: 'name', direction: 'ascending' });
      await settle();
      expect(name.sort).toBe('ascending');
      expect(name.internals.ariaSort).toBe('ascending');
      expect(size.sort).toBe(null);
      expect(size.internals.ariaSort).toBe('none');
      sorted = once(el, 'punica-sort');
      name.shadowRoot.querySelector('button').click();
      expect((await sorted).detail).toEqual({ column: 'name', direction: 'descending' });
      // The table moves no data.
      expect(order()).toEqual(['a', 'b', 'c']);
    });

    it('keeps its direction when punica-sort is prevented, and falls back to the position for column', async () => {
      const el = await fixture(table('label="Files"'));
      const [name, size] = el.querySelectorAll('punica-table-header-cell');
      name.removeAttribute('column');
      let detail;
      el.addEventListener('punica-sort', (event) => {
        detail = event.detail;
        event.preventDefault();
      });
      name.shadowRoot.querySelector('button').click();
      await settle();
      expect(detail).toEqual({ column: '0', direction: 'ascending' });
      expect(name.sort).toBe(null);
      expect(size.sort).toBe('ascending');
    });

    it('fires nothing when sort is set from code', async () => {
      const el = await fixture(table('label="Files"'));
      let fired = 0;
      el.addEventListener('punica-sort', () => fired++);
      el.querySelector('punica-table-header-cell').sort = 'descending';
      await settle();
      expect(fired).toBe(0);
    });
  });

  describe('selection', () => {
    it('draws no checkbox cell until the table is selectable', async () => {
      const el = await fixture(table('label="Files"'));
      const row = bodyRows(el)[0];
      expect(row.shadowRoot.querySelector('[part=select-cell]').hidden).toBe(true);
      expect(row.internals.ariaSelected).toBe(null);
      el.selectable = 'multiple';
      await settle();
      expect(row.shadowRoot.querySelector('[part=select-cell]').hidden).toBe(false);
      expect(row.internals.ariaSelected).toBe('false');
      expect(bodyRows(el)[1].internals.ariaSelected).toBe('true');
    });

    it('gives every row a named native checkbox and the header a select-all', async () => {
      const el = await fixture(table('label="Files" selectable="multiple"'));
      const [a, b] = bodyRows(el);
      a.label = 'Select Alpha';
      await settle();
      expect(box(a).getAttribute('aria-label')).toBe('Select Alpha');
      expect(box(b).getAttribute('aria-label')).toBe('Select row');
      expect(box(b).checked).toBe(true);
      const all = box(headerRow(el));
      expect(all.getAttribute('aria-label')).toBe('Select all rows');
      expect(all.hidden).toBe(false);
      expect(all.checked).toBe(false);
      expect(all.indeterminate).toBe(true);
      expect(headerRow(el).shadowRoot.querySelector('[part=select-cell]').getAttribute('role')).toBe('columnheader');
      expect(a.shadowRoot.querySelector('[part=select-cell]').getAttribute('role')).toBe('cell');
      // The footer row keeps the column and draws no control.
      const foot = el.querySelector('punica-table-footer punica-table-row');
      expect(foot.shadowRoot.querySelector('[part=select-cell]').hidden).toBe(false);
      expect(box(foot).hidden).toBe(true);
      el.labelSelectRow = 'Satırı seç';
      el.labelSelectAll = 'Tümünü seç';
      await settle();
      expect(box(b).getAttribute('aria-label')).toBe('Satırı seç');
      expect(all.getAttribute('aria-label')).toBe('Tümünü seç');
    });

    it('is operated from the keyboard: the checkbox takes focus and Space toggles it', async () => {
      const el = await fixture(table('label="Files" selectable="multiple"'));
      const row = bodyRows(el)[0];
      const input = box(row);
      input.focus();
      expect(row.shadowRoot.activeElement).toBe(input);
      expect(input.tabIndex).toBe(0);
      const selected = once(el, 'punica-select');
      // Space on a focused native checkbox is a click.
      input.click();
      const event = await selected;
      expect(event.detail.value).toEqual(['a', 'b']);
      expect(event.detail.item).toBe(row);
      expect(row.selected).toBe(true);
      expect(row.hasAttribute('selected')).toBe(true);
    });

    it('selects and clears every row from the header and tracks the indeterminate state', async () => {
      const el = await fixture(table('label="Files" selectable="multiple"'));
      const all = box(headerRow(el));
      const events = [];
      el.addEventListener('punica-select', (event) => events.push(event.detail));
      all.click();
      await settle();
      expect(bodyRows(el).every((row) => row.selected)).toBe(true);
      expect(events.at(-1)).toEqual({ value: ['a', 'b', 'c'], item: null });
      expect(all.checked).toBe(true);
      expect(all.indeterminate).toBe(false);
      toggle(bodyRows(el)[2]);
      await settle();
      expect(events.at(-1).value).toEqual(['a', 'b']);
      expect(all.checked).toBe(false);
      expect(all.indeterminate).toBe(true);
      all.click();
      await settle();
      all.click();
      await settle();
      expect(el.selectedValues).toEqual([]);
      expect(all.checked).toBe(false);
      expect(all.indeterminate).toBe(false);
      expect(events.length).toBe(4);
    });

    it('keeps one row at most in single mode and draws no select-all', async () => {
      const el = await fixture(table('label="Files" selectable="single"'));
      const [a, b] = bodyRows(el);
      expect(box(headerRow(el)).hidden).toBe(true);
      expect(headerRow(el).shadowRoot.querySelector('[part=select-cell]').getAttribute('role')).toBe('cell');
      const selected = once(el, 'punica-select');
      toggle(a);
      expect((await selected).detail.value).toEqual(['a']);
      await settle();
      expect(a.selected).toBe(true);
      expect(b.selected).toBe(false);
      expect(box(b).checked).toBe(false);
      toggle(a);
      await settle();
      expect(el.selectedValues).toEqual([]);
    });

    it('fires nothing when selected is set from code, and the header follows', async () => {
      const el = await fixture(table('label="Files" selectable="multiple"'));
      let fired = 0;
      el.addEventListener('punica-select', () => fired++);
      bodyRows(el).forEach((row) => (row.selected = true));
      await settle();
      await settle();
      expect(fired).toBe(0);
      expect(box(headerRow(el)).checked).toBe(true);
      expect(box(headerRow(el)).indeterminate).toBe(false);
      expect(box(bodyRows(el)[0]).checked).toBe(true);
    });

    it('counts rows added and removed later', async () => {
      const el = await fixture(table('label="Files" selectable="multiple"'));
      const all = box(headerRow(el));
      const rows = bodyRows(el);
      rows[0].remove();
      rows[2].remove();
      await settle();
      await settle();
      expect(all.checked).toBe(true);
      const row = document.createElement('punica-table-row');
      row.value = 'd';
      row.append(document.createElement('punica-table-cell'));
      el.querySelector('punica-table-body').append(row);
      await settle();
      await settle();
      expect(all.checked).toBe(false);
      expect(all.indeterminate).toBe(true);
      expect(row.shadowRoot.querySelector('[part=select-cell]').hidden).toBe(false);
      expect(el.rows.map((r) => r.value)).toEqual(['b', 'd']);
    });
  });

  it('leaves cell content in the light DOM and writes text as text', async () => {
    const el = await fixture(table('label="Files"'));
    const cell = el.querySelector('punica-table-cell');
    cell.textContent = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.querySelector('img')).toBe(null);
    expect(cell.shadowRoot.querySelector('img')).toBe(null);
    expect(cell.shadowRoot.querySelector('slot').assignedNodes()[0].textContent).toBe('<img src=x onerror=alert(1)>');
    const row = bodyRows(el)[0];
    el.selectable = 'multiple';
    row.label = '<img src=x onerror=alert(1)>';
    await settle();
    expect(row.shadowRoot.querySelector('img')).toBe(null);
    expect(box(row).getAttribute('aria-label')).toBe('<img src=x onerror=alert(1)>');
  });
});

/* ------------------------------------------------------- selection toolbar */

const withToolbar = (attrs = 'selectable="multiple"', toolbarAttrs = '') =>
  table(`label="Files" ${attrs}`).replace(
    '<punica-table-header>',
    `<punica-table-selection-toolbar slot="toolbar" ${toolbarAttrs}>
      <button type="button" id="archive">Archive</button>
      <button type="button" id="share">Share</button>
    </punica-table-selection-toolbar>
    <punica-table-header>`
  );
const part = (el, name) => el.shadowRoot.querySelector(`[part="${name}"]`);
const keydown = (target, key) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));

describe('punica-table clearSelection', () => {
  afterEach(cleanup);

  it('clears every row, fires nothing, and the header follows', async () => {
    const el = await fixture(table('label="Files" selectable="multiple"'));
    let fired = 0;
    el.addEventListener('punica-select', () => fired++);
    bodyRows(el).forEach((row) => (row.selected = true));
    await settle();
    expect(el.selectedValues).toEqual(['a', 'b', 'c']);
    el.clearSelection();
    await settle();
    expect(el.selectedValues).toEqual([]);
    expect(bodyRows(el).some((row) => row.hasAttribute('selected'))).toBe(false);
    expect(box(headerRow(el)).checked).toBe(false);
    expect(box(headerRow(el)).indeterminate).toBe(false);
    expect(fired).toBe(0);
  });
});

describe('punica-table-selection-toolbar', () => {
  afterEach(cleanup);

  it('sits in the toolbar slot above the rows, across the table', async () => {
    const el = await fixture(withToolbar());
    const bar = el.querySelector('punica-table-selection-toolbar');
    const wrapper = part(el, 'toolbar');
    expect(wrapper.hidden).toBe(false);
    expect(getComputedStyle(wrapper).display).toBe('table-caption');
    const head = el.querySelector('punica-table-header').getBoundingClientRect();
    const r = part(bar, 'base').getBoundingClientRect();
    expect(r.bottom).toBeLessThanOrEqual(head.top + 1);
    expect(Math.round(r.width)).toBe(Math.round(el.getBoundingClientRect().width));
    // The toolbar is not a row.
    expect(el.rows.length).toBe(3);
  });

  it('shows the count and is a named toolbar while rows are selected', async () => {
    const el = await fixture(withToolbar());
    const bar = el.querySelector('punica-table-selection-toolbar');
    expect(bar.count).toBe(1);
    expect(bar.table).toBe(el);
    expect(part(bar, 'count').textContent).toBe('1 selected');
    expect(part(bar, 'clear-button').textContent).toBe('Clear selection');
    expect(bar.internals.role).toBe('toolbar');
    expect(bar.internals.ariaLabel).toBe('Bulk actions');
    expect(bar.matches(':state(empty)')).toBe(false);
    expect(part(bar, 'base').checkVisibility()).toBe(true);
  });

  it('is hidden and out of the tab order while nothing is selected', async () => {
    const el = await fixture(withToolbar());
    const bar = el.querySelector('punica-table-selection-toolbar');
    bodyRows(el)[1].selected = false;
    await settle();
    await settle();
    expect(bar.count).toBe(0);
    expect(bar.matches(':state(empty)')).toBe(true);
    expect(bar.internals.role).toBe(null);
    expect(part(bar, 'base').checkVisibility()).toBe(false);
    expect(el.querySelector('#archive').checkVisibility()).toBe(false);
    expect(part(bar, 'clear-button').checkVisibility()).toBe(false);
    expect(bar.getBoundingClientRect().height).toBe(0);
  });

  it('follows the person’s selection and announces the count politely, in the element’s language', async () => {
    const el = await fixture(`<div lang="de">${withToolbar()}</div>`);
    const t = el.querySelector('punica-table');
    const bar = t.querySelector('punica-table-selection-toolbar');
    const status = bar.shadowRoot.querySelector('[role="status"]');
    expect(status.textContent).toBe('');
    box(headerRow(t)).click();
    await settle();
    expect(part(bar, 'count').textContent).toBe('3 selected');
    expect(status.textContent).toBe('3 selected');
    // A status region is never inside the hidden bar, so the first selection is heard.
    expect(part(bar, 'base').contains(status)).toBe(false);
    bar.labelSelected = '{count} ausgewählt';
    const rows = [];
    for (let i = 0; i < 1200; i++) rows.push(`<punica-table-row value="r${i}"><punica-table-cell>${i}</punica-table-cell></punica-table-row>`);
    t.querySelector('punica-table-body').insertAdjacentHTML('beforeend', rows.join(''));
    await settle();
    await settle();
    // Three of 1203 selected: the indeterminate select-all selects every row.
    box(headerRow(t)).click();
    await settle();
    expect(t.selectedValues.length).toBe(1203);
    expect(part(bar, 'count').textContent).toBe('1.203 ausgewählt');
  });

  it('follows a selection set from code', async () => {
    const el = await fixture(withToolbar());
    const bar = el.querySelector('punica-table-selection-toolbar');
    bodyRows(el)[0].selected = true;
    await settle();
    await settle();
    expect(bar.count).toBe(2);
    expect(part(bar, 'count').textContent).toBe('2 selected');
    el.clearSelection();
    await settle();
    expect(bar.matches(':state(empty)')).toBe(true);
  });

  it('clears the selection as a person would: the table fires punica-select and focus returns to the rows', async () => {
    const el = await fixture(withToolbar());
    const bar = el.querySelector('punica-table-selection-toolbar');
    bodyRows(el)[0].selected = true;
    await settle();
    const clear = part(bar, 'clear-button');
    clear.focus();
    const selected = once(el, 'punica-select');
    clear.click();
    expect((await selected).detail).toEqual({ value: [], item: null });
    await settle();
    expect(el.selectedValues).toEqual([]);
    expect(bar.matches(':state(empty)')).toBe(true);
    expect(headerRow(el).shadowRoot.activeElement).toBe(box(headerRow(el)));
  });

  it('is one tab stop: arrow keys, Home and End move across the actions and the clear button', async () => {
    const el = await fixture(withToolbar());
    const bar = el.querySelector('punica-table-selection-toolbar');
    const clear = part(bar, 'clear-button');
    const archive = el.querySelector('#archive');
    const share = el.querySelector('#share');
    expect([archive.tabIndex, share.tabIndex, clear.tabIndex]).toEqual([0, -1, -1]);
    archive.focus();
    keydown(archive, 'ArrowRight');
    expect(document.activeElement).toBe(share);
    keydown(share, 'ArrowRight');
    expect(bar.shadowRoot.activeElement).toBe(clear);
    expect([archive.tabIndex, share.tabIndex, clear.tabIndex]).toEqual([-1, -1, 0]);
    keydown(clear, 'ArrowRight');
    expect(document.activeElement).toBe(archive);
    keydown(archive, 'End');
    expect(bar.shadowRoot.activeElement).toBe(clear);
    keydown(clear, 'Home');
    expect(document.activeElement).toBe(archive);
    keydown(archive, 'ArrowLeft');
    expect(bar.shadowRoot.activeElement).toBe(clear);
  });

  it('reverses the arrow keys right-to-left', async () => {
    const el = await fixture(`<div dir="rtl">${withToolbar()}</div>`);
    const archive = el.querySelector('#archive');
    archive.focus();
    keydown(archive, 'ArrowLeft');
    expect(document.activeElement).toBe(el.querySelector('#share'));
  });

  it('takes its words from attributes and writes them as text', async () => {
    const el = await fixture(withToolbar('selectable="multiple"', 'label="Toplu işlemler" label-clear="Seçimi temizle" label-selected="{count} satır seçili"'));
    const bar = el.querySelector('punica-table-selection-toolbar');
    expect(part(bar, 'count').textContent).toBe('1 satır seçili');
    expect(part(bar, 'clear-button').textContent).toBe('Seçimi temizle');
    expect(bar.internals.ariaLabel).toBe('Toplu işlemler');
    bar.labelSelected = '<img src=x onerror=alert(1)> {count}';
    await settle();
    expect(bar.shadowRoot.querySelector('img')).toBe(null);
    expect(part(bar, 'count').textContent).toBe('<img src=x onerror=alert(1)> 1');
  });

  it('reads a table named by for, anywhere in the document', async () => {
    const wrap = await fixture(`<div>
      <punica-table-selection-toolbar for="far-table"><button type="button">Delete</button></punica-table-selection-toolbar>
      ${table('id="far-table" label="Files" selectable="single"')}
    </div>`);
    const bar = wrap.querySelector('punica-table-selection-toolbar');
    const t = wrap.querySelector('punica-table');
    expect(bar.table).toBe(t);
    expect(part(t, 'toolbar').hidden).toBe(true);
    expect(bar.count).toBe(1);
    toggle(bodyRows(t)[0]);
    await settle();
    expect(part(bar, 'count').textContent).toBe('1 selected');
    expect(t.selectedValues).toEqual(['a']);
    const selected = once(t, 'punica-select');
    part(bar, 'clear-button').click();
    expect((await selected).detail.value).toEqual([]);
    await settle();
    expect(bar.matches(':state(empty)')).toBe(true);
    // A table added after the toolbar is found too.
    bar.for = 'later';
    await settle();
    expect(bar.table).toBe(null);
    expect(bar.count).toBe(0);
    const later = document.createElement('div');
    later.innerHTML = table('id="later" label="More" selectable="multiple"');
    wrap.append(later);
    await settle();
    await settle();
    expect(bar.table).toBe(later.firstElementChild);
    expect(part(bar, 'count').textContent).toBe('1 selected');
  });

  it('stops listening to its table when disconnected', async () => {
    const el = await fixture(withToolbar());
    const bar = el.querySelector('punica-table-selection-toolbar');
    const before = part(bar, 'count').textContent;
    const parent = bar.parentElement;
    bar.remove();
    box(headerRow(el)).click();
    await settle();
    expect(part(bar, 'count').textContent).toBe(before);
    parent.prepend(bar);
    await settle();
    expect(part(bar, 'count').textContent).toBe('3 selected');
  });
});
