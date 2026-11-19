import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import '../button/button.js';
import './toolbar.js';

const html = `<punica-toolbar label="Formatting">
  <button type="button" id="back" slot="start">Back</button>
  <button type="button" id="bold">Bold</button>
  <span><button type="button" id="italic">Italic</button></span>
  <button type="button" id="off" disabled>Strike</button>
  <punica-button id="link">Link</punica-button>
  <button type="button" id="help" slot="end">Help</button>
</punica-toolbar>`;

contract('punica-toolbar', { html });

const key = (target, k, init = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init }));
const tabbable = (el) => [...el.querySelectorAll('button, punica-button')].filter((b) => !b.disabled && b.tabIndex === 0).map((b) => b.id);
const active = () => document.activeElement?.id;

describe('punica-toolbar', () => {
  afterEach(cleanup);

  it('is role=toolbar with a name and an orientation (1.x set the invalid role="div")', async () => {
    const el = await fixture(html);
    expect(el.internals.role).toBe('toolbar');
    expect(el.internals.ariaLabel).toBe('Formatting');
    expect(el.internals.ariaOrientation).toBe('horizontal');
    expect(el.hasAttribute('role')).toBe(false);
    el.orientation = 'vertical';
    el.label = 'Tools';
    await settle();
    expect(el.internals.ariaOrientation).toBe('vertical');
    expect(el.internals.ariaLabel).toBe('Tools');
  });

  it('keeps one control in the tab order, across its three slots', async () => {
    const el = await fixture(html);
    expect(tabbable(el)).toEqual(['back']);
    expect(el.querySelector('#bold').tabIndex).toBe(-1);
    expect(el.querySelector('#link').tabIndex).toBe(-1);
  });

  it('moves focus with the arrow keys, Home and End, skipping what is disabled', async () => {
    const el = await fixture(html);
    el.querySelector('#back').focus();
    const order = [];
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight']) {
      key(document.activeElement, k);
      order.push(active());
    }
    expect(order).toEqual(['bold', 'italic', 'link', 'help', 'back']);
    key(document.activeElement, 'ArrowLeft');
    expect(active()).toBe('help');
    expect(tabbable(el)).toEqual(['help']);
    key(document.activeElement, 'Home');
    expect(active()).toBe('back');
    key(document.activeElement, 'End');
    expect(active()).toBe('help');
    key(document.activeElement, 'ArrowDown');
    expect(active()).toBe('help');
  });

  it('follows the writing direction and the orientation', async () => {
    const el = await fixture(html.replace('<punica-toolbar', '<punica-toolbar dir="rtl"'));
    el.querySelector('#bold').focus();
    key(document.activeElement, 'ArrowLeft');
    expect(active()).toBe('italic');
    key(document.activeElement, 'ArrowRight');
    expect(active()).toBe('bold');
    el.orientation = 'vertical';
    await settle();
    key(document.activeElement, 'ArrowRight');
    expect(active()).toBe('bold');
    key(document.activeElement, 'ArrowDown');
    expect(active()).toBe('italic');
    key(document.activeElement, 'ArrowUp');
    expect(active()).toBe('bold');
    expect(getComputedStyle(el).flexDirection).toBe('column');
  });

  it('remembers the control that was focused by pointer', async () => {
    const el = await fixture(html);
    el.querySelector('#italic').focus();
    expect(tabbable(el)).toEqual(['italic']);
  });

  it('leaves the arrow keys to a text field and modified keys to the page', async () => {
    const el = await fixture(
      '<punica-toolbar label="Search"><button type="button" id="a">A</button><input id="q" aria-label="Query"><button type="button" id="b">B</button></punica-toolbar>'
    );
    el.querySelector('#q').focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    el.querySelector('#q').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(active()).toBe('q');
    el.querySelector('#a').focus();
    key(document.activeElement, 'ArrowRight', { ctrlKey: true });
    expect(active()).toBe('a');
  });

  it('takes in controls added later and drops removed ones', async () => {
    const el = await fixture(html);
    el.querySelector('#back').remove();
    const added = document.createElement('button');
    added.id = 'added';
    added.textContent = 'Added';
    el.append(added);
    await settle();
    expect(tabbable(el)).toEqual(['bold']);
    el.querySelector('#bold').focus();
    key(document.activeElement, 'End');
    expect(active()).toBe('help');
    key(document.activeElement, 'ArrowLeft');
    expect(active()).toBe('added');
  });

  it('lays out start, content and end along the row', async () => {
    const wrap = await fixture(`<div style="width:800px">${html}</div>`);
    const el = wrap.firstElementChild;
    const host = el.getBoundingClientRect();
    expect(host.height).toBe(64);
    const back = el.querySelector('#back').getBoundingClientRect();
    const bold = el.querySelector('#bold').getBoundingClientRect();
    const help = el.querySelector('#help').getBoundingClientRect();
    expect(back.right).toBeLessThanOrEqual(bold.left);
    expect(Math.round(host.right - help.right)).toBe(Number.parseInt(getComputedStyle(el).paddingInlineEnd));
    el.size = 'small';
    await settle();
    expect(el.getBoundingClientRect().height).toBe(48);
  });
});
