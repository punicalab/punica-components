import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, a11y } from '../../../test/contract.js';
import './metadataList.js';

const html = `<punica-metadata-list label="Order details" style="width:480px">
  <punica-metadata-list-item label="Order">#10482</punica-metadata-list-item>
  <punica-metadata-list-item label="Status">Shipped</punica-metadata-list-item>
  <punica-metadata-list-item label="Tracking number" copyable>1Z 999 AA1 01 2345 6784</punica-metadata-list-item>
</punica-metadata-list>`;
const itemHtml = '<punica-metadata-list-item label="Owner">Ada Lovelace</punica-metadata-list-item>';
const items = (el) => [...el.querySelectorAll('punica-metadata-list-item')];
const part = (item, name) => item.shadowRoot.querySelector(`[part="${name}"]`);
const rect = (node) => node.getBoundingClientRect();

contract('punica-metadata-list', { html });
contract('punica-metadata-list-item', { html: `<div role="list">${itemHtml}</div>`.replace('<div role="list">', '<punica-metadata-list>').replace('</div>', '</punica-metadata-list>') });

describe('punica-metadata-list', () => {
  afterEach(cleanup);

  it('is a named list of items, each a term and its definition', async () => {
    const el = await fixture(html);
    expect(el.internals.role).toBe('list');
    expect(el.internals.ariaLabel).toBe('Order details');
    for (const item of items(el)) {
      expect(item.internals.role).toBe('listitem');
      expect(part(item, 'label').getAttribute('role')).toBe('term');
      expect(part(item, 'value').getAttribute('role')).toBe('definition');
    }
    expect(part(items(el)[1], 'label').textContent).toBe('Status');
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('takes the label from the label slot in place of the attribute', async () => {
    const el = await fixture(`<punica-metadata-list>
      <punica-metadata-list-item label="ignored"><span slot="label"><b>Due</b> date</span>3 March</punica-metadata-list-item>
    </punica-metadata-list>`);
    const slot = part(items(el)[0], 'label').querySelector('slot');
    expect(slot.assignedElements()[0].textContent).toBe('Due date');
  });

  it('inline: labels share one column, each beside its value', async () => {
    const el = await fixture(html);
    const [a, b, c] = items(el);
    const valueStart = rect(part(a, 'value')).left;
    expect(rect(part(b, 'value')).left).toBe(valueStart);
    expect(rect(part(c, 'value')).left).toBe(valueStart);
    expect(rect(part(a, 'label')).top).toBe(rect(part(a, 'value')).top);
    expect(valueStart).toBeGreaterThan(rect(part(c, 'label')).left + 50);
  });

  it('stacked: each label above its value', async () => {
    const el = await fixture(html.replace('<punica-metadata-list ', '<punica-metadata-list layout="stacked" '));
    const [a] = items(el);
    expect(rect(part(a, 'value')).top).toBeGreaterThanOrEqual(rect(part(a, 'label')).bottom);
    expect(rect(part(a, 'value')).left).toBe(rect(part(a, 'label')).left);
  });

  it('columns: items flow into the number of columns, one under 480 px', async () => {
    const el = await fixture(html.replace('<punica-metadata-list ', '<punica-metadata-list layout="columns" columns="3" ').replace('width:480px', 'width:600px'));
    const [a, b, c] = items(el).map(rect);
    expect(a.top).toBe(b.top);
    expect(b.top).toBe(c.top);
    expect(b.left).toBeGreaterThan(a.right);
    el.columns = 2;
    await settle();
    const [a2, b2, c2] = items(el).map(rect);
    expect(a2.top).toBe(b2.top);
    expect(c2.top).toBeGreaterThanOrEqual(a2.bottom);
    el.style.width = '400px';
    await settle();
    const [a3, b3] = items(el).map(rect);
    expect(b3.top).toBeGreaterThan(a3.top);
    el.columns = 99;
    el.style.width = '600px';
    await settle();
    const [a4, b4] = items(el).map(rect);
    expect(a4.top).toBe(b4.top);
  });

  it('dividers draw a line between items, dense tightens the type', async () => {
    const el = await fixture(html);
    const [a, b] = items(el);
    const size = parseFloat(getComputedStyle(part(b, 'value')).fontSize);
    el.dividers = true;
    await settle();
    expect(getComputedStyle(a).borderTopWidth).toBe('0px');
    expect(getComputedStyle(b).borderTopWidth).toBe('1px');
    el.dense = true;
    await settle();
    expect(parseFloat(getComputedStyle(part(b, 'value')).fontSize)).toBeLessThan(size);
  });

  it('copies the value with the copy button, named and described, and announces it', async () => {
    const el = await fixture(html);
    const item = items(el)[2];
    const button = part(item, 'copy-button');
    expect(part(items(el)[0], 'copy-button').hidden).toBe(true);
    expect(part(items(el)[0], 'status').hidden).toBe(true);
    expect(part(item, 'status').hidden).toBe(false);
    expect(button.hidden).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Copy');
    expect(item.shadowRoot.getElementById(button.getAttribute('aria-describedby')).textContent).toBe('Tracking number');
    let written = null;
    const original = navigator.clipboard.writeText;
    navigator.clipboard.writeText = async (text) => {
      written = text;
    };
    try {
      button.focus();
      await userEvent.keyboard('{Enter}');
      await settle();
      expect(written).toBe('1Z 999 AA1 01 2345 6784');
      expect(item.matches(':state(copied)')).toBe(true);
      expect(part(item, 'status').textContent).toBe('Copied');
      item.copyValue = '1Z999AA10123456784';
      item.labelCopied = 'Kopyalandı';
      await settle();
      await item.copy();
      expect(written).toBe('1Z999AA10123456784');
      expect(part(item, 'status').textContent).toBe('Kopyalandı');
    } finally {
      navigator.clipboard.writeText = original;
    }
  });

  it('mirrors right to left: labels on the right', async () => {
    const wrap = await fixture(`<div dir="rtl">${html}</div>`);
    const [a] = items(wrap.querySelector('punica-metadata-list'));
    expect(rect(part(a, 'label')).left).toBeGreaterThan(rect(part(a, 'value')).left);
  });

  it('renders its label as text', async () => {
    const el = await fixture(`<punica-metadata-list>${itemHtml}</punica-metadata-list>`);
    const item = items(el)[0];
    item.label = '<img src=x onerror="window.__pwned=1">';
    await settle();
    expect(item.shadowRoot.querySelector('img')).toBe(null);
    expect(part(item, 'label').textContent).toBe('<img src=x onerror="window.__pwned=1">');
    expect(window.__pwned).toBeUndefined();
  });
});
