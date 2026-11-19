import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './tree.js';
import './treeItem.js';

const html = (attrs = '') => `<punica-tree label="Files" ${attrs}>
  <punica-tree-item label="Documents" value="docs" expanded>
    <punica-tree-item label="Report.pdf" value="report"></punica-tree-item>
    <punica-tree-item label="Budget" value="budget">
      <punica-tree-item label="Q1.xlsx" value="q1"></punica-tree-item>
    </punica-tree-item>
    <punica-tree-item label="Draft.txt" value="draft" disabled></punica-tree-item>
  </punica-tree-item>
  <punica-tree-item label="Music" value="music">
    <punica-tree-item label="Song.mp3" value="song"></punica-tree-item>
  </punica-tree-item>
  <punica-tree-item label="Notes.txt" value="notes"></punica-tree-item>
</punica-tree>`;

const key = (el, k, init = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init }));
const item = (el, value) => el.querySelector(`punica-tree-item[value="${value}"]`);
const row = (it) => it.shadowRoot.querySelector('[part=row]');
const tabStops = (el) => [...el.querySelectorAll('punica-tree-item')].filter((i) => i.tabIndex === 0).map((i) => i.value);

// label-content-name-mismatch compares an item's accessible name with all the
// text under its host. A branch's host also holds its child items, so the
// rule reads "Documents Report.pdf Budget…" as the visible label of an item
// named "Documents". The row's visible label is its name; the rule cannot
// tell the row from the group.
const axeDisable = ['label-content-name-mismatch'];
contract('punica-tree', { html: html(), axeDisable });
contract('punica-tree', { html: html('selection="multiple"'), axeDisable });
contract('punica-tree-item', { html: html(), axeDisable });

describe('punica-tree', () => {
  afterEach(cleanup);

  it('creates both tags with createElement', () => {
    expect(document.createElement('punica-tree').attributes.length).toBe(0);
    expect(document.createElement('punica-tree-item').attributes.length).toBe(0);
  });

  it('exposes tree, treeitem and group with level, set size and position', async () => {
    const el = await fixture(html());
    const docs = item(el, 'docs');
    const budget = item(el, 'budget');
    const q1 = item(el, 'q1');
    expect(el.internals.role).toBe('tree');
    expect(el.internals.ariaLabel).toBe('Files');
    expect(docs.internals.role).toBe('treeitem');
    expect(docs.internals.ariaLabel).toBe('Documents');
    expect(docs.shadowRoot.querySelector('[part=group]').getAttribute('role')).toBe('group');
    expect([docs.internals.ariaLevel, docs.internals.ariaSetSize, docs.internals.ariaPosInSet]).toEqual(['1', '3', '1']);
    expect([budget.internals.ariaLevel, budget.internals.ariaSetSize, budget.internals.ariaPosInSet]).toEqual(['2', '3', '2']);
    expect(q1.internals.ariaLevel).toBe('3');
    expect(docs.internals.ariaExpanded).toBe('true');
    expect(budget.internals.ariaExpanded).toBe('false');
    expect(q1.internals.ariaExpanded).toBe(null);
    expect(item(el, 'draft').internals.ariaDisabled).toBe('true');
    // No selection: aria-selected is absent.
    expect(docs.internals.ariaSelected).toBe(null);
  });

  it('shows only the children of expanded items', async () => {
    const el = await fixture(html());
    expect(el.visibleItems.map((i) => i.value)).toEqual(['docs', 'report', 'budget', 'draft', 'music', 'notes']);
    expect(item(el, 'q1').getBoundingClientRect().height).toBe(0);
    expect(item(el, 'report').getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it('has one tab stop', async () => {
    const el = await fixture(html());
    expect(tabStops(el)).toEqual(['docs']);
    item(el, 'report').focus();
    expect(tabStops(el)).toEqual(['report']);
  });

  it('moves with Up, Down, Home and End over visible, enabled items', async () => {
    const el = await fixture(html());
    item(el, 'docs').focus();
    key(document.activeElement, 'ArrowDown');
    expect(document.activeElement.value).toBe('report');
    key(document.activeElement, 'ArrowDown');
    expect(document.activeElement.value).toBe('budget');
    key(document.activeElement, 'ArrowDown');
    expect(document.activeElement.value).toBe('music');
    key(document.activeElement, 'End');
    expect(document.activeElement.value).toBe('notes');
    key(document.activeElement, 'ArrowDown');
    expect(document.activeElement.value).toBe('notes');
    key(document.activeElement, 'ArrowUp');
    expect(document.activeElement.value).toBe('music');
    key(document.activeElement, 'Home');
    expect(document.activeElement.value).toBe('docs');
    key(document.activeElement, 'ArrowUp');
    expect(document.activeElement.value).toBe('docs');
    expect(tabStops(el)).toEqual(['docs']);
  });

  it('expands and enters with Right, collapses and leaves with Left, firing punica-toggle', async () => {
    const el = await fixture(html());
    const seen = [];
    el.addEventListener('punica-toggle', (e) => seen.push([e.detail.item.value, e.detail.open, e.target.value]));
    const budget = item(el, 'budget');
    budget.focus();
    key(budget, 'ArrowRight');
    await settle();
    expect(budget.expanded).toBe(true);
    expect(budget.internals.ariaExpanded).toBe('true');
    expect(document.activeElement).toBe(budget);
    key(budget, 'ArrowRight');
    expect(document.activeElement.value).toBe('q1');
    key(document.activeElement, 'ArrowRight');
    expect(document.activeElement.value).toBe('q1');
    key(document.activeElement, 'ArrowLeft');
    expect(document.activeElement).toBe(budget);
    key(budget, 'ArrowLeft');
    expect(budget.expanded).toBe(false);
    key(budget, 'ArrowLeft');
    expect(document.activeElement.value).toBe('docs');
    expect(seen).toEqual([
      ['budget', true, 'budget'],
      ['budget', false, 'budget']
    ]);
  });

  it('mirrors Right and Left in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${html()}</div>`);
    const budget = item(wrap, 'budget');
    budget.focus();
    key(budget, 'ArrowLeft');
    expect(budget.expanded).toBe(true);
    key(budget, 'ArrowLeft');
    expect(document.activeElement.value).toBe('q1');
    key(document.activeElement, 'ArrowRight');
    expect(document.activeElement).toBe(budget);
    key(budget, 'ArrowRight');
    expect(budget.expanded).toBe(false);
  });

  it('expands the sibling branches with *', async () => {
    const el = await fixture(html());
    const docs = item(el, 'docs');
    docs.expanded = false;
    await settle();
    docs.focus();
    key(docs, '*');
    expect(docs.expanded).toBe(true);
    expect(item(el, 'music').expanded).toBe(true);
    expect(item(el, 'budget').expanded).toBe(false);
    expect(item(el, 'notes').expanded).toBe(false);
  });

  it('finds an item by typing', async () => {
    const el = await fixture(html());
    item(el, 'docs').focus();
    key(document.activeElement, 'n');
    expect(document.activeElement.value).toBe('notes');
    await new Promise((r) => setTimeout(r, 550));
    key(document.activeElement, 'b');
    key(document.activeElement, 'u');
    expect(document.activeElement.value).toBe('budget');
  });

  it('moves the tab stop to a branch that closes over it', async () => {
    const el = await fixture(html());
    item(el, 'report').focus();
    item(el, 'docs').expanded = false;
    await settle();
    await settle();
    expect(tabStops(el)).toEqual(['docs']);
  });

  it('toggles a branch on a row click and with Enter when nothing is selectable', async () => {
    const el = await fixture(html());
    const music = item(el, 'music');
    let selects = 0;
    el.addEventListener('punica-select', () => selects++);
    const toggled = once(el, 'punica-toggle');
    row(music).click();
    expect((await toggled).detail).toEqual({ open: true, item: music });
    expect(music.expanded).toBe(true);
    expect(document.activeElement).toBe(music);
    key(music, 'Enter');
    expect(music.expanded).toBe(false);
    expect(selects).toBe(0);
  });

  it('selects one item in single selection and fires punica-select', async () => {
    const el = await fixture(html('selection="single"'));
    const report = item(el, 'report');
    const notes = item(el, 'notes');
    expect(report.internals.ariaSelected).toBe('false');
    let event = once(el, 'punica-select');
    row(report).click();
    expect((await event).detail).toEqual({ value: 'report', item: report });
    await settle();
    expect(report.selected).toBe(true);
    expect(report.internals.ariaSelected).toBe('true');
    notes.focus();
    event = once(el, 'punica-select');
    key(notes, ' ');
    expect((await event).detail.value).toBe('notes');
    expect(report.selected).toBe(false);
    expect(el.selectedItems).toEqual([notes]);
    let fired = 0;
    el.addEventListener('punica-select', () => fired++);
    key(notes, 'Enter');
    notes.selected = false;
    expect(fired).toBe(0);
  });

  it('toggles items in multiple selection', async () => {
    const el = await fixture(html('selection="multiple"'));
    expect(el.internals.ariaMultiSelectable).toBe('true');
    const report = item(el, 'report');
    const notes = item(el, 'notes');
    row(report).click();
    row(notes).click();
    expect(el.selectedItems.map((i) => i.value)).toEqual(['report', 'notes']);
    key(notes, ' ');
    expect(el.selectedItems.map((i) => i.value)).toEqual(['report']);
  });

  it('only toggles from the expand indicator', async () => {
    const el = await fixture(html('selection="single"'));
    const music = item(el, 'music');
    music.shadowRoot.querySelector('[part=toggle]').click();
    expect(music.expanded).toBe(true);
    expect(music.selected).toBe(false);
  });

  it('ignores a disabled item', async () => {
    const el = await fixture(html('selection="single"'));
    const draft = item(el, 'draft');
    row(draft).click();
    expect(draft.selected).toBe(false);
    expect(el.visibleItems.includes(draft)).toBe(true);
  });

  it('asks for the children of a lazy item once with punica-load', async () => {
    const el = await fixture(
      '<punica-tree label="Remote"><punica-tree-item label="Server" value="server" lazy></punica-tree-item></punica-tree>'
    );
    const server = item(el, 'server');
    expect(server.internals.ariaExpanded).toBe('false');
    let loads = 0;
    el.addEventListener('punica-load', () => loads++);
    server.focus();
    const event = once(el, 'punica-load');
    key(server, 'ArrowRight');
    expect((await event).detail.item).toBe(server);
    await settle();
    expect(server.loading).toBe(true);
    expect(server.internals.ariaBusy).toBe('true');
    const child = document.createElement('punica-tree-item');
    child.label = 'logs';
    child.value = 'logs';
    server.append(child);
    server.lazy = false;
    await settle();
    await settle();
    expect(server.loading).toBe(false);
    expect(child.internals.ariaLevel).toBe('2');
    key(server, 'ArrowRight');
    expect(document.activeElement).toBe(child);
    expect(loads).toBe(1);
  });

  it('works when the items exist before the tree is connected, and renumbers on change', async () => {
    const el = document.createElement('punica-tree');
    const a = document.createElement('punica-tree-item');
    const a1 = document.createElement('punica-tree-item');
    const b = document.createElement('punica-tree-item');
    a.label = 'A';
    a1.label = 'A1';
    b.label = 'B';
    a.append(a1);
    el.append(a, b);
    el.selection = 'single';
    const host = await fixture('<div></div>');
    host.append(el);
    await settle();
    await settle();
    expect(a.tabIndex).toBe(0);
    expect(b.tabIndex).toBe(-1);
    expect(a.internals.ariaExpanded).toBe('false');
    expect(a1.internals.ariaLevel).toBe('2');
    expect(b.internals.ariaSelected).toBe('false');
    const c = document.createElement('punica-tree-item');
    c.label = 'C';
    el.append(c);
    await settle();
    await settle();
    expect(b.internals.ariaSetSize).toBe('3');
    expect(c.internals.ariaPosInSet).toBe('3');
    a.focus();
    key(a, 'End');
    expect(document.activeElement).toBe(c);
  });

  it('expands and collapses everything from the API without events', async () => {
    const el = await fixture(html());
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    el.expandAll();
    expect(el.visibleItems.length).toBe(8);
    el.collapseAll();
    expect(el.visibleItems.length).toBe(3);
    expect(fired).toBe(0);
  });
});
