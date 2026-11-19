import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './sideNav.js';
import './sideNavSection.js';
import './sideNavItem.js';

const icon = '<svg slot="start" width="16" height="16" aria-hidden="true"></svg>';
const nav = (attrs = '') => `<punica-side-nav label="Main" ${attrs}>
  <strong slot="header">Acme</strong>
  <punica-side-nav-item id="home" href="#home" current>${icon}Home</punica-side-nav-item>
  <punica-side-nav-item id="reports">${icon}Reports<span slot="end">3</span>
    <punica-side-nav-item slot="children" id="sales" href="#sales">Sales</punica-side-nav-item>
    <punica-side-nav-item slot="children" id="costs" href="#costs">Costs</punica-side-nav-item>
  </punica-side-nav-item>
  <punica-side-nav-section label="Admin" collapsible>
    <punica-side-nav-item id="users" href="#users">${icon}Users</punica-side-nav-item>
    <punica-side-nav-item id="billing" disabled href="#billing">${icon}Billing</punica-side-nav-item>
    <punica-side-nav-item id="docs" href="#docs">${icon}Docs
      <punica-side-nav-item slot="children" id="api" href="#api">API</punica-side-nav-item>
    </punica-side-nav-item>
  </punica-side-nav-section>
  <punica-side-nav-item slot="footer" id="settings">${icon}Settings</punica-side-nav-item>
</punica-side-nav>`;

contract('punica-side-nav', { html: nav() });
contract('punica-side-nav', {
  html: nav('collapsed'),
  open: (el) => el.querySelector('#home').shadowRoot.querySelector('a').dispatchEvent(new PointerEvent('pointerenter'))
});
contract('punica-side-nav-section', {
  html: '<punica-side-nav-section label="Admin" collapsible><punica-side-nav-item href="#users">Users</punica-side-nav-item></punica-side-nav-section>'
});
contract('punica-side-nav-item', { html: '<punica-side-nav-item href="#home" current>Home</punica-side-nav-item>' });
contract('punica-side-nav-item', {
  html: '<punica-side-nav-item open>Reports<punica-side-nav-item slot="children" href="#sales">Sales</punica-side-nav-item></punica-side-nav-item>'
});

const control = (item) => item.shadowRoot.querySelector('.control:not([hidden])');
const key = (target, name) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true }));
const focused = () => {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};

describe('punica-side-nav', () => {
  afterEach(cleanup);

  it('is a named navigation landmark with a named collapse button', async () => {
    const el = await fixture(nav());
    const base = el.shadowRoot.querySelector('nav');
    expect(base.getAttribute('aria-label')).toBe('Main');
    const button = el.shadowRoot.querySelector('[part=collapse-button]');
    expect(button.localName).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Collapse navigation');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    el.label = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(base.getAttribute('aria-label')).toBe('<img src=x onerror=alert(1)>');
  });

  it('collapses to a rail from its button and fires punica-toggle', async () => {
    const el = await fixture(nav('label-collapse="Daralt" label-expand="Genişlet"'));
    const button = el.shadowRoot.querySelector('[part=collapse-button]');
    expect(button.getAttribute('aria-label')).toBe('Daralt');
    const wide = el.getBoundingClientRect().width;
    let toggled = once(el, 'punica-toggle');
    button.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
    button.click();
    expect((await toggled).detail).toEqual({ open: false });
    await settle();
    expect(el.collapsed).toBe(true);
    expect(el.hasAttribute('collapsed')).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Genişlet');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    el.getAnimations().forEach((animation) => animation.finish());
    expect(el.getBoundingClientRect().width).toBeLessThan(wide / 2);
    expect(el.querySelector('#home').matches(':state(rail)')).toBe(true);
    expect(el.querySelector('punica-side-nav-section').matches(':state(rail)')).toBe(true);
    toggled = once(el, 'punica-toggle');
    button.click();
    expect((await toggled).detail).toEqual({ open: true });
    await settle();
    expect(el.querySelector('#home').matches(':state(rail)')).toBe(false);
  });

  it('fires nothing when collapsed is set from code', async () => {
    const el = await fixture(nav());
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    el.collapsed = true;
    await settle();
    expect(fired).toBe(0);
    expect(el.querySelector('#users').matches(':state(rail)')).toBe(true);
  });

  it('moves between the showing items with the arrow keys, Home and End', async () => {
    const el = await fixture(nav());
    const id = () => focused()?.getRootNode().host?.id;
    el.querySelector('#home').focus();
    expect(id()).toBe('home');
    key(el.querySelector('#home'), 'ArrowDown');
    expect(id()).toBe('reports');
    // Collapsed children and the disabled item are stepped over.
    key(el.querySelector('#reports'), 'ArrowDown');
    expect(id()).toBe('users');
    key(el.querySelector('#users'), 'ArrowDown');
    expect(id()).toBe('docs');
    // The footer's item is part of the same run, and the ends wrap.
    key(el.querySelector('#docs'), 'ArrowDown');
    expect(id()).toBe('settings');
    key(el.querySelector('#settings'), 'ArrowDown');
    expect(id()).toBe('home');
    key(el.querySelector('#home'), 'End');
    expect(id()).toBe('settings');
    key(el.querySelector('#settings'), 'Home');
    expect(id()).toBe('home');
    key(el.querySelector('#home'), 'ArrowUp');
    expect(id()).toBe('settings');
    el.querySelector('#reports').open = true;
    await settle();
    key(el.querySelector('#reports'), 'ArrowDown');
    expect(id()).toBe('sales');
  });
});

describe('punica-side-nav-item', () => {
  afterEach(cleanup);

  it('starts a nested label under its parent label, past a 1em icon', async () => {
    const el = await fixture(`<punica-side-nav label="Docs">
      <punica-side-nav-item open id="parent"><span slot="start" style="display:inline-block;width:1em;height:1em"></span>Guides
        <punica-side-nav-item slot="children" id="child" href="#a">Install</punica-side-nav-item>
      </punica-side-nav-item>
    </punica-side-nav>`);
    await settle();
    const label = (id) => el.querySelector('#' + id).shadowRoot.querySelector('[part=label]').getBoundingClientRect().left;
    expect(Math.abs(label('child') - label('parent'))).toBeLessThanOrEqual(1);
  });


  it('is a native link with href and marks the current page', async () => {
    const el = await fixture(nav());
    const a = control(el.querySelector('#home'));
    expect(a.localName).toBe('a');
    expect(a.getAttribute('href')).toBe('#home');
    expect(a.getAttribute('aria-current')).toBe('page');
    expect(a.textContent.replace(/\s+/g, '')).toBe('');
    expect(el.querySelector('#home').text).toBe('Home');
    expect(control(el.querySelector('#users')).hasAttribute('aria-current')).toBe(false);
    el.querySelector('#home').focus();
    expect(focused()).toBe(a);
  });

  it('is a native button without href, and swaps when href arrives', async () => {
    const el = await fixture(nav());
    const item = el.querySelector('#settings');
    expect(control(item).localName).toBe('button');
    expect(control(item).type).toBe('button');
    let clicks = 0;
    item.addEventListener('click', () => clicks++);
    control(item).click();
    expect(clicks).toBe(1);
    item.href = '#settings';
    item.target = '_blank';
    item.rel = 'noopener';
    await settle();
    expect(control(item).localName).toBe('a');
    expect(control(item).target).toBe('_blank');
    expect(control(item).rel).toBe('noopener');
    expect(control(item).querySelector('slot:not([name])').assignedNodes().length).toBeGreaterThan(0);
    expect(item.shadowRoot.querySelectorAll('.control:not([hidden])').length).toBe(1);
  });

  it('takes no focus and no activation while disabled', async () => {
    const el = await fixture(nav());
    const item = el.querySelector('#billing');
    const a = control(item);
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.getAttribute('aria-disabled')).toBe('true');
    expect(a.getAttribute('role')).toBe('link');
    item.focus();
    expect(focused()).not.toBe(a);
    const settings = el.querySelector('#settings');
    settings.disabled = true;
    await settle();
    expect(control(settings).disabled).toBe(true);
  });

  it('expands nested items from a button item, with aria-expanded and punica-toggle', async () => {
    const el = await fixture(nav());
    const item = el.querySelector('#reports');
    const button = control(item);
    const group = item.shadowRoot.querySelector('[part=children]');
    expect(button.localName).toBe('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(group.id);
    expect(group.getAttribute('role')).toBe('group');
    expect(group.hidden).toBe(true);
    expect(el.querySelector('#sales').checkVisibility()).toBe(false);
    const toggled = once(item, 'punica-toggle');
    button.click();
    expect((await toggled).detail).toEqual({ open: true });
    await settle();
    expect(item.open).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(group.hidden).toBe(false);
    expect(el.querySelector('#sales').checkVisibility()).toBe(true);
    button.click();
    await settle();
    expect(group.hidden).toBe(true);
    // A leaf button has no disclosure state.
    expect(control(el.querySelector('#settings')).hasAttribute('aria-expanded')).toBe(false);
  });

  it('gives a link item with nested items its own named expand button', async () => {
    const el = await fixture(nav());
    const item = el.querySelector('#docs');
    const toggle = item.shadowRoot.querySelector('[part=toggle]');
    expect(control(item).localName).toBe('a');
    expect(control(item).hasAttribute('aria-expanded')).toBe(false);
    expect(toggle.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const names = toggle
      .getAttribute('aria-labelledby')
      .split(' ')
      .map((id) => item.shadowRoot.getElementById(id));
    expect(names[0].textContent).toBe('Toggle');
    expect(names[1].querySelector('slot').assignedNodes()[0].textContent.trim()).toBe('Docs');
    const toggled = once(item, 'punica-toggle');
    toggle.click();
    expect((await toggled).detail).toEqual({ open: true });
    await settle();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('#api').checkVisibility()).toBe(true);
    // A leaf link shows no expand button.
    expect(el.querySelector('#home').shadowRoot.querySelector('[part=toggle]').hidden).toBe(true);
  });

  it('fires nothing when open is set from code', async () => {
    const el = await fixture(nav());
    const item = el.querySelector('#reports');
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    item.open = true;
    await settle();
    expect(fired).toBe(0);
    expect(item.shadowRoot.querySelector('[part=children]').hidden).toBe(false);
  });

  it('in a rail keeps its name and shows the label beside it on hover and focus', async () => {
    const el = await fixture(nav('collapsed'));
    const item = el.querySelector('#users');
    const a = control(item);
    const tip = item.shadowRoot.querySelector('[part=tooltip]');
    // The label is hidden from sight, not from the accessibility tree.
    const label = item.shadowRoot.querySelector('[part=label]');
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(getComputedStyle(label).display).not.toBe('none');
    expect(tip.getAttribute('aria-hidden')).toBe('true');
    expect(tip.matches(':popover-open')).toBe(false);
    a.dispatchEvent(new PointerEvent('pointerenter'));
    await settle();
    expect(tip.matches(':popover-open')).toBe(true);
    expect(tip.textContent).toBe('Users');
    const anchor = a.getBoundingClientRect();
    const box = tip.getBoundingClientRect();
    expect(box.left).toBeGreaterThanOrEqual(anchor.right);
    expect(box.top).toBeLessThan(anchor.bottom);
    expect(box.bottom).toBeGreaterThan(anchor.top);
    a.dispatchEvent(new PointerEvent('pointerleave'));
    expect(tip.matches(':popover-open')).toBe(false);
    a.dispatchEvent(new PointerEvent('pointerenter'));
    key(a, 'Escape');
    expect(tip.matches(':popover-open')).toBe(false);
    a.dispatchEvent(new PointerEvent('pointerenter'));
    a.dispatchEvent(new FocusEvent('blur'));
    expect(tip.matches(':popover-open')).toBe(false);
    // Nested items and expand buttons are out of a rail.
    expect(el.querySelector('#docs').shadowRoot.querySelector('[part=toggle]').hidden).toBe(true);
    expect(control(el.querySelector('#reports')).hasAttribute('aria-expanded')).toBe(false);
  });

  it('writes the tooltip as text and closes it on disconnect and on expand', async () => {
    const el = await fixture(nav('collapsed'));
    const item = el.querySelector('#users');
    const tip = item.shadowRoot.querySelector('[part=tooltip]');
    item.append('<img src=x onerror=alert(1)>');
    await settle();
    control(item).dispatchEvent(new PointerEvent('pointerenter'));
    expect(tip.matches(':popover-open')).toBe(true);
    expect(tip.querySelector('img')).toBe(null);
    expect(tip.textContent).toBe('Users<img src=x onerror=alert(1)>');
    const parent = item.parentElement;
    item.remove();
    expect(tip.matches(':popover-open')).toBe(false);
    parent.append(item);
    await settle();
    control(item).dispatchEvent(new PointerEvent('pointerenter'));
    expect(tip.matches(':popover-open')).toBe(true);
    el.collapsed = false;
    await settle();
    expect(tip.matches(':popover-open')).toBe(false);
    control(item).dispatchEvent(new PointerEvent('pointerenter'));
    expect(tip.matches(':popover-open')).toBe(false);
  });
});

describe('punica-side-nav-section', () => {
  afterEach(cleanup);

  it('is a group named by its heading', async () => {
    const el = await fixture(
      '<punica-side-nav-section label="Admin"><punica-side-nav-item href="#users">Users</punica-side-nav-item></punica-side-nav-section>'
    );
    const group = el.shadowRoot.querySelector('[role=group]');
    const heading = el.shadowRoot.getElementById(group.getAttribute('aria-labelledby'));
    expect(heading.textContent).toBe('Admin');
    expect(heading.localName).toBe('div');
    expect(el.shadowRoot.querySelector('[part=toggle]').hidden).toBe(true);
    el.label = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(heading.textContent).toBe('<img src=x onerror=alert(1)>');
    el.label = null;
    await settle();
    expect(group.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('hides and shows its items from a heading button when collapsible', async () => {
    const wrap = await fixture(nav());
    const el = wrap.querySelector('punica-side-nav-section');
    const button = el.shadowRoot.querySelector('[part=toggle]');
    const group = el.shadowRoot.querySelector('[role=group]');
    expect(button.hidden).toBe(false);
    expect(button.localName).toBe('button');
    expect(button.textContent.trim()).toBe('Admin');
    expect(group.getAttribute('aria-labelledby')).toBe(button.id);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(el.shadowRoot.querySelector('[part=items]').id);
    const toggled = once(el, 'punica-toggle');
    button.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
    button.click();
    expect((await toggled).detail).toEqual({ open: false });
    await settle();
    expect(el.collapsed).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(wrap.querySelector('#users').checkVisibility()).toBe(false);
    // A rail has no heading to press: the items show whatever the section says.
    wrap.collapsed = true;
    await settle();
    expect(wrap.querySelector('#users').checkVisibility()).toBe(true);
  });
});

describe('punica-side-nav no-collapse', () => {
  afterEach(cleanup);
  it('has no collapse button', async () => {
    const el = await fixture('<punica-side-nav label="Main" no-collapse><punica-side-nav-item href="#a">A</punica-side-nav-item></punica-side-nav>');
    expect(getComputedStyle(el.shadowRoot.querySelector('[part=collapse-button]')).display).toBe('none');
  });
});

