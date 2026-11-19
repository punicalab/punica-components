import { describe, it, expect, afterEach, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './appShell.js';

const long = '<p style="block-size: 1200px">A long report.</p>';
const shell = (attrs = '', main = '<h1>Orders</h1><p>Twelve open orders.</p>') => `<punica-app-shell${attrs}>
  <div slot="header" id="header" style="block-size: 48px">Northwind</div>
  <nav slot="nav" id="nav" aria-label="Sections" style="inline-size: 200px">
    <a href="#orders" id="orders">Orders</a>
    <a href="#customers" id="customers">Customers</a>
  </nav>
  ${main}
  <div slot="aside" id="aside">Filters</div>
  <div slot="footer" id="footer">© Northwind</div>
</punica-app-shell>`;
const framed = (width, attrs = '', main) => `<div style="inline-size: ${width}px; block-size: 480px; overflow: auto">${shell(attrs, main)}</div>`;
const get = (wrap) => wrap.querySelector('punica-app-shell');
const part = (el, name) => el.shadowRoot.querySelector(`[part~="${name}"]`);
const rect = (node) => node.getBoundingClientRect();
const frames = async (n = 3) => {
  for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r()));
};
const resize = async (wrap, width) => {
  wrap.style.inlineSize = `${width}px`;
  await frames();
  await settle();
};

contract('punica-app-shell', { html: shell(' fixed style="--punica-app-shell-height: 400px"') });
contract('punica-app-shell', {
  html: shell(' style="inline-size: 500px"'),
  open: async (el) => {
    await frames();
    part(el, 'menu-button').click();
  }
});

describe('punica-app-shell', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('puts the content in a native main landmark and the regions where they belong', async () => {
    const wrap = await fixture(framed(1100));
    const el = get(wrap);
    await frames();
    expect(el.collapsed).toBe(false);
    const main = part(el, 'main');
    expect(main.localName).toBe('main');
    expect(el.querySelector('h1').assignedSlot.parentElement).toBe(main);
    const header = rect(el.querySelector('#header'));
    const nav = rect(el.querySelector('#nav'));
    const content = rect(main);
    const aside = rect(el.querySelector('#aside'));
    const footer = rect(el.querySelector('#footer'));
    expect(header.top).toBeLessThan(nav.top);
    expect(nav.right).toBeLessThanOrEqual(content.left + 1);
    expect(content.right).toBeLessThanOrEqual(aside.left + 1);
    expect(footer.top).toBeGreaterThanOrEqual(content.bottom - 1);
    expect(Math.round(footer.left)).toBe(Math.round(content.left));
    expect(part(el, 'menu-button').checkVisibility()).toBe(false);
    expect(el.matches(':state(has-nav)')).toBe(true);
    expect(await a11y(wrap)).toEqual([]);
  });

  it('mirrors the columns right to left', async () => {
    const wrap = await fixture(framed(1100));
    wrap.dir = 'rtl';
    const el = get(wrap);
    await frames();
    const nav = rect(el.querySelector('#nav'));
    const content = rect(part(el, 'main'));
    const aside = rect(el.querySelector('#aside'));
    expect(nav.left).toBeGreaterThanOrEqual(content.right - 1);
    expect(aside.right).toBeLessThanOrEqual(content.left + 1);
  });

  it('collapses under 900 px of its own width: the nav goes, a menu button comes, the aside moves under main', async () => {
    const wrap = await fixture(framed(1100));
    const el = get(wrap);
    await frames();
    await resize(wrap, 700);
    expect(el.collapsed).toBe(true);
    expect(el.matches(':state(collapsed)')).toBe(true);
    expect(el.querySelector('#nav').checkVisibility()).toBe(false);
    const menu = part(el, 'menu-button');
    expect(menu.checkVisibility()).toBe(true);
    expect(menu.getAttribute('aria-label')).toBe('Menu');
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(rect(menu).left).toBeLessThan(rect(el.querySelector('#header')).left);
    const main = rect(part(el, 'main'));
    const aside = rect(part(el, 'aside'));
    expect(aside.top).toBeGreaterThanOrEqual(main.bottom - 1);
    expect(Math.round(aside.left)).toBe(Math.round(main.left));
    await resize(wrap, 1000);
    expect(el.collapsed).toBe(false);
    expect(el.querySelector('#nav').checkVisibility()).toBe(true);
    expect(menu.checkVisibility()).toBe(false);
  });

  it('collapses below the width collapse-below names, and never with none', async () => {
    const wrap = await fixture(framed(1000, ' collapse-below="large"'));
    const el = get(wrap);
    await frames();
    expect(el.collapsed).toBe(true);
    el.collapseBelow = 'small';
    await settle();
    expect(el.collapsed).toBe(false);
    await resize(wrap, 590);
    expect(el.collapsed).toBe(true);
    el.collapseBelow = 'none';
    await settle();
    expect(el.collapsed).toBe(false);
    expect(el.querySelector('#nav').checkVisibility()).toBe(true);
  });

  it('opens the navigation in a drawer from the menu button, and Escape gives focus back', async () => {
    const wrap = await fixture(framed(600));
    const el = get(wrap);
    await frames();
    const menu = part(el, 'menu-button');
    menu.focus();
    const opened = once(el, 'punica-open');
    await userEvent.keyboard('{Enter}');
    await opened;
    await settle();
    expect(el.navOpen).toBe(true);
    expect(el.hasAttribute('nav-open')).toBe(true);
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    const drawer = part(el, 'drawer');
    const dialog = drawer.shadowRoot.querySelector('dialog');
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Navigation');
    expect(el.querySelector('#orders').checkVisibility()).toBe(true);
    expect(await a11y(wrap)).toEqual([]);
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail.reason).toBe('escape');
    await settle();
    expect(el.navOpen).toBe(false);
    expect(el.shadowRoot.activeElement).toBe(menu);
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the drawer when a link is followed and when it grows past the breakpoint', async () => {
    const wrap = await fixture(framed(600));
    const el = get(wrap);
    await frames();
    el.navOpen = true;
    await settle();
    expect(part(el, 'drawer').open).toBe(true);
    let closed = once(el, 'punica-close');
    el.querySelector('#customers').click();
    expect((await closed).detail.reason).toBe('navigate');
    await settle();
    expect(el.navOpen).toBe(false);

    el.navOpen = true;
    await settle();
    closed = once(el, 'punica-close');
    await resize(wrap, 1000);
    expect((await closed).detail.reason).toBe('resize');
    await settle();
    expect(el.navOpen).toBe(false);
    expect(part(el, 'drawer').open).toBe(false);
    expect(el.querySelector('#nav').checkVisibility()).toBe(true);
  });

  it('ignores nav-open while wide', async () => {
    const wrap = await fixture(framed(1100));
    const el = get(wrap);
    await frames();
    el.navOpen = true;
    await settle();
    await settle();
    expect(el.navOpen).toBe(false);
    expect(part(el, 'drawer').open).toBe(false);
  });

  it('is a frame when fixed: as tall as its height, each region scrolling on its own', async () => {
    const wrap = await fixture(framed(1100, ' fixed style="--punica-app-shell-height: 100%"', long));
    const el = get(wrap);
    await frames();
    expect(Math.round(rect(el).height)).toBe(480);
    const main = part(el, 'main');
    expect(getComputedStyle(main).overflowY).toBe('auto');
    expect(main.scrollHeight).toBeGreaterThan(main.clientHeight);
    expect(wrap.scrollHeight).toBe(wrap.clientHeight);
    // It scrolls and nothing in it takes focus: it is a tab stop itself.
    expect(main.tabIndex).toBe(0);
    expect(part(el, 'aside').hasAttribute('tabindex')).toBe(false);
    expect(await a11y(wrap)).toEqual([]);
    main.scrollTop = 300;
    expect(rect(el.querySelector('#header')).top).toBe(rect(wrap).top);
    expect(Math.round(rect(el.querySelector('#footer')).bottom)).toBe(Math.round(rect(wrap).bottom));
  });

  it('lets the page scroll when not fixed, with a sticky header and navigation', async () => {
    const wrap = await fixture(framed(1100, '', long));
    const el = get(wrap);
    await frames();
    expect(rect(el).height).toBeGreaterThan(1200);
    expect(getComputedStyle(part(el, 'main')).overflowY).toBe('visible');
    expect(part(el, 'main').tabIndex).toBe(-1);
    wrap.scrollTop = 400;
    await frames(1);
    expect(Math.round(rect(el.querySelector('#header')).top)).toBe(Math.round(rect(wrap).top));
    const header = rect(el.querySelector('#header'));
    expect(Math.round(rect(el.querySelector('#nav')).top)).toBe(Math.round(header.bottom));
    // The navigation is as tall as the view under the header.
    expect(Math.round(rect(el.querySelector('#nav')).height)).toBe(Math.round(window.innerHeight - header.height));
  });

  it('scrolls as one below its header when fixed and collapsed', async () => {
    const wrap = await fixture(framed(600, ' fixed style="--punica-app-shell-height: 100%"', long));
    const el = get(wrap);
    await frames();
    const base = part(el, 'base');
    expect(getComputedStyle(base).overflowY).toBe('auto');
    base.scrollTop = 500;
    await frames(1);
    expect(Math.round(rect(part(el, 'header')).top)).toBe(Math.round(rect(wrap).top));
    expect(rect(el.querySelector('#aside')).top).toBeGreaterThan(rect(part(el, 'main')).top);
  });

  it('starts the tab order with a skip button that moves focus to main', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button>${framed(1100)}</div>`);
    const el = get(wrap);
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    const skip = part(el, 'skip-link');
    expect(el.shadowRoot.activeElement).toBe(skip);
    expect(skip.textContent).toBe('Skip to content');
    expect(skip.checkVisibility()).toBe(true);
    expect(rect(skip).width).toBeGreaterThan(20);
    await userEvent.keyboard('{Enter}');
    expect(el.shadowRoot.activeElement).toBe(part(el, 'main'));
    el.labelSkip = 'İçeriğe geç';
    await settle();
    expect(skip.textContent).toBe('İçeriğe geç');
  });

  it('is no second main landmark when embedded in a page that has one', async () => {
    const wrap = await fixture(`<main>${framed(1100, ' embedded')}</main>`);
    const el = get(wrap);
    await frames();
    expect(el.shadowRoot.querySelector('main')).toBe(null);
    const content = part(el, 'main');
    expect(content.localName).toBe('div');
    expect(el.querySelector('h1').assignedSlot.parentElement).toBe(content);
    expect(el.querySelector('h1').checkVisibility()).toBe(true);
    expect(await a11y(wrap)).toEqual([]);
    el.embedded = false;
    await settle();
    expect(part(el, 'main').localName).toBe('main');
    expect(el.querySelector('h1').assignedSlot.parentElement).toBe(part(el, 'main'));
  });

  it('hides regions with nothing in them', async () => {
    const el = await fixture('<punica-app-shell><p>Just content.</p></punica-app-shell>');
    await frames();
    for (const name of ['header', 'nav', 'aside', 'footer']) expect(part(el, name).hidden, name).toBe(true);
    expect(el.matches(':state(has-nav)')).toBe(false);
    expect(part(el, 'main').checkVisibility()).toBe(true);
  });

  it('stops observing on disconnect and starts again on reconnect', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const wrap = await fixture(framed(1100));
    const el = get(wrap);
    await frames();
    const own = () => observe.mock.calls.filter(([target]) => target === el).length;
    expect(own()).toBe(1);
    const before = disconnect.mock.calls.length;
    el.remove();
    expect(disconnect.mock.calls.length).toBe(before + 1);
    wrap.style.inlineSize = '600px';
    await frames();
    expect(el.collapsed).toBe(false);
    wrap.append(el);
    await frames();
    await settle();
    expect(own()).toBe(2);
    expect(el.collapsed).toBe(true);
    await resize(wrap, 1100);
    expect(el.collapsed).toBe(false);
  });

  it('raises no ResizeObserver loop error while resized across the breakpoint', async () => {
    const errors = [];
    const onError = (e) => errors.push(e.message);
    window.addEventListener('error', onError);
    const wrap = await fixture(framed(1100));
    for (const width of [700, 1000, 500, 950, 880, 1200]) await resize(wrap, width);
    window.removeEventListener('error', onError);
    expect(errors).toEqual([]);
    expect(get(wrap).collapsed).toBe(false);
  });
});
