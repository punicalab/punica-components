import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import { deepActiveElement } from '../../core/a11y.js';
import './splitButton.js';
import '../menu/menuItem.js';

const html = `<punica-split-button>
  Save
  <punica-menu-item slot="menu" value="draft">Save as draft</punica-menu-item>
  <punica-menu-item slot="menu" value="copy">Save a copy</punica-menu-item>
</punica-split-button>`;

const parts = (el) => ({
  primary: el.shadowRoot.querySelector('[part=primary]'),
  toggle: el.shadowRoot.querySelector('[part=toggle]')
});
const press = (key) =>
  deepActiveElement().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));

contract('punica-split-button', { html, open: (el) => el.menu.show() });

describe('punica-split-button', () => {
  afterEach(cleanup);

  it('fires punica-action from the primary button and nothing from the menu button', async () => {
    const el = await fixture(html);
    const events = [];
    el.addEventListener('punica-action', (event) => events.push(event.detail));
    parts(el).primary.click();
    expect(events).toEqual([{}]);
    parts(el).toggle.click();
    await settle();
    expect(events.length).toBe(1);
    expect(el.menu.open).toBe(true);
  });

  it('is operated by keyboard: Tab reaches both buttons, Enter opens the menu, Enter chooses', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button>${html}</div>`);
    const el = wrap.querySelector('punica-split-button');
    const { primary, toggle } = parts(el);
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    expect(el.shadowRoot.activeElement).toBe(primary);
    let actions = 0;
    el.addEventListener('punica-action', () => actions++);
    await userEvent.keyboard('{Enter}');
    expect(actions).toBe(1);
    await userEvent.keyboard('{Tab}');
    expect(el.shadowRoot.activeElement).toBe(toggle);
    expect(toggle.getAttribute('aria-haspopup')).toBe('menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('More options');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(deepActiveElement().value).toBe('draft');
    press('ArrowDown');
    const selected = once(el, 'punica-select');
    const closed = once(el, 'punica-close');
    press('Enter');
    const event = await selected;
    expect(event.detail.value).toBe('copy');
    expect(event.detail.item).toBe(el.querySelector('[value=copy]'));
    expect((await closed).detail.reason).toBe('select');
    await settle();
    expect(el.shadowRoot.activeElement).toBe(toggle);
    expect(actions).toBe(1);
  });

  it('has no axe violations with the menu open', async () => {
    const el = await fixture(html);
    el.menu.show();
    await settle();
    await new Promise((r) => setTimeout(r, 200));
    // axe-core cannot read the items' ElementInternals roles.
    expect(await a11y(el.parentElement, ['aria-required-children'])).toEqual([]);
  });

  it('disables both buttons', async () => {
    const el = await fixture(html.replace('<punica-split-button', '<punica-split-button disabled'));
    const { primary, toggle } = parts(el);
    expect(primary.disabled && toggle.disabled).toBe(true);
    let actions = 0;
    el.addEventListener('punica-action', () => actions++);
    primary.click();
    toggle.click();
    await settle();
    expect(actions).toBe(0);
    expect(el.menu.open).toBe(false);
  });

  it('fills its container with full-width and names the menu button from label-menu', async () => {
    const wrap = await fixture(`<div style="width:400px">${html.replace('<punica-split-button', '<punica-split-button full-width label-menu="Diğer"')}</div>`);
    const el = wrap.querySelector('punica-split-button');
    expect(Math.round(el.getBoundingClientRect().width)).toBe(400);
    expect(parts(el).toggle.getAttribute('aria-label')).toBe('Diğer');
    expect(el.fullWidth).toBe(true);
  });

  it('keeps two instances apart and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-split-button');
    a.menu.show();
    b.menu.show();
    await settle();
    expect(document.body.children.length).toBe(before + 1);
    let fromA = 0;
    a.addEventListener('punica-select', () => fromA++);
    b.querySelector('[value=draft]').click();
    await settle();
    expect(fromA).toBe(0);
    expect(a.menu.open).toBe(true);
    expect(b.menu.open).toBe(false);
  });
});
