import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import { deepActiveElement } from '../../core/a11y.js';
import './contextMenu.js';
import '../menu/menuItem.js';
import '../menu/menuDivider.js';

const html = `<punica-context-menu label="File actions">
  <div id="area" style="padding:40px"><button id="file">report.pdf</button></div>
  <punica-menu-item slot="menu" value="open">Open</punica-menu-item>
  <punica-menu-item slot="menu" value="rename">Rename</punica-menu-item>
  <punica-menu-divider slot="menu"></punica-menu-divider>
  <punica-menu-item slot="menu" value="more">More
    <punica-menu slot="submenu"><punica-menu-item value="delete">Delete</punica-menu-item></punica-menu>
  </punica-menu-item>
</punica-context-menu>`;

const rightClick = (target, x = 120, y = 90) => {
  const event = new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: x, clientY: y, button: 2 });
  target.dispatchEvent(event);
  return event;
};
const press = (key, init = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true, ...init });
  deepActiveElement().dispatchEvent(event);
  return event;
};
const menuOf = (el) => el.shadowRoot.querySelector('punica-menu');

contract('punica-context-menu', {
  html,
  open: (el) => rightClick(el.querySelector('#area'))
});

describe('punica-context-menu', () => {
  afterEach(cleanup);

  it('opens a role=menu at the pointer and prevents the native menu', async () => {
    const el = await fixture(html);
    const opened = once(el, 'punica-open');
    const event = rightClick(el.querySelector('#area'), 120, 90);
    expect(event.defaultPrevented).toBe(true);
    await opened;
    await settle();
    expect(el.open).toBe(true);
    const panel = menuOf(el).panel;
    expect(panel.matches(':popover-open')).toBe(true);
    expect(panel.getAttribute('role')).toBe('menu');
    expect(panel.getAttribute('aria-label')).toBe('File actions');
    const rect = panel.getBoundingClientRect();
    expect(Math.round(rect.left)).toBe(120);
    expect(Math.round(rect.top)).toBe(90);
    await new Promise((r) => setTimeout(r, 200));
    // axe-core cannot read the items' ElementInternals roles.
    expect(await a11y(el.parentElement, ['aria-required-children'])).toEqual([]);
  });

  it('opens beside the focused element on Shift+F10 and the ContextMenu key, focus on the first item', async () => {
    const el = await fixture(html);
    const file = el.querySelector('#file');
    for (const [key, init] of [
      ['F10', { shiftKey: true }],
      ['ContextMenu', {}]
    ]) {
      file.focus();
      const event = press(key, init);
      expect(event.defaultPrevented).toBe(true);
      await settle();
      expect(el.open).toBe(true);
      expect(deepActiveElement().value).toBe('open');
      const a = file.getBoundingClientRect();
      const p = menuOf(el).panel.getBoundingClientRect();
      expect(Math.round(p.top)).toBe(Math.round(a.bottom));
      // The browser's own contextmenu event after the key does not move it.
      rightClick(file, 5, 5);
      await settle();
      expect(Math.round(menuOf(el).panel.getBoundingClientRect().top)).toBe(Math.round(a.bottom));
      press('Escape');
      await settle();
      expect(el.open).toBe(false);
      expect(document.activeElement).toBe(file);
      await new Promise((r) => setTimeout(r, 220));
    }
  });

  it('is operated by keyboard and reports the choice', async () => {
    const el = await fixture(html);
    el.querySelector('#file').focus();
    press('F10', { shiftKey: true });
    await settle();
    press('ArrowDown');
    expect(deepActiveElement().value).toBe('rename');
    press('End');
    press('ArrowRight');
    await settle();
    expect(deepActiveElement().value).toBe('delete');
    press('ArrowLeft');
    await settle();
    press('Home');
    const selected = once(el, 'punica-select');
    const closed = once(el, 'punica-close');
    press('Enter');
    const event = await selected;
    expect(event.target).toBe(el);
    expect(event.detail.value).toBe('open');
    expect(event.detail.item).toBe(el.querySelector('[value=open]'));
    expect((await closed).detail.reason).toBe('select');
    await settle();
    expect(el.open).toBe(false);
  });

  it('closes on a pointer down outside and stays closed while disabled', async () => {
    const el = await fixture(html);
    rightClick(el.querySelector('#area'));
    await settle();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle();
    expect(el.open).toBe(false);
    el.disabled = true;
    const event = rightClick(el.querySelector('#area'));
    await settle();
    expect(event.defaultPrevented).toBe(false);
    expect(el.open).toBe(false);
  });

  it('keeps two instances apart, renders in its own shadow tree and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-context-menu');
    a.showAt({ x: 10, y: 10 });
    b.showAt({ x: 200, y: 10 });
    await settle();
    expect(a.open && b.open).toBe(true);
    expect(document.body.children.length).toBe(before + 1);
    b.querySelector('[value=open]').click();
    await settle();
    expect(b.open).toBe(false);
    expect(a.open).toBe(true);
    expect(customElements.get('punica-context-menu-item')).toBeUndefined();
    expect(customElements.get('punica-context-menu-separator')).toBeUndefined();
  });

  it('leaves no window listener behind', async () => {
    const added = [];
    const add = window.addEventListener;
    window.addEventListener = function (type, ...rest) {
      added.push(type);
      return add.call(this, type, ...rest);
    };
    try {
      document.createElement('punica-context-menu');
      const el = await fixture(html);
      expect(added).toEqual([]);
      el.remove();
    } finally {
      window.addEventListener = add;
    }
  });
});
