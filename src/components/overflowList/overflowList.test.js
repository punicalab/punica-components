import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './overflowList.js';

const names = ['Cut', 'Copy', 'Paste', 'Bold', 'Italic', 'Link'];
const html = (width = 200, attrs = '') => `<punica-overflow-list style="width:${width}px" ${attrs}>
  ${names.map((n) => `<button style="width:60px;box-sizing:border-box">${n}</button>`).join('')}
</punica-overflow-list>`;

const slots = (el) => [...el.children].map((child) => child.assignedSlot?.id);
const more = (el) => el.shadowRoot.querySelector('[part=more]');
const popover = (el) => el.shadowRoot.querySelector('punica-popover');
const frames = async (n = 3) => {
  for (let i = 0; i < n; i++) await settle();
};

contract('punica-overflow-list', { html: html() });
contract('punica-overflow-list', { html: html(), open: (el) => more(el).click() });

describe('punica-overflow-list', () => {
  afterEach(cleanup);

  it('is created by createElement', () => {
    const el = document.createElement('punica-overflow-list');
    expect(el.attributes.length).toBe(0);
    expect(el.overflowCount).toBe(0);
  });

  it('keeps every child in the row when they fit, with no button', async () => {
    const el = await fixture(html(500));
    expect(slots(el)).toEqual(Array(6).fill('visible'));
    expect(popover(el).hidden).toBe(true);
    expect(more(el).getBoundingClientRect().width).toBe(0);
    expect(el.overflowCount).toBe(0);
  });

  it('moves the children that do not fit behind a named button', async () => {
    const el = await fixture(html(200));
    expect(slots(el)).toEqual(['visible', 'visible', 'overflow', 'overflow', 'overflow', 'overflow']);
    expect(el.overflowCount).toBe(4);
    expect(more(el).localName).toBe('button');
    expect(more(el).getAttribute('aria-label')).toBe('More');
    expect(el.children[2].getBoundingClientRect().width).toBe(0);
    // One row: the button sits beside the last child that fits.
    const row = el.getBoundingClientRect();
    expect(more(el).getBoundingClientRect().right).toBeLessThanOrEqual(row.right + 0.5);
    expect(el.children[1].getBoundingClientRect().top).toBe(el.children[0].getBoundingClientRect().top);
  });

  it('fires punica-overflow with the count as the room changes', async () => {
    const el = await fixture(html(500));
    let event = once(el, 'punica-overflow');
    el.style.width = '200px';
    expect((await event).detail).toEqual({ count: 4 });
    expect(slots(el).filter((s) => s === 'overflow').length).toBe(4);
    event = once(el, 'punica-overflow');
    el.style.width = '340px';
    expect((await event).detail).toEqual({ count: 2 });
    event = once(el, 'punica-overflow');
    el.style.width = '500px';
    expect((await event).detail).toEqual({ count: 0 });
    expect(popover(el).hidden).toBe(true);
  });

  it('does not fire while the count stays the same', async () => {
    const el = await fixture(html(200));
    let fired = 0;
    el.addEventListener('punica-overflow', () => fired++);
    el.style.width = '210px';
    await frames();
    el.layout();
    expect(fired).toBe(0);
  });

  it('opens the overflowing children in a popover, operable by keyboard', async () => {
    const el = await fixture(html(200, 'label-more="More actions"'));
    const button = more(el);
    expect(button.getAttribute('aria-label')).toBe('More actions');
    button.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
    const opened = once(popover(el), 'punica-open');
    button.click();
    await opened;
    await settle();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const hidden = el.children[2];
    expect(hidden.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(document.activeElement).toBe(hidden);
    let clicked = 0;
    hidden.addEventListener('click', () => clicked++);
    hidden.click();
    await settle();
    expect(clicked).toBe(1);
    expect(popover(el).open).toBe(false);
  });

  it('lays out again when children are added or removed', async () => {
    const el = await fixture(html(500));
    for (const name of ['Undo', 'Redo']) {
      const button = document.createElement('button');
      button.style.width = '60px';
      button.textContent = name;
      el.append(button);
    }
    await frames();
    expect(el.overflowCount).toBeGreaterThan(0);
    expect(slots(el).at(-1)).toBe('overflow');
    while (el.children.length > 3) el.lastElementChild.remove();
    await frames();
    expect(el.overflowCount).toBe(0);
    expect(slots(el)).toEqual(['visible', 'visible', 'visible']);
  });

  it('works when the children exist before it is connected', async () => {
    const el = document.createElement('punica-overflow-list');
    for (const name of names) {
      const button = document.createElement('button');
      button.style.width = '60px';
      button.textContent = name;
      el.append(button);
    }
    const host = await fixture('<div style="width:200px"></div>');
    host.append(el);
    await frames();
    expect(el.overflowCount).toBe(4);
  });

  it('stops observing when removed', async () => {
    const el = await fixture(html(500));
    const parent = el.parentElement;
    el.remove();
    let fired = 0;
    el.addEventListener('punica-overflow', () => fired++);
    el.style.width = '100px';
    el.append(document.createElement('button'));
    await frames();
    expect(fired).toBe(0);
    parent.append(el);
    await frames();
    expect(fired).toBe(1);
    expect(el.overflowCount).toBeGreaterThan(0);
  });
});
