import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './breadcrumbs.js';
import './breadcrumbItem.js';

const html = (attrs = '') => `<punica-breadcrumbs ${attrs}>
  <punica-breadcrumb-item href="#home">Home</punica-breadcrumb-item>
  <punica-breadcrumb-item href="#products">Products</punica-breadcrumb-item>
  <punica-breadcrumb-item href="#laptops">Laptops</punica-breadcrumb-item>
  <punica-breadcrumb-item href="#ultrabooks">Ultrabooks</punica-breadcrumb-item>
  <punica-breadcrumb-item href="#model" current>Model 14</punica-breadcrumb-item>
</punica-breadcrumbs>`;

const itemsOf = (el) => [...el.querySelectorAll('punica-breadcrumb-item')];
const link = (item) => item.shadowRoot.querySelector('a');
const slotOf = (item) => item.assignedSlot?.id;
const separatorShown = (item) => getComputedStyle(item.shadowRoot.querySelector('[part=separator]')).display !== 'none';

contract('punica-breadcrumbs', { html: html() });
contract('punica-breadcrumbs', {
  html: html('max-items="3"'),
  open: (el) => el.shadowRoot.querySelector('[part=more]').click()
});
contract('punica-breadcrumb-item', { html: html() });

describe('punica-breadcrumbs', () => {
  afterEach(cleanup);

  it('creates both tags with createElement', () => {
    expect(document.createElement('punica-breadcrumbs').attributes.length).toBe(0);
    expect(document.createElement('punica-breadcrumb-item').attributes.length).toBe(0);
  });

  it('is a named nav holding an ordered list of links', async () => {
    const el = await fixture(html());
    const nav = el.shadowRoot.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(nav.querySelector('ol')).toBeTruthy();
    const items = itemsOf(el);
    expect(items[0].internals.role).toBe('listitem');
    expect(link(items[0]).getAttribute('href')).toBe('#home');
    expect(items.every((item) => slotOf(item) === 'rest')).toBe(true);
  });

  it('marks the current page', async () => {
    const el = await fixture(html());
    const items = itemsOf(el);
    expect(link(items[4]).getAttribute('aria-current')).toBe('page');
    expect(link(items[0]).hasAttribute('aria-current')).toBe(false);
    items[4].current = false;
    await settle();
    expect(link(items[4]).hasAttribute('aria-current')).toBe(false);
  });

  it('renders an item with no href as text', async () => {
    const el = await fixture(
      '<punica-breadcrumbs><punica-breadcrumb-item href="#a">A</punica-breadcrumb-item><punica-breadcrumb-item current>B</punica-breadcrumb-item></punica-breadcrumbs>'
    );
    const a = link(itemsOf(el)[1]);
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.getAttribute('aria-current')).toBe('page');
  });

  it('draws a separator after every item but the last', async () => {
    const el = await fixture(html());
    expect(itemsOf(el).map(separatorShown)).toEqual([true, true, true, true, false]);
  });

  it('is operated by the keyboard through its native links', async () => {
    const el = await fixture(html());
    const item = itemsOf(el)[1];
    item.focus();
    expect(item.shadowRoot.activeElement).toBe(link(item));
  });

  it('collapses the middle behind a named button with max-items', async () => {
    const el = await fixture(html('max-items="3"'));
    const items = itemsOf(el);
    expect(items.map(slotOf)).toEqual(['first', 'collapsed', 'collapsed', 'rest', 'rest']);
    const more = el.shadowRoot.querySelector('[part=more]');
    expect(more.localName).toBe('button');
    expect(more.getAttribute('aria-label')).toBe('Show more');
    expect(el.shadowRoot.querySelector('[part=more-item]').hidden).toBe(false);
    expect(items[1].getBoundingClientRect().width).toBe(0);
    el.maxItems = null;
    await settle();
    expect(items.map(slotOf)).toEqual(['rest', 'rest', 'rest', 'rest', 'rest']);
    expect(el.shadowRoot.querySelector('[part=more-item]').hidden).toBe(true);
  });

  it('opens the collapsed items in a popover and closes it when one is followed', async () => {
    const el = await fixture(html('max-items="2" label-more="More pages"'));
    const items = itemsOf(el);
    const popover = el.shadowRoot.querySelector('punica-popover');
    const more = el.shadowRoot.querySelector('[part=more]');
    expect(more.getAttribute('aria-label')).toBe('More pages');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    const opened = once(popover, 'punica-open');
    more.click();
    await opened;
    await settle();
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(items[1].getBoundingClientRect().width).toBeGreaterThan(0);
    expect(separatorShown(items[1])).toBe(false);
    // Focus went to the first collapsed link.
    expect(items[1].shadowRoot.activeElement).toBe(link(items[1]));
    link(items[2]).addEventListener('click', (e) => e.preventDefault());
    link(items[2]).click();
    await settle();
    expect(popover.open).toBe(false);
  });

  it('works when the items exist before the parent is connected, and follows later changes', async () => {
    const el = document.createElement('punica-breadcrumbs');
    el.maxItems = 2;
    for (const name of ['A', 'B', 'C']) {
      const item = document.createElement('punica-breadcrumb-item');
      item.href = `#${name}`;
      item.textContent = name;
      el.append(item);
    }
    const host = await fixture('<div></div>');
    host.append(el);
    await settle();
    expect(itemsOf(el).map(slotOf)).toEqual(['first', 'collapsed', 'rest']);
    const item = document.createElement('punica-breadcrumb-item');
    item.textContent = 'D';
    el.append(item);
    await settle();
    await settle();
    expect(itemsOf(el).map(slotOf)).toEqual(['first', 'collapsed', 'collapsed', 'rest']);
    itemsOf(el)[1].remove();
    itemsOf(el)[1].remove();
    await settle();
    await settle();
    expect(itemsOf(el).map(slotOf)).toEqual(['rest', 'rest']);
  });
});
