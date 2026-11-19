import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { page } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './topNav.js';
import './topNavItem.js';
import './topNavMegaMenu.js';
import './topNavMegaMenuGroup.js';
import './topNavMegaMenuItem.js';
import './topNavMegaMenuCard.js';

const names = ['Home', 'Projects', 'Reports', 'Customers', 'Invoices', 'Settings'];
const nav = (width = 1000) => `<div style="width:${width}px">
<punica-top-nav label="Main">
  <strong slot="start">Acme</strong>
  ${names
    .map((name, i) => `<punica-top-nav-item id="${name.toLowerCase()}" href="#${name.toLowerCase()}"${i ? '' : ' current'}>${name}</punica-top-nav-item>`)
    .join('\n  ')}
  <button slot="end" type="button">Sign out</button>
</punica-top-nav></div>`;

const menuItem = `<punica-top-nav-item id="products">Products
  <punica-top-nav-item slot="menu" id="phones" href="#phones">Phones</punica-top-nav-item>
  <a slot="menu" id="tablets" href="#tablets">Tablets</a>
  <punica-top-nav-item slot="menu" id="soon" href="#soon" disabled>Soon</punica-top-nav-item>
  <punica-top-nav-item slot="menu" id="laptops" href="#laptops">Laptops</punica-top-nav-item>
</punica-top-nav-item>`;

const first = (wrap) => wrap.querySelector('punica-top-nav');
const openMore = async (wrap) => {
  first(wrap).shadowRoot.querySelector('.more').click();
  await settle();
};

contract('punica-top-nav', { html: nav().replace(/<div[^>]*>|<\/div>/g, '') });
contract('punica-top-nav', {
  html: nav(360).replace(/<div[^>]*>|<\/div>/g, ''),
  open: async (el) => {
    el.parentElement.style.width = '360px';
    await settle();
    await settle();
    el.shadowRoot.querySelector('.more').click();
  }
});
contract('punica-top-nav-item', { html: '<punica-top-nav-item href="#home" current>Home</punica-top-nav-item>' });
contract('punica-top-nav-item', {
  html: menuItem,
  open: (el) => {
    el.open = true;
  }
});

const control = (item) => item.shadowRoot.querySelector('.control:not([hidden])');
const key = (target, name) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true }));
const focused = () => {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};
const focusedId = () => {
  const el = focused();
  return el?.id || el?.getRootNode().host?.id;
};
const resized = async () => {
  await settle();
  await settle();
};

describe('punica-top-nav', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('is a named navigation landmark with start, items and end in order', async () => {
    const wrap = await fixture(nav());
    const el = first(wrap);
    await resized();
    const base = el.shadowRoot.querySelector('nav');
    expect(base.getAttribute('aria-label')).toBe('Main');
    const x = (node) => node.getBoundingClientRect().left;
    expect(x(el.querySelector('[slot=start]'))).toBeLessThan(x(el.querySelector('#home')));
    expect(x(el.querySelector('#home'))).toBeLessThan(x(el.querySelector('#projects')));
    expect(x(el.querySelector('#settings'))).toBeLessThan(x(el.querySelector('[slot=end]')));
    expect(el.overflowing).toEqual([]);
    expect(el.shadowRoot.querySelector('.more').hidden).toBe(true);
    el.label = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(base.getAttribute('aria-label')).toBe('<img src=x onerror=alert(1)>');
  });

  it('moves the items that do not fit into a named menu button, last first', async () => {
    const wrap = await fixture(nav(1000));
    const el = first(wrap);
    wrap.style.width = '420px';
    await resized();
    const more = el.shadowRoot.querySelector('.more');
    expect(more.hidden).toBe(false);
    expect(more.localName).toBe('button');
    expect(more.getAttribute('aria-label')).toBe('More');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    const over = el.overflowing.map((item) => item.id);
    expect(over.length).toBeGreaterThan(0);
    expect(over.length).toBeLessThan(names.length);
    expect(over).toEqual(names.slice(-over.length).map((n) => n.toLowerCase()));
    // What stays is inside the row; what left is not rendered until the menu opens.
    const row = el.shadowRoot.querySelector('.items').getBoundingClientRect();
    for (const item of el.querySelectorAll('punica-top-nav-item')) {
      const box = item.getBoundingClientRect();
      if (over.includes(item.id)) expect(item.checkVisibility()).toBe(false);
      else expect(box.right).toBeLessThanOrEqual(row.right + 1);
    }
    // No attribute is written on the author's items.
    expect(el.querySelector('#settings').hasAttribute('slot')).toBe(false);
    wrap.style.width = '1000px';
    await resized();
    expect(el.overflowing).toEqual([]);
    expect(more.hidden).toBe(true);
    expect(el.querySelector('#settings').checkVisibility()).toBe(true);
    el.labelMore = 'Diğer';
    await settle();
    expect(more.getAttribute('aria-label')).toBe('Diğer');
  });

  it('measures again when items are added, removed or renamed', async () => {
    const wrap = await fixture(nav(1000));
    const el = first(wrap);
    await resized();
    expect(el.overflowing).toEqual([]);
    const extra = [];
    for (let i = 0; i < 8; i++) {
      const item = document.createElement('punica-top-nav-item');
      item.href = `#extra-${i}`;
      item.textContent = `Another section ${i}`;
      extra.push(item);
    }
    el.append(...extra);
    await resized();
    expect(el.overflowing.length).toBeGreaterThan(0);
    expect(el.overflowing.at(-1)).toBe(extra.at(-1));
    extra.forEach((item) => item.remove());
    await resized();
    expect(el.overflowing).toEqual([]);
    el.querySelector('#home').textContent = 'A very long name for the first page of this application '.repeat(3);
    await resized();
    expect(el.overflowing.length).toBeGreaterThan(0);
  });

  it('opens the menu from the button and works it with the keyboard', async () => {
    const wrap = await fixture(nav(420));
    const el = first(wrap);
    await resized();
    const more = el.shadowRoot.querySelector('.more');
    const over = el.overflowing;
    expect(over.length).toBeGreaterThan(1);
    more.focus();
    const opened = once(el, 'punica-open');
    key(more, 'ArrowDown');
    await opened;
    await settle();
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(over[0].checkVisibility()).toBe(true);
    const panel = el.shadowRoot.querySelector('punica-popover').panel;
    expect(panel.matches(':popover-open')).toBe(true);
    expect(panel.getAttribute('aria-label')).toBe('More');
    expect(focusedId()).toBe(over[0].id);
    key(over[0], 'ArrowDown');
    expect(focusedId()).toBe(over[1].id);
    key(over[1], 'End');
    expect(focusedId()).toBe(over.at(-1).id);
    key(over.at(-1), 'ArrowDown');
    expect(focusedId()).toBe(over[0].id);
    key(over[0], 'ArrowUp');
    expect(focusedId()).toBe(over.at(-1).id);
    key(over.at(-1), 'Home');
    expect(focusedId()).toBe(over[0].id);
    const closed = once(el, 'punica-close');
    key(over[0], 'Escape');
    expect((await closed).detail).toEqual({ reason: 'escape' });
    await settle();
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(panel.matches(':popover-open')).toBe(false);
    expect(focused()).toBe(more);
  });

  it('closes the menu on a click outside and when everything fits again', async () => {
    const wrap = await fixture(nav(420));
    const el = first(wrap);
    await resized();
    const popover = el.shadowRoot.querySelector('punica-popover');
    await openMore(wrap);
    expect(popover.open).toBe(true);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle();
    expect(popover.open).toBe(false);
    await openMore(wrap);
    expect(popover.open).toBe(true);
    wrap.style.width = '1000px';
    await resized();
    await settle();
    expect(popover.open).toBe(false);
    expect(el.shadowRoot.querySelector('.more').getAttribute('aria-expanded')).toBe('false');
  });

  it('stops its observers on disconnect and starts them again on reconnect', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const mutationObserve = vi.spyOn(MutationObserver.prototype, 'observe');
    const mutationDisconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const wrap = await fixture(nav(1000));
    const el = first(wrap);
    await resized();
    const own = (spy) => spy.mock.calls.filter(([target]) => target === el).length;
    expect(own(observe)).toBe(1);
    expect(own(mutationObserve)).toBe(1);
    const before = [disconnect.mock.calls.length, mutationDisconnect.mock.calls.length];
    el.remove();
    expect(disconnect.mock.calls.length).toBe(before[0] + 1);
    expect(mutationDisconnect.mock.calls.length).toBe(before[1] + 1);
    // Out of the document a resize of where it was changes nothing.
    wrap.style.width = '300px';
    await resized();
    expect(el.overflowing).toEqual([]);
    wrap.append(el);
    await resized();
    expect(own(observe)).toBe(2);
    expect(own(mutationObserve)).toBe(2);
    expect(el.overflowing.length).toBeGreaterThan(0);
    wrap.style.width = '1000px';
    await resized();
    expect(el.overflowing).toEqual([]);
  });
});

describe('punica-top-nav-item', () => {
  afterEach(cleanup);

  it('is a native link with href, a native button without, and marks the current page', async () => {
    const wrap = await fixture(nav());
    const home = wrap.querySelector('#home');
    const a = control(home);
    expect(a.localName).toBe('a');
    expect(a.getAttribute('href')).toBe('#home');
    expect(a.getAttribute('aria-current')).toBe('page');
    expect(control(wrap.querySelector('#projects')).hasAttribute('aria-current')).toBe(false);
    home.focus();
    expect(focused()).toBe(a);
    home.href = null;
    await settle();
    const button = control(home);
    expect(button.localName).toBe('button');
    expect(button.getAttribute('aria-current')).toBe('page');
    expect(a.hidden).toBe(true);
    expect(button.querySelector('slot:not([name])').assignedNodes()[0].textContent).toBe('Home');
    let clicks = 0;
    home.addEventListener('click', () => clicks++);
    button.click();
    expect(clicks).toBe(1);
  });

  it('takes no focus and no activation while disabled', async () => {
    const el = await fixture('<punica-top-nav-item href="#x" disabled>Billing</punica-top-nav-item>');
    const a = control(el);
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.getAttribute('aria-disabled')).toBe('true');
    el.focus();
    expect(focused()).not.toBe(a);
    el.href = null;
    await settle();
    expect(control(el).disabled).toBe(true);
  });

  it('opens its menu slot as a popover under it, with aria-expanded', async () => {
    const el = await fixture(menuItem);
    const button = control(el);
    const popover = el.shadowRoot.querySelector('punica-popover');
    expect(button.localName).toBe('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(el.matches(':state(has-menu)')).toBe(true);
    expect(el.querySelector('#phones').checkVisibility()).toBe(false);
    const opened = once(el, 'punica-open');
    button.focus();
    button.click();
    await opened;
    await settle();
    expect(el.open).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(popover.panel.matches(':popover-open')).toBe(true);
    expect(popover.panel.getAttribute('role')).toBe('group');
    expect(popover.panel.getAttribute('aria-label')).toBe('Products');
    expect(popover.panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(button.getBoundingClientRect().bottom);
    expect(el.querySelector('#phones').checkVisibility()).toBe(true);
    // Focus goes to the first entry.
    expect(focusedId()).toBe('phones');
    button.click();
    await settle();
    expect(el.open).toBe(false);
    expect(popover.panel.matches(':popover-open')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('works its menu with the arrow keys, Home, End and Escape', async () => {
    const el = await fixture(menuItem);
    const button = control(el);
    button.focus();
    key(button, 'ArrowDown');
    await settle();
    expect(el.open).toBe(true);
    expect(focusedId()).toBe('phones');
    key(el.querySelector('#phones'), 'ArrowDown');
    expect(focusedId()).toBe('tablets');
    // The disabled entry is stepped over.
    key(el.querySelector('#tablets'), 'ArrowDown');
    expect(focusedId()).toBe('laptops');
    key(el.querySelector('#laptops'), 'ArrowDown');
    expect(focusedId()).toBe('phones');
    key(el.querySelector('#phones'), 'End');
    expect(focusedId()).toBe('laptops');
    key(el.querySelector('#laptops'), 'Home');
    expect(focusedId()).toBe('phones');
    key(el.querySelector('#phones'), 'ArrowUp');
    expect(focusedId()).toBe('laptops');
    const closed = once(el, 'punica-close');
    key(el.querySelector('#laptops'), 'Escape');
    expect((await closed).detail).toEqual({ reason: 'escape' });
    await settle();
    expect(el.open).toBe(false);
    expect(focused()).toBe(button);
    expect(el.shadowRoot.querySelector('punica-popover').panel.matches(':popover-open')).toBe(false);
  });

  it('closes on a click outside and follows open set from code', async () => {
    const el = await fixture(menuItem);
    const popover = el.shadowRoot.querySelector('punica-popover');
    el.open = true;
    await settle();
    expect(popover.panel.matches(':popover-open')).toBe(true);
    const closed = once(el, 'punica-close');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect((await closed).detail).toEqual({ reason: 'outside' });
    await settle();
    expect(el.open).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
    el.open = true;
    el.disabled = true;
    await settle();
    expect(popover.panel.matches(':popover-open')).toBe(false);
  });

  it('is a plain item again when the menu content goes, and never opens without one', async () => {
    const el = await fixture(menuItem);
    el.href = '#products';
    await settle();
    expect(control(el).localName).toBe('button');
    el.querySelectorAll('[slot=menu]').forEach((node) => node.remove());
    await settle();
    expect(control(el).localName).toBe('a');
    expect(el.matches(':state(has-menu)')).toBe(false);
    el.open = true;
    await settle();
    expect(el.shadowRoot.querySelector('punica-popover').open).toBe(false);
  });

  it('writes its label as text', async () => {
    const el = await fixture(menuItem);
    el.prepend('<img src=x onerror=alert(1)>');
    el.open = true;
    await settle();
    expect(el.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    const panel = el.shadowRoot.querySelector('punica-popover').panel;
    expect(panel.getAttribute('aria-label')).toBe('<img src=x onerror=alert(1)>Products');
    expect(panel.querySelector('img')).toBe(null);
  });

  it('opens its menu from inside the menu of items that do not fit, and Escape closes one level', async () => {
    const wrap = await fixture(nav(420).replace('</punica-top-nav>', `${menuItem}</punica-top-nav>`));
    const el = first(wrap);
    await resized();
    const products = el.querySelector('#products');
    expect(el.overflowing).toContain(products);
    const more = el.shadowRoot.querySelector('.more');
    const outer = el.shadowRoot.querySelector('punica-popover');
    more.focus();
    more.click();
    await settle();
    expect(products.checkVisibility()).toBe(true);
    control(products).focus();
    key(control(products), 'ArrowDown');
    await settle();
    expect(products.open).toBe(true);
    expect(outer.open).toBe(true);
    expect(focusedId()).toBe('phones');
    key(el.querySelector('#phones'), 'Escape');
    await settle();
    expect(products.open).toBe(false);
    expect(outer.open).toBe(true);
    expect(focused()).toBe(control(products));
    // Closing the outer menu takes an open inner one with it.
    products.open = true;
    await settle();
    outer.hide();
    await settle();
    expect(products.open).toBe(false);
  });

  it('lets a colour set on the navigation reach its items and brand', async () => {
    const el = await fixture(`<punica-top-nav label="Main" style="color: rgb(200, 0, 0)">
      <strong slot="start">Brand</strong>
      <punica-top-nav-item href="#a" current>Home</punica-top-nav-item>
      <punica-top-nav-item href="#b">Docs</punica-top-nav-item>
    </punica-top-nav>`);
    await settle();
    for (const item of el.querySelectorAll('punica-top-nav-item')) {
      expect(getComputedStyle(item.shadowRoot.querySelector('a')).color).toBe('rgb(200, 0, 0)');
    }
    expect(getComputedStyle(el.querySelector('strong')).color).toBe('rgb(200, 0, 0)');
  });

  it('raises no ResizeObserver loop error while it is resized across the overflow point', async () => {
    const errors = [];
    const onError = (e) => errors.push(e.message);
    window.addEventListener('error', onError);
    const wrap = await fixture(`<div style="width:600px"><punica-top-nav label="Main">
      ${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'].map((t) => `<punica-top-nav-item href="#${t}">${t} section</punica-top-nav-item>`).join('')}
    </punica-top-nav></div>`);
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (const width of [400, 250, 700, 300, 900]) {
      wrap.style.width = width + 'px';
      await frame();
    }
    await frame();
    window.removeEventListener('error', onError);
    expect(errors).toEqual([]);
    expect(wrap.querySelector('punica-top-nav').overflowing.length).toBe(0);
  });
});

const megaItem = `<punica-top-nav-item id="platform">Platform
  <punica-top-nav-mega-menu slot="menu">
    <punica-top-nav-mega-menu-group heading="Build">
      <punica-top-nav-mega-menu-item id="m-editor" href="#editor" description="Write and review code together."><span slot="start" aria-hidden="true">E</span>Editor</punica-top-nav-mega-menu-item>
      <punica-top-nav-mega-menu-item id="m-ci" href="#ci" description="Every commit, tested.">Pipelines</punica-top-nav-mega-menu-item>
    </punica-top-nav-mega-menu-group>
    <punica-top-nav-mega-menu-group heading="Run">
      <punica-top-nav-mega-menu-item id="m-hosting" href="#hosting">Hosting</punica-top-nav-mega-menu-item>
      <punica-top-nav-mega-menu-item id="m-soon" href="#soon" disabled>Edge (soon)</punica-top-nav-mega-menu-item>
      <punica-top-nav-mega-menu-item id="m-status">Status</punica-top-nav-mega-menu-item>
    </punica-top-nav-mega-menu-group>
    <punica-top-nav-mega-menu-card slot="featured" id="m-card" heading="What's new in 4.0" href="#whats-new" link-label="Read the notes">Faster builds and a new dashboard.</punica-top-nav-mega-menu-card>
  </punica-top-nav-mega-menu>
</punica-top-nav-item>`;
const megaNav = `<punica-top-nav label="Main"><strong slot="start">Forge</strong>${megaItem}<punica-top-nav-item href="#pricing">Pricing</punica-top-nav-item></punica-top-nav>`;

contract('punica-top-nav-mega-menu', {
  html: `<punica-top-nav-mega-menu><punica-top-nav-mega-menu-group heading="Build"><punica-top-nav-mega-menu-item href="#a">Editor</punica-top-nav-mega-menu-item></punica-top-nav-mega-menu-group></punica-top-nav-mega-menu>`
});
contract('punica-top-nav-mega-menu-group', {
  html: `<punica-top-nav-mega-menu-group heading="Build"><punica-top-nav-mega-menu-item href="#a">Editor</punica-top-nav-mega-menu-item></punica-top-nav-mega-menu-group>`
});
contract('punica-top-nav-mega-menu-item', {
  html: `<punica-top-nav-mega-menu-item href="#a" description="Write code."><span slot="start" aria-hidden="true">E</span>Editor</punica-top-nav-mega-menu-item>`
});
contract('punica-top-nav-mega-menu-card', {
  html: `<punica-top-nav-mega-menu-card heading="What's new" href="#new" link-label="Read more">Faster builds.</punica-top-nav-mega-menu-card>`
});
contract('punica-top-nav-item', {
  html: megaItem,
  open: (el) => {
    el.open = true;
  }
});

describe('punica-top-nav-mega-menu', () => {
  afterEach(cleanup);
  beforeAll(() => page.viewport(1280, 800));
  afterAll(() => page.viewport(414, 896));

  it('opens from its item as a wide panel of columns with the card beside them', async () => {
    const nav = await fixture(megaNav);
    const item = nav.querySelector('#platform');
    expect(item.matches(':state(mega)')).toBe(true);
    expect(item.matches(':state(has-menu)')).toBe(true);
    const button = control(item);
    expect(button.localName).toBe('button');
    button.focus();
    button.click();
    await settle();
    const panel = item.shadowRoot.querySelector('punica-popover').panel;
    expect(panel.matches(':popover-open')).toBe(true);
    expect(panel.getBoundingClientRect().width).toBeGreaterThan(600);
    expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    const [build, run] = nav.querySelectorAll('punica-top-nav-mega-menu-group');
    expect(build.getBoundingClientRect().right).toBeLessThanOrEqual(run.getBoundingClientRect().left + 1);
    expect(Math.round(build.getBoundingClientRect().top)).toBe(Math.round(run.getBoundingClientRect().top));
    const card = nav.querySelector('#m-card');
    expect(card.getBoundingClientRect().left).toBeGreaterThanOrEqual(run.getBoundingClientRect().right - 1);
    expect(focusedId()).toBe('m-editor');
    expect(await a11y(nav.parentElement)).toEqual([]);
  });

  it('puts the columns and the card in one column when the panel is narrow', async () => {
    const nav = await fixture(megaNav);
    const menu = nav.querySelector('punica-top-nav-mega-menu');
    menu.style.setProperty('--punica-top-nav-mega-menu-width', '300px');
    nav.querySelector('#platform').open = true;
    await settle();
    const [build, run] = nav.querySelectorAll('punica-top-nav-mega-menu-group');
    expect(run.getBoundingClientRect().top).toBeGreaterThanOrEqual(build.getBoundingClientRect().bottom - 1);
    expect(nav.querySelector('#m-card').getBoundingClientRect().top).toBeGreaterThanOrEqual(run.getBoundingClientRect().bottom - 1);
  });

  it('mirrors its columns right to left', async () => {
    const wrap = await fixture(`<div dir="rtl">${megaNav}</div>`);
    wrap.querySelector('#platform').open = true;
    await settle();
    const [build, run] = wrap.querySelectorAll('punica-top-nav-mega-menu-group');
    expect(build.getBoundingClientRect().left).toBeGreaterThanOrEqual(run.getBoundingClientRect().right - 1);
    expect(wrap.querySelector('#m-card').getBoundingClientRect().right).toBeLessThanOrEqual(run.getBoundingClientRect().left + 1);
  });

  it('moves through every link with the arrow keys, Home and End, and Escape closes it', async () => {
    const nav = await fixture(megaNav);
    const item = nav.querySelector('#platform');
    const button = control(item);
    button.focus();
    key(button, 'ArrowDown');
    await settle();
    expect(item.open).toBe(true);
    expect(focusedId()).toBe('m-editor');
    const order = [];
    for (let i = 0; i < 5; i++) {
      key(focused(), 'ArrowDown');
      order.push(focusedId());
    }
    // The disabled item is stepped over; the card's link is the last stop.
    expect(order).toEqual(['m-ci', 'm-hosting', 'm-status', 'm-card', 'm-editor']);
    key(focused(), 'End');
    expect(focusedId()).toBe('m-card');
    expect(focused().localName).toBe('a');
    key(focused(), 'Home');
    expect(focusedId()).toBe('m-editor');
    key(focused(), 'ArrowUp');
    expect(focusedId()).toBe('m-card');
    const closed = once(item, 'punica-close');
    key(focused(), 'Escape');
    expect((await closed).detail).toEqual({ reason: 'escape' });
    await settle();
    expect(item.open).toBe(false);
    expect(focused()).toBe(button);
  });
});

describe('punica-top-nav-mega-menu-group', () => {
  afterEach(cleanup);

  it('is a group named by its heading', async () => {
    const el = await fixture('<punica-top-nav-mega-menu-group heading="Build"><a href="#a">A</a></punica-top-nav-mega-menu-group>');
    expect(el.internals.role).toBe('group');
    expect(el.internals.ariaLabel).toBe('Build');
    const heading = el.shadowRoot.querySelector('[part=heading]');
    expect(heading.textContent).toBe('Build');
    expect(heading.getAttribute('aria-hidden')).toBe('true');
    el.heading = '<img src=x>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    el.heading = null;
    await settle();
    expect(heading.hidden).toBe(true);
  });
});

describe('punica-top-nav-mega-menu-item', () => {
  afterEach(cleanup);

  it('is a link whose name is its title, then its description', async () => {
    const el = await fixture('<punica-top-nav-mega-menu-item href="#editor" description="Write code." current><span slot="start" aria-hidden="true">E</span>Editor</punica-top-nav-mega-menu-item>');
    const a = control(el);
    expect(a.localName).toBe('a');
    expect(a.getAttribute('href')).toBe('#editor');
    expect(a.getAttribute('aria-current')).toBe('page');
    expect(el.shadowRoot.querySelector('[part=label]').parentElement.closest('a')).toBe(a);
    expect(el.shadowRoot.querySelector('[part=description]').textContent.trim()).toBe('Write code.');
    expect(el.shadowRoot.querySelector('[part=description]').closest('a')).toBe(a);
    expect(el.shadowRoot.querySelector('[part=icon]').hidden).toBe(false);
    el.focus();
    expect(focused()).toBe(a);
    el.description = null;
    await settle();
    expect(el.shadowRoot.querySelector('[part=description]').hidden).toBe(true);
  });

  it('takes its description from a slot, is a button without href, and takes no focus while disabled', async () => {
    const el = await fixture('<punica-top-nav-mega-menu-item>Status<span slot="description">All systems normal.</span></punica-top-nav-mega-menu-item>');
    const button = control(el);
    expect(button.localName).toBe('button');
    expect(el.shadowRoot.querySelector('[part=description]').hidden).toBe(false);
    expect(el.shadowRoot.querySelector('[part=icon]').hidden).toBe(true);
    el.disabled = true;
    await settle();
    expect(button.disabled).toBe(true);
    el.href = '#status';
    await settle();
    expect(control(el).hasAttribute('href')).toBe(false);
    expect(control(el).getAttribute('aria-disabled')).toBe('true');
    el.focus();
    expect(focused()).not.toBe(control(el));
  });

  it('writes the description as text', async () => {
    const el = await fixture('<punica-top-nav-mega-menu-item href="#a">A</punica-top-nav-mega-menu-item>');
    el.description = '<img src=x onerror="window.__megaXss = 1">';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(window.__megaXss).toBeUndefined();
  });
});

describe('punica-top-nav-mega-menu-card', () => {
  afterEach(cleanup);

  it('shows a decorative image, a title, its text and a link', async () => {
    const el = await fixture('<punica-top-nav-mega-menu-card heading="What\'s new" image="data:image/gif;base64,R0lGODlhAQABAAAAACw=" href="#new" link-label="Read the notes">Faster builds.</punica-top-nav-mega-menu-card>');
    const img = el.shadowRoot.querySelector('img');
    expect(img.hidden).toBe(false);
    expect(img.getAttribute('alt')).toBe('');
    expect(el.shadowRoot.querySelector('[part=heading]').textContent).toBe("What's new");
    const link = el.shadowRoot.querySelector('a');
    expect(link.getAttribute('href')).toBe('#new');
    expect(link.textContent.trim()).toBe('Read the notes');
    el.imageAlt = 'The new dashboard';
    el.linkLabel = null;
    await settle();
    expect(img.getAttribute('alt')).toBe('The new dashboard');
    expect(link.textContent.trim()).toBe("What's new");
    el.focus();
    expect(focused()).toBe(link);
    el.href = null;
    el.image = null;
    await settle();
    expect(link.hidden).toBe(true);
    expect(img.hidden).toBe(true);
  });
});
