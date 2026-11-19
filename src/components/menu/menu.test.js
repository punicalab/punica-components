import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import { deepActiveElement } from '../../core/a11y.js';
import './menu.js';
import './menuItem.js';
import './menuCheckboxItem.js';
import './menuRadioGroup.js';
import './menuRadioItem.js';
import './menuDivider.js';
import './menuGroup.js';

const html = `<punica-menu>
  <button slot="trigger">Actions</button>
  <punica-menu-item value="cut">Cut</punica-menu-item>
  <punica-menu-item value="copy">Copy</punica-menu-item>
  <punica-menu-item value="disabled" disabled>Colour</punica-menu-item>
  <punica-menu-divider></punica-menu-divider>
  <punica-menu-group label="View">
    <punica-menu-checkbox-item value="grid">Grid</punica-menu-checkbox-item>
  </punica-menu-group>
  <punica-menu-radio-group label="Sort" value="name">
    <punica-menu-radio-item value="name">Name</punica-menu-radio-item>
    <punica-menu-radio-item value="date">Date</punica-menu-radio-item>
  </punica-menu-radio-group>
  <punica-menu-item id="more">More
    <punica-menu slot="submenu">
      <punica-menu-item value="rename">Rename</punica-menu-item>
      <punica-menu-item value="delete">Delete</punica-menu-item>
    </punica-menu>
  </punica-menu-item>
</punica-menu>`;

const open = async (el) => {
  el.show();
  await settle();
};

for (const tag of [
  'punica-menu',
  'punica-menu-item',
  'punica-menu-checkbox-item',
  'punica-menu-radio-group',
  'punica-menu-radio-item',
  'punica-menu-divider',
  'punica-menu-group'
]) {
  contract(tag, { html, open });
}

const press = (key, init = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true, ...init });
  deepActiveElement().dispatchEvent(event);
  return event;
};
const active = () => deepActiveElement();
const text = (el) => el?.labelText;

describe('punica-menu', () => {
  afterEach(cleanup);

  it('opens a role=menu panel in the top layer and names it from the trigger', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('[slot=trigger]');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    const opened = once(el, 'punica-open');
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }));
    await opened;
    expect(el.panel.getAttribute('role')).toBe('menu');
    expect(el.panel.matches(':popover-open')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    // A pointer click leaves focus on the menu, not on an item.
    expect(el.shadowRoot.activeElement).toBe(el.panel);
    expect(el.items[0].internals.role).toBe('menuitem');
    expect(el.querySelector('punica-menu-checkbox-item').internals.role).toBe('menuitemcheckbox');
    expect(el.querySelector('punica-menu-radio-item').internals.role).toBe('menuitemradio');
    expect(el.querySelector('punica-menu-divider').internals.role).toBe('separator');
    expect(el.querySelector('punica-menu-group').internals.ariaLabel).toBe('View');
  });

  it('has no axe violations while open', async () => {
    const el = await fixture(html);
    await open(el);
    await new Promise((r) => setTimeout(r, 200));
    // axe-core cannot read ElementInternals roles, so it sees role=menu with
    // no menuitem children; the items carry their roles through internals.
    expect(await a11y(el.parentElement, ['aria-required-children'])).toEqual([]);
  });

  it('opens with real Enter, Space, ArrowDown and ArrowUp on the trigger', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('[slot=trigger]');
    for (const [key, expected] of [
      ['{Enter}', 'Cut'],
      [' ', 'Cut'],
      ['{ArrowDown}', 'Cut'],
      ['{ArrowUp}', 'More']
    ]) {
      trigger.focus();
      await userEvent.keyboard(key);
      await settle();
      expect(el.open, key).toBe(true);
      expect(text(active()), key).toBe(expected);
      await userEvent.keyboard('{Escape}');
      await settle();
      expect(el.open, key).toBe(false);
      expect(document.activeElement, key).toBe(trigger);
    }
  });

  it('moves with arrows, Home, End and typed characters, skipping disabled items', async () => {
    const el = await fixture(html);
    el.querySelector('[slot=trigger]').focus();
    await open(el);
    expect(text(active())).toBe('Cut');
    press('ArrowDown');
    expect(text(active())).toBe('Copy');
    press('ArrowDown');
    expect(text(active())).toBe('Grid');
    press('End');
    expect(text(active())).toBe('More');
    press('ArrowDown');
    expect(text(active())).toBe('Cut');
    press('ArrowUp');
    expect(text(active())).toBe('More');
    press('Home');
    expect(text(active())).toBe('Cut');
    press('d');
    expect(text(active())).toBe('Date');
    press('n');
    await new Promise((r) => setTimeout(r, 600));
    press('c');
    expect(text(active())).toBe('Cut');
    press('c');
    expect(text(active())).toBe('Copy');
  });

  it('fires punica-select with value and item, closes and returns focus', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('[slot=trigger]');
    trigger.focus();
    await open(el);
    press('ArrowDown');
    const selected = once(el, 'punica-select');
    const closed = once(el, 'punica-close');
    press('Enter');
    const event = await selected;
    expect(event.detail.value).toBe('copy');
    expect(event.detail.item).toBe(el.items[1]);
    expect((await closed).detail.reason).toBe('select');
    expect(el.open).toBe(false);
    expect(el.panel.matches(':popover-open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('stays open when punica-select is prevented', async () => {
    const el = await fixture(html);
    await open(el);
    el.addEventListener('punica-select', (event) => event.preventDefault());
    el.items[0].click();
    await settle();
    expect(el.open).toBe(true);
  });

  it('does not choose a disabled item', async () => {
    const el = await fixture(html);
    await open(el);
    let count = 0;
    el.addEventListener('punica-select', () => count++);
    el.querySelector('[disabled]').click();
    expect(count).toBe(0);
    expect(el.open).toBe(true);
  });

  it('toggles a checkbox item and moves a radio group', async () => {
    const el = await fixture(html);
    el.addEventListener('punica-select', (event) => event.preventDefault());
    await open(el);
    const box = el.querySelector('punica-menu-checkbox-item');
    const changed = once(box, 'punica-change');
    box.focus();
    press(' ');
    expect((await changed).detail).toEqual({ value: 'grid', checked: true });
    expect(box.checked).toBe(true);
    expect(box.internals.ariaChecked).toBe('true');

    const group = el.querySelector('punica-menu-radio-group');
    const [name, date] = group.querySelectorAll('punica-menu-radio-item');
    expect(name.checked).toBe(true);
    const moved = once(group, 'punica-change');
    date.click();
    expect((await moved).detail).toEqual({ value: 'date' });
    await settle();
    expect(group.value).toBe('date');
    expect(date.checked).toBe(true);
    expect(name.checked).toBe(false);
    expect(date.internals.ariaChecked).toBe('true');
  });

  it('closes on Escape with the reason, and on a pointer down outside', async () => {
    const el = await fixture(html);
    el.querySelector('[slot=trigger]').focus();
    await open(el);
    const closed = once(el, 'punica-close');
    const event = press('Escape');
    expect(event.defaultPrevented).toBe(true);
    expect((await closed).detail.reason).toBe('escape');
    await open(el);
    el.items[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(el.open).toBe(true);
    const outside = once(el, 'punica-close');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect((await outside).detail.reason).toBe('outside');
    expect(el.open).toBe(false);
  });

  it('closes on Tab and lets focus move on from the trigger', async () => {
    const wrap = await fixture(`<div>${html}<button id="after">After</button></div>`);
    const el = wrap.querySelector('punica-menu');
    el.querySelector('[slot=trigger]').focus();
    await open(el);
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Tab}');
    expect((await closed).detail.reason).toBe('tab');
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(wrap.querySelector('#after'));
  });

  it('opens a submenu with ArrowRight and Enter, closes it with ArrowLeft and Escape', async () => {
    const el = await fixture(html);
    const more = el.querySelector('#more');
    const sub = more.submenu;
    el.querySelector('[slot=trigger]').focus();
    await open(el);
    await settle();
    expect(more.internals.ariaHasPopup).toBe('menu');
    expect(more.internals.ariaExpanded).toBe('false');
    press('End');
    press('ArrowRight');
    await settle();
    expect(sub.open).toBe(true);
    expect(more.internals.ariaExpanded).toBe('true');
    expect(text(active())).toBe('Rename');
    const a = more.getBoundingClientRect();
    const p = sub.panel.getBoundingClientRect();
    expect(p.left).toBeGreaterThanOrEqual(a.right - 1);
    press('ArrowDown');
    expect(text(active())).toBe('Delete');
    press('ArrowLeft');
    await settle();
    expect(sub.open).toBe(false);
    expect(el.open).toBe(true);
    expect(active()).toBe(more);
    expect(more.internals.ariaExpanded).toBe('false');
    press('Enter');
    await settle();
    expect(sub.open).toBe(true);
    expect(text(active())).toBe('Rename');
    press('Escape');
    await settle();
    expect(sub.open).toBe(false);
    expect(el.open).toBe(true);
    expect(active()).toBe(more);
  });

  it('reports a submenu choice at the root and closes everything', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('[slot=trigger]');
    const sub = el.querySelector('#more').submenu;
    trigger.focus();
    await open(el);
    press('End');
    press('ArrowRight');
    await settle();
    const selected = once(el, 'punica-select');
    press('Enter');
    expect((await selected).detail.value).toBe('rename');
    await settle();
    expect(sub.open).toBe(false);
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('opens a submenu on hover and mirrors the keys in right-to-left text', async () => {
    const wrap = await fixture(`<div dir="rtl">${html}</div>`);
    const el = wrap.querySelector('punica-menu');
    const more = el.querySelector('#more');
    await open(el);
    more.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, composed: true }));
    await new Promise((r) => setTimeout(r, 220));
    await settle();
    expect(more.submenu.open).toBe(true);
    expect(active()).toBe(more);
    press('ArrowRight');
    await settle();
    expect(text(active())).toBe('More');
    press('ArrowLeft');
    await settle();
    expect(text(active())).toBe('Rename');
    press('ArrowRight');
    await settle();
    expect(more.submenu.open).toBe(false);
    expect(active()).toBe(more);
  });

  it('keeps two open menus apart and appends nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll(':scope > punica-menu');
    a.show();
    b.show();
    await settle();
    expect(document.body.children.length).toBe(before + 1);
    expect(document.querySelector('#menu')).toBe(null);
    expect(document.body.querySelectorAll(':scope > style').length).toBe(0);
    let fromA = 0;
    a.addEventListener('punica-select', () => fromA++);
    b.items[0].click();
    await settle();
    expect(fromA).toBe(0);
    expect(a.open).toBe(true);
    expect(b.open).toBe(false);
  });

  it('renders markup in a label as text', async () => {
    const el = await fixture('<punica-menu><button slot="trigger">Open</button><punica-menu-group></punica-menu-group></punica-menu>');
    const group = el.querySelector('punica-menu-group');
    group.label = '<img src=x onerror="window.__menuXss = 1">';
    el.label = '<img src=x onerror="window.__menuXss = 1">';
    await settle();
    expect(group.shadowRoot.querySelector('img')).toBe(null);
    expect(group.shadowRoot.querySelector('.label').textContent).toContain('<img');
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(window.__menuXss).toBeUndefined();
  });

  it('removes its document listener when it closes or is removed while open', async () => {
    const el = await fixture(html);
    await open(el);
    el.remove();
    await settle();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(el.open).toBe(true);
    document.body.appendChild(el);
    await settle();
    expect(el.panel.matches(':popover-open')).toBe(true);
    el.remove();
  });
});
