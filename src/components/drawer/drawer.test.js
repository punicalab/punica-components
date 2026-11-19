import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './drawer.js';

// The width a fixed panel spans: the visible viewport, without a scrollbar
// or the gutter the scroll lock keeps for one (Linux and Windows draw it in
// the page; macOS draws over it).
const viewportWidth = () => Math.round(window.visualViewport?.width ?? document.documentElement.clientWidth);

const html = `<punica-drawer>
  <span slot="header">Filters</span>
  <p>Choose what to show. <input id="field" aria-label="Search"></p>
  <button slot="footer" id="apply">Apply</button>
</punica-drawer>`;
const page = `<div><button id="opener">Open</button>${html}</div>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const native = (el) => el.shadowRoot.querySelector('dialog');
const backdropClick = (el, x, y) => {
  for (const type of ['pointerdown', 'click']) {
    native(el).dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, clientX: x, clientY: y }));
  }
};
const open = async (el) => {
  el.show();
  await settle();
};

contract('punica-drawer', { html, open });

describe('punica-drawer', () => {
  afterEach(cleanup);

  it('is a modal native dialog named by its header, on the inline-end edge by default', async () => {
    const el = await fixture(html);
    const opened = once(el, 'punica-open');
    el.open = true;
    await opened;
    const dialog = native(el);
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Filters');
    await wait(400);
    const rect = dialog.getBoundingClientRect();
    expect(Math.round(rect.right)).toBe(viewportWidth());
    expect(Math.round(rect.height)).toBe(window.innerHeight);
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('slides from each side and follows the writing direction', async () => {
    const wrap = await fixture(`<div style="--punica-duration-slow:0ms">${html}</div>`);
    const el = wrap.querySelector('punica-drawer');
    el.size = 'small';
    await open(el);
    const rect = () => native(el).getBoundingClientRect();
    el.side = 'inline-start';
    await settle();
    expect(Math.round(rect().left)).toBe(0);
    expect(Math.round(rect().width)).toBe(Math.min(480, viewportWidth()));
    wrap.dir = 'rtl';
    await settle();
    expect(Math.round(rect().right)).toBe(viewportWidth());
    wrap.dir = 'ltr';
    el.side = 'block-start';
    await settle();
    expect(Math.round(rect().top)).toBe(0);
    expect(Math.round(rect().width)).toBe(viewportWidth());
    expect(Math.round(rect().height)).toBe(Math.min(480, window.innerHeight));
    el.side = 'block-end';
    await settle();
    expect(Math.round(rect().bottom)).toBe(window.innerHeight);
  });

  it('takes focus, traps it, closes on a real Escape and returns focus to the opener', async () => {
    const wrap = await fixture(page);
    const el = wrap.querySelector('punica-drawer');
    const opener = wrap.querySelector('#opener');
    opener.focus();
    await open(el);
    const inside = () => el.contains(document.activeElement) && document.activeElement !== opener;
    expect(inside()).toBe(true);
    for (let i = 0; i < 5; i++) {
      await userEvent.keyboard('{Tab}');
      // The page behind is inert: Tab only ever leaves for the browser's own UI.
      expect(document.activeElement).not.toBe(opener);
      expect([el, document.body].includes(document.activeElement) || inside()).toBe(true);
    }
    const asked = once(el, 'punica-request-close');
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await asked).detail).toEqual({ reason: 'escape' });
    expect((await closed).detail).toEqual({ reason: 'escape', returnValue: '' });
    expect(el.open).toBe(false);
    expect(native(el).open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes from the close button and the backdrop, unless prevented or no-light-dismiss', async () => {
    const el = await fixture(html.replace('<punica-drawer', '<punica-drawer label-close="Kapat"'));
    await open(el);
    const button = el.shadowRoot.querySelector('.close');
    expect(button.getAttribute('aria-label')).toBe('Kapat');
    const keep = (event) => event.preventDefault();
    el.addEventListener('punica-request-close', keep);
    button.click();
    await settle();
    expect(el.open).toBe(true);
    el.removeEventListener('punica-request-close', keep);
    let closed = once(el, 'punica-close');
    button.click();
    expect((await closed).detail.reason).toBe('close-button');

    await open(el);
    await wait(400);
    const rect = native(el).getBoundingClientRect();
    backdropClick(el, rect.left + 10, 10);
    await settle();
    expect(el.open).toBe(true);
    if (rect.left > 2) {
      closed = once(el, 'punica-close');
      backdropClick(el, rect.left - 2, 10);
      expect((await closed).detail.reason).toBe('backdrop');
      el.noLightDismiss = true;
      await open(el);
      backdropClick(el, rect.left - 2, 10);
      await settle();
      expect(el.open).toBe(true);
    }
  });

  it('hides an empty footer and leaves the page alone', async () => {
    const el = await fixture('<punica-drawer label="Details"><p>Body</p></punica-drawer>');
    const overflow = document.body.style.overflow;
    await open(el);
    expect(el.shadowRoot.querySelector('[part=footer]').hidden).toBe(true);
    expect(native(el).getAttribute('aria-label')).toBe('Details');
    expect(document.body.style.overflow).toBe(overflow);
    el.hide('done');
    await settle();
    expect(el.returnValue).toBe('done');
  });

  it('keeps two instances apart, adds nothing to the body and no listener while closed', async () => {
    const before = document.body.children.length;
    const added = [];
    const add = document.addEventListener;
    document.addEventListener = function (type, ...rest) {
      added.push(type);
      return add.call(this, type, ...rest);
    };
    try {
      const wrap = await fixture(`<div>${html}${html}</div>`);
      const [a, b] = wrap.querySelectorAll('punica-drawer');
      expect(added).toEqual([]);
      await open(a);
      await open(b);
      expect(document.body.children.length).toBe(before + 1);
      await userEvent.keyboard('{Escape}');
      await settle();
      expect(b.open).toBe(false);
      expect(a.open).toBe(true);
    } finally {
      document.addEventListener = add;
    }
  });

  it('renders markup in label as text', async () => {
    const el = await fixture(html);
    el.label = '<img src=x onerror="window.__drawerXss = 1">';
    await open(el);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(native(el).getAttribute('aria-label')).toContain('<img');
    expect(window.__drawerXss).toBeUndefined();
  });
});
