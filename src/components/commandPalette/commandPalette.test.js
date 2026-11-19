import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import { deepActiveElement } from '../../core/a11y.js';
import './commandPalette.js';
import './commandGroup.js';
import './commandItem.js';

const html = `<punica-command-palette label="Commands" placeholder="Type a command">
  <punica-command-group label="File">
    <punica-command-item value="new">New file<kbd slot="shortcut">Ctrl N</kbd></punica-command-item>
    <punica-command-item value="open" keywords="load browse">Open file</punica-command-item>
    <punica-command-item value="print" disabled>Print</punica-command-item>
  </punica-command-group>
  <punica-command-group label="View">
    <punica-command-item value="zoom">Zoom in</punica-command-item>
  </punica-command-group>
  <punica-command-item value="quit">Quit</punica-command-item>
  <span slot="empty">No command found</span>
</punica-command-palette>`;
const page = `<div><button id="opener">Open</button>${html}</div>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const native = (el) => el.shadowRoot.querySelector('dialog');
const inputOf = (el) => el.shadowRoot.querySelector('input');
const shown = (el) => el.items.filter((item) => getComputedStyle(item).display !== 'none').map((item) => item.value);
const open = async (el) => {
  el.show();
  await settle();
};

for (const tag of ['punica-command-palette', 'punica-command-group', 'punica-command-item']) {
  contract(tag, { html, open });
}

describe('punica-command-palette', () => {
  afterEach(cleanup);

  it('opens a modal dialog with a combobox over a listbox, focus in the input', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-command-palette');
    wrap.querySelector('#opener').focus();
    const opened = once(el, 'punica-open');
    el.open = true;
    await opened;
    await settle();
    const input = inputOf(el);
    expect(native(el).matches(':modal')).toBe(true);
    expect(native(el).getAttribute('aria-label')).toBe('Commands');
    expect(deepActiveElement()).toBe(input);
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-controls')).toBe('list');
    expect(input.getAttribute('placeholder')).toBe('Type a command');
    expect(el.shadowRoot.querySelector('#list').getAttribute('role')).toBe('listbox');
    expect(el.items[0].internals.role).toBe('option');
    expect(el.querySelector('punica-command-group').internals.role).toBe('group');
    expect(el.querySelector('punica-command-group').internals.ariaLabel).toBe('File');
    // The first enabled item is active from the start.
    expect(el.activeItem.value).toBe('new');
    expect(el.items[0].internals.ariaSelected).toBe('true');
    if ('ariaActiveDescendantElement' in input) expect(input.ariaActiveDescendantElement).toBe(el.items[0]);
    await wait(200);
    // axe-core cannot read the items' ElementInternals roles, so it sees a
    // listbox with no options.
    expect(await a11y(wrap, ['aria-required-children'])).toEqual([]);
  });

  it('filters by text and keywords as you type and shows the empty slot', async () => {
    const el = await fixture(html);
    await open(el);
    const inputs = [];
    el.addEventListener('punica-input', (event) => inputs.push(event.detail.value));
    await userEvent.keyboard('file');
    await settle();
    expect(shown(el)).toEqual(['new', 'open']);
    expect(inputs.at(-1)).toBe('file');
    expect(getComputedStyle(el.querySelectorAll('punica-command-group')[1]).display).toBe('none');
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}browse');
    await settle();
    expect(shown(el)).toEqual(['open']);
    expect(el.activeItem.value).toBe('open');
    expect(el.shadowRoot.querySelector('.empty').hidden).toBe(true);
    await userEvent.keyboard('zzz');
    await settle();
    expect(shown(el)).toEqual([]);
    expect(el.shadowRoot.querySelector('.empty').hidden).toBe(false);
    expect(el.activeItem).toBe(null);
    el.query = '';
    await settle();
    expect(shown(el).length).toBe(5);
  });

  it('moves the active option with arrows, Home and End while focus stays in the input', async () => {
    const el = await fixture(html);
    await open(el);
    const input = inputOf(el);
    const active = () => el.activeItem.value;
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toBe('open');
    await userEvent.keyboard('{ArrowDown}');
    // The disabled item is skipped.
    expect(active()).toBe('zoom');
    await userEvent.keyboard('{End}');
    expect(active()).toBe('quit');
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toBe('new');
    await userEvent.keyboard('{ArrowUp}');
    expect(active()).toBe('quit');
    await userEvent.keyboard('{Home}');
    expect(active()).toBe('new');
    await settle();
    expect(deepActiveElement()).toBe(input);
    expect(el.items.filter((item) => item.internals.ariaSelected === 'true').length).toBe(1);
    if ('ariaActiveDescendantElement' in input) expect(input.ariaActiveDescendantElement).toBe(el.items[0]);
  });

  it('fires punica-select on Enter, closes and returns focus', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-command-palette');
    const opener = wrap.querySelector('#opener');
    opener.focus();
    await open(el);
    await userEvent.keyboard('{ArrowDown}');
    const selected = once(el, 'punica-select');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Enter}');
    const event = await selected;
    expect(event.detail.value).toBe('open');
    expect(event.detail.item).toBe(el.items[1]);
    expect((await closed).detail).toEqual({ reason: 'select', returnValue: 'open' });
    expect(el.open).toBe(false);
    expect(native(el).open).toBe(false);
    expect(document.activeElement).toBe(opener);
    // The query is cleared for the next time.
    await open(el);
    expect(inputOf(el).value).toBe('');
  });

  it('chooses on click, not a disabled item, and stays open when punica-select is prevented', async () => {
    const el = await fixture(html);
    await open(el);
    const values = [];
    el.addEventListener('punica-select', (event) => {
      values.push(event.detail.value);
      event.preventDefault();
    });
    el.querySelector('[value=print]').click();
    el.querySelector('[value=zoom]').click();
    await settle();
    expect(values).toEqual(['zoom']);
    expect(el.open).toBe(true);
  });

  it('closes on a real Escape after asking', async () => {
    const el = await fixture(html);
    await open(el);
    const asked = once(el, 'punica-request-close');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await asked).detail).toEqual({ reason: 'escape' });
    expect((await closed).detail.reason).toBe('escape');
    expect(el.open).toBe(false);
  });

  it('keeps two instances apart and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-command-palette');
    await open(a);
    await open(b);
    expect(document.body.children.length).toBe(before + 1);
    await userEvent.keyboard('zoom');
    await settle();
    expect(shown(b)).toEqual(['zoom']);
    expect(shown(a).length).toBe(5);
    let fromA = 0;
    a.addEventListener('punica-select', () => fromA++);
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(fromA).toBe(0);
    expect(b.open).toBe(false);
    expect(a.open).toBe(true);
  });

  it('renders markup in label, placeholder and a group label as text', async () => {
    const el = await fixture(html);
    const bad = '<img src=x onerror="window.__paletteXss = 1">';
    el.label = bad;
    el.placeholder = bad;
    el.querySelector('punica-command-group').label = bad;
    await open(el);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.querySelector('punica-command-group').shadowRoot.querySelector('img')).toBe(null);
    expect(inputOf(el).getAttribute('placeholder')).toBe(bad);
    await wait(20);
    expect(window.__paletteXss).toBeUndefined();
  });
});
