import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './tabs.js';
import './tab.js';
import './tabPanel.js';

const html = (attrs = '') => `<punica-tabs label="Account" ${attrs}>
  <punica-tab value="profile">Profile</punica-tab>
  <punica-tab value="billing">Billing</punica-tab>
  <punica-tab value="team" disabled>Team</punica-tab>
  <punica-tab value="keys">Keys</punica-tab>
  <punica-tab-panel value="profile">Profile content</punica-tab-panel>
  <punica-tab-panel value="billing">Billing content</punica-tab-panel>
  <punica-tab-panel value="team">Team content</punica-tab-panel>
  <punica-tab-panel value="keys">Keys content</punica-tab-panel>
</punica-tabs>`;

const key = (el, k, init = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init }));
const tabsOf = (el) => [...el.querySelectorAll('punica-tab')];
const panelsOf = (el) => [...el.querySelectorAll('punica-tab-panel')];

contract('punica-tabs', { html: html() });
contract('punica-tab', { html: html() });
contract('punica-tab-panel', { html: html() });

describe('punica-tabs', () => {
  afterEach(cleanup);

  it('creates every tag with createElement', () => {
    for (const tag of ['punica-tabs', 'punica-tab', 'punica-tab-panel']) {
      const el = document.createElement(tag);
      expect(el.attributes.length).toBe(0);
    }
  });

  it('exposes tablist, tab and tabpanel roles and wires ids both ways', async () => {
    const el = await fixture(html());
    const [first] = tabsOf(el);
    const [panel] = panelsOf(el);
    expect(el.shadowRoot.querySelector('[part=tablist]').getAttribute('role')).toBe('tablist');
    expect(el.shadowRoot.querySelector('[part=tablist]').getAttribute('aria-label')).toBe('Account');
    expect(first.internals.role).toBe('tab');
    expect(panel.internals.role).toBe('tabpanel');
    expect(first.id).not.toBe('');
    expect(first.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(first.id);
    expect(document.getElementById(panel.id)).toBe(panel);
  });

  it('keeps ids the author gave', async () => {
    const el = await fixture(
      '<punica-tabs><punica-tab id="t1" value="a">A</punica-tab><punica-tab-panel id="p1" value="a">A</punica-tab-panel></punica-tabs>'
    );
    expect(el.querySelector('punica-tab').getAttribute('aria-controls')).toBe('p1');
    expect(el.querySelector('punica-tab-panel').getAttribute('aria-labelledby')).toBe('t1');
  });

  it('selects the first enabled tab by default and shows only its panel', async () => {
    const el = await fixture(html());
    await settle();
    const tabs = tabsOf(el);
    const panels = panelsOf(el);
    expect(el.value).toBe('profile');
    expect(tabs.map((t) => t.internals.ariaSelected)).toEqual(['true', 'false', 'false', 'false']);
    expect(panels.map((p) => getComputedStyle(p).display !== 'none')).toEqual([true, false, false, false]);
  });

  it('follows the value attribute and property', async () => {
    const el = await fixture(html('value="billing"'));
    expect(tabsOf(el)[1].selected).toBe(true);
    expect(panelsOf(el)[1].active).toBe(true);
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    el.value = 'keys';
    await settle();
    expect(tabsOf(el)[3].selected).toBe(true);
    expect(panelsOf(el)[3].active).toBe(true);
    expect(fired).toBe(0);
  });

  it('keeps one tab in the tab order: the selected one', async () => {
    const el = await fixture(html('value="billing"'));
    expect(tabsOf(el).map((t) => t.tabIndex)).toEqual([-1, 0, -1, -1]);
  });

  it('selects on click and fires punica-change with the value', async () => {
    const el = await fixture(html());
    const event = once(el, 'punica-change');
    tabsOf(el)[1].click();
    expect((await event).detail).toEqual({ value: 'billing' });
    await settle();
    expect(el.value).toBe('billing');
    expect(panelsOf(el)[1].active).toBe(true);
  });

  it('ignores a click on a disabled tab', async () => {
    const el = await fixture(html());
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    tabsOf(el)[2].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle();
    expect(el.value).toBe('profile');
    expect(fired).toBe(0);
  });

  it('moves with the arrow keys, skipping disabled tabs, wrapping, with Home and End', async () => {
    const el = await fixture(html());
    const tabs = tabsOf(el);
    const values = [];
    el.addEventListener('punica-change', (e) => values.push(e.detail.value));
    tabs[0].focus();
    key(tabs[0], 'ArrowRight');
    expect(document.activeElement).toBe(tabs[1]);
    key(tabs[1], 'ArrowRight');
    expect(document.activeElement).toBe(tabs[3]);
    key(tabs[3], 'ArrowRight');
    expect(document.activeElement).toBe(tabs[0]);
    key(tabs[0], 'ArrowLeft');
    expect(document.activeElement).toBe(tabs[3]);
    key(tabs[3], 'Home');
    expect(document.activeElement).toBe(tabs[0]);
    key(tabs[0], 'End');
    expect(document.activeElement).toBe(tabs[3]);
    expect(values).toEqual(['billing', 'keys', 'profile', 'keys', 'profile', 'keys']);
    await settle();
    expect(tabs.map((t) => t.tabIndex)).toEqual([-1, -1, -1, 0]);
    // Up and Down belong to the page in a horizontal tab list.
    key(tabs[3], 'ArrowDown');
    expect(document.activeElement).toBe(tabs[3]);
  });

  it('mirrors the arrow keys in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${html()}</div>`);
    const tabs = tabsOf(wrap);
    tabs[0].focus();
    key(tabs[0], 'ArrowLeft');
    expect(document.activeElement).toBe(tabs[1]);
    key(tabs[1], 'ArrowRight');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('uses Up and Down when vertical', async () => {
    const el = await fixture(html('orientation="vertical"'));
    const tabs = tabsOf(el);
    expect(el.shadowRoot.querySelector('[part=tablist]').getAttribute('aria-orientation')).toBe('vertical');
    tabs[0].focus();
    key(tabs[0], 'ArrowDown');
    expect(document.activeElement).toBe(tabs[1]);
    key(tabs[1], 'ArrowUp');
    expect(document.activeElement).toBe(tabs[0]);
    key(tabs[0], 'ArrowRight');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('waits for Enter or Space with manual activation', async () => {
    const el = await fixture(html('activation="manual"'));
    const tabs = tabsOf(el);
    const values = [];
    el.addEventListener('punica-change', (e) => values.push(e.detail.value));
    tabs[0].focus();
    key(tabs[0], 'ArrowRight');
    expect(document.activeElement).toBe(tabs[1]);
    expect(el.value).toBe('profile');
    key(tabs[1], 'Enter');
    expect(el.value).toBe('billing');
    key(tabs[1], 'End');
    key(tabs[3], ' ');
    expect(el.value).toBe('keys');
    expect(values).toEqual(['billing', 'keys']);
  });

  it('pairs by position when no value is given', async () => {
    const el = await fixture(
      '<punica-tabs label="Views"><punica-tab>One</punica-tab><punica-tab>Two</punica-tab><punica-tab-panel>1</punica-tab-panel><punica-tab-panel>2</punica-tab-panel></punica-tabs>'
    );
    tabsOf(el)[1].click();
    await settle();
    expect(el.value).toBe('1');
    expect(panelsOf(el)[1].active).toBe(true);
  });

  it('works when the children exist before the container is connected', async () => {
    // 1.x called a method on parentElement and threw when it was not upgraded.
    const el = document.createElement('punica-tabs');
    const a = document.createElement('punica-tab');
    const b = document.createElement('punica-tab');
    const pa = document.createElement('punica-tab-panel');
    const pb = document.createElement('punica-tab-panel');
    a.value = pa.value = 'a';
    b.value = pb.value = 'b';
    a.textContent = 'A';
    b.textContent = 'B';
    const frag = document.createDocumentFragment();
    frag.append(a, b, pa, pb);
    el.append(frag);
    const host = await fixture('<div></div>');
    host.append(el);
    await settle();
    expect(a.selected).toBe(true);
    expect(pa.active).toBe(true);
    expect(a.assignedSlot.name).toBe('tab');
    b.click();
    await settle();
    expect(pb.active).toBe(true);
  });

  it('picks up tabs added later', async () => {
    const el = await fixture(html());
    const tab = document.createElement('punica-tab');
    tab.value = 'new';
    tab.textContent = 'New';
    const panel = document.createElement('punica-tab-panel');
    panel.value = 'new';
    el.append(tab, panel);
    await settle();
    await settle();
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    tab.click();
    await settle();
    expect(panel.active).toBe(true);
  });

  it('slides the indicator under the selected tab', async () => {
    const el = await fixture(html());
    const indicator = el.shadowRoot.querySelector('[part=indicator]');
    await settle();
    const before = indicator.getBoundingClientRect();
    const first = tabsOf(el)[0].getBoundingClientRect();
    expect(Math.abs(before.left - first.left)).toBeLessThan(1);
    expect(Math.abs(before.width - first.width)).toBeLessThan(1);
    el.value = 'billing';
    await settle();
    expect(indicator.style.getPropertyValue('--_offset')).toBe(`${first.width}px`);
    expect(indicator.classList.contains('animated')).toBe(true);
  });

  it('shows a tab and its panel when the whole set is disabled, dimmed and untouchable', async () => {
    const el = await fixture(html('disabled'));
    const [profile, billing] = tabsOf(el);
    expect(el.value).toBe('profile');
    expect(profile.selected).toBe(true);
    expect(panelsOf(el)[0].active).toBe(true);
    expect(getComputedStyle(billing).pointerEvents).toBe('none');
    expect(Number(getComputedStyle(billing).opacity)).toBeLessThan(1);
    billing.click();
    await settle();
    expect(el.value).toBe('profile');
    expect(billing.internals.ariaDisabled).toBe('true');
    el.disabled = false;
    await settle();
    expect(billing.internals.ariaDisabled).toBe(null);
  });

  it('scrolls only its tab list to bring the selected tab into view', async () => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep'];
    const el = await fixture(`<punica-tabs label="Months" value="aug" style="width:300px">
      ${months.map((m) => `<punica-tab value="${m}">Month ${m}</punica-tab>`).join('')}
      ${months.map((m) => `<punica-tab-panel value="${m}">${m}</punica-tab-panel>`).join('')}
    </punica-tabs>`);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const list = el.shadowRoot.querySelector('[part=tablist]').getBoundingClientRect();
    const tab = el.querySelector('[value=aug]').getBoundingClientRect();
    expect(tab.left).toBeGreaterThanOrEqual(list.left - 1);
    expect(tab.right).toBeLessThanOrEqual(list.right + 1);
    expect(document.scrollingElement.scrollLeft).toBe(0);
  });

  it('puts the indicator under the selected tab right-to-left, in a scrolled list too', async () => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep'];
    const wrap = await fixture(`<div dir="rtl"><punica-tabs label="Months" value="aug" style="width:300px">
      ${months.map((m) => `<punica-tab value="${m}">Month ${m}</punica-tab>`).join('')}
      ${months.map((m) => `<punica-tab-panel value="${m}">${m}</punica-tab-panel>`).join('')}
    </punica-tabs><punica-tabs label="Short" value="b">
      <punica-tab value="a">Alpha</punica-tab><punica-tab value="b">Beta</punica-tab><punica-tab value="c">Gamma</punica-tab>
    </punica-tabs></div>`);
    await new Promise((r) => setTimeout(r, 400));
    for (const el of wrap.querySelectorAll('punica-tabs')) {
      const tab = el.selectedTab.getBoundingClientRect();
      const bar = el.shadowRoot.querySelector('[part=indicator]').getBoundingClientRect();
      expect(Math.abs(bar.left - tab.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(bar.width - tab.width)).toBeLessThanOrEqual(1);
    }
  });
});

describe('punica-tabs direction change', () => {
  afterEach(cleanup);
  it('moves the indicator under the selected tab when the direction flips after render', async () => {
    const wrap = await fixture(`<div dir="ltr" style="inline-size: 400px">
      <punica-tabs label="Orders" value="shipped">
        <punica-tab value="open">Open</punica-tab>
        <punica-tab value="shipped">Shipped</punica-tab>
        <punica-tab value="returned">Returned</punica-tab>
        <punica-tab-panel value="open">A</punica-tab-panel>
        <punica-tab-panel value="shipped">B</punica-tab-panel>
        <punica-tab-panel value="returned">C</punica-tab-panel>
      </punica-tabs></div>`);
    const tabs = wrap.querySelector('punica-tabs');
    const indicator = () => tabs.shadowRoot.querySelector('[part=indicator]').getBoundingClientRect();
    const shipped = () => tabs.querySelector('[value=shipped]').getBoundingClientRect();
    await settle();
    await new Promise((r) => setTimeout(r, 400));
    expect(Math.abs(indicator().left - shipped().left)).toBeLessThan(2);
    wrap.dir = 'rtl';
    await settle();
    await new Promise((r) => setTimeout(r, 400));
    expect(Math.abs(indicator().left - shipped().left)).toBeLessThan(2);
  });
});
