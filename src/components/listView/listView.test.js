import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './list.js';
import './listItem.js';

const html = (attrs = '') => `<punica-list label="Settings" ${attrs}>
  <punica-list-item><span slot="start">★</span>Plain row<span slot="end">3</span></punica-list-item>
  <punica-list-item interactive value="wifi" selected>Wi-Fi</punica-list-item>
  <punica-list-item interactive href="#bluetooth" value="bt">Bluetooth</punica-list-item>
  <punica-list-item interactive disabled>Cellular</punica-list-item>
</punica-list>`;

const itemsOf = (el) => [...el.querySelectorAll('punica-list-item')];
const base = (item) => item.shadowRoot.querySelector('[part=base]');

contract('punica-list', { html: html() });
contract('punica-list-item', { html: html() });

describe('punica-list', () => {
  afterEach(cleanup);

  it('creates both tags with createElement', () => {
    expect(document.createElement('punica-list').attributes.length).toBe(0);
    expect(document.createElement('punica-list-item').attributes.length).toBe(0);
  });

  it('is a named list of list items', async () => {
    const el = await fixture(html());
    expect(el.internals.role).toBe('list');
    expect(el.internals.ariaLabel).toBe('Settings');
    expect(itemsOf(el)[0].internals.role).toBe('listitem');
    expect(el.items.length).toBe(4);
  });

  it('does not grow its template on reconnect', async () => {
    // 1.x appended its template again on every connect.
    const el = await fixture(html());
    const parent = el.parentElement;
    for (let i = 0; i < 3; i++) {
      el.remove();
      parent.append(el);
    }
    await settle();
    expect(el.shadowRoot.querySelectorAll('slot').length).toBe(1);
    expect(itemsOf(el)[1].shadowRoot.querySelectorAll('[part=base]').length).toBe(1);
  });

  it('renders the native element for the job', async () => {
    const el = await fixture(html());
    const [plain, button, link, disabled] = itemsOf(el);
    expect(base(plain).localName).toBe('div');
    expect(base(button).localName).toBe('button');
    expect(base(button).type).toBe('button');
    expect(base(button).getAttribute('aria-current')).toBe('true');
    expect(base(link).localName).toBe('a');
    expect(base(link).getAttribute('href')).toBe('#bluetooth');
    expect(base(disabled).disabled).toBe(true);
    plain.interactive = true;
    await settle();
    expect(base(plain).localName).toBe('button');
    expect(base(plain).querySelectorAll('slot').length).toBe(2);
    plain.interactive = false;
    await settle();
    expect(base(plain).localName).toBe('div');
  });

  it('keeps the end slot outside the button', async () => {
    const el = await fixture(html());
    const item = itemsOf(el)[1];
    expect(item.shadowRoot.querySelector('slot[name=end]').closest('[part=base]')).toBe(null);
  });

  it('is operated by the keyboard through the native control and fires punica-select', async () => {
    const el = await fixture(html());
    const [, button] = itemsOf(el);
    button.focus();
    expect(button.shadowRoot.activeElement).toBe(base(button));
    const event = once(el, 'punica-select');
    base(button).click();
    const { detail } = await event;
    expect(detail.value).toBe('wifi');
    expect(detail.item).toBe(button);
  });

  it('fires nothing for a plain or a disabled row', async () => {
    const el = await fixture(html());
    const [plain, , , disabled] = itemsOf(el);
    let fired = 0;
    el.addEventListener('punica-select', () => fired++);
    base(plain).click();
    base(disabled).click();
    expect(fired).toBe(0);
  });

  it('takes a disabled link out of the tab order', async () => {
    const el = await fixture(
      '<punica-list label="Links"><punica-list-item interactive disabled href="#x">X</punica-list-item></punica-list>'
    );
    const a = base(itemsOf(el)[0]);
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.getAttribute('aria-disabled')).toBe('true');
  });

  it('draws dividers and dense rows from attributes', async () => {
    const el = await fixture(html('dividers dense'));
    const [first, second] = itemsOf(el);
    expect(getComputedStyle(first).borderBlockStartStyle).toBe('none');
    expect(getComputedStyle(second).borderBlockStartStyle).toBe('solid');
    expect(getComputedStyle(base(second)).paddingBlockStart).toBe('4px');
  });
});
