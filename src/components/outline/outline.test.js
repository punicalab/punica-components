import { describe, it, expect, afterEach, vi } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './outline.js';

const para = '<p style="block-size: 400px">Text.</p>';
const article = `<article id="doc">
  <h2 id="install">Install</h2>${para}
  <h3>From npm</h3>${para}
  <h3>From a CDN</h3>${para}
  <h2>Use</h2>${para}
  <h3>Options</h3>${para}
  <h4>Deep detail</h4>${para}
  <h2 hidden>Hidden</h2>
  <h2>Theme</h2>${para}
</article>`;
const page = (attrs = '') => `<div><punica-outline for="doc"${attrs}></punica-outline>${article}</div>`;
const outline = (wrap) => wrap.querySelector('punica-outline');
const links = (el) => [...el.shadowRoot.querySelectorAll('a')];
const texts = (el) => links(el).map((a) => a.textContent);
const frames = async (n = 3) => {
  for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r()));
};

contract('punica-outline', { html: page() });

describe('punica-outline', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('is a named navigation of links to the target headings, nested by level', async () => {
    const wrap = await fixture(page());
    const el = outline(wrap);
    const nav = el.shadowRoot.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('On this page');
    expect(texts(el)).toEqual(['Install', 'From npm', 'From a CDN', 'Use', 'Options', 'Theme']);
    const top = el.shadowRoot.querySelector('nav > ul');
    expect([...top.children].map((li) => li.querySelector('a').textContent)).toEqual(['Install', 'Use', 'Theme']);
    const nested = top.children[0].querySelector('ul');
    expect([...nested.children].map((li) => li.textContent)).toEqual(['From npm', 'From a CDN']);
    expect(links(el)[0].getAttribute('href')).toBe('#install');
    el.label = 'Contents';
    await settle();
    expect(nav.getAttribute('aria-label')).toBe('Contents');
  });

  it('gives a heading with no id one from its text, unique in its tree', async () => {
    const wrap = await fixture(`<div><punica-outline for="d"></punica-outline>
      <div id="d"><h2>Getting started</h2><h2>Getting started</h2><h2>Ça marche</h2><h2 id="kept">Kept</h2></div></div>`);
    const ids = [...wrap.querySelectorAll('#d h2')].map((h) => h.id);
    expect(ids).toEqual(['getting-started', 'getting-started-2', 'ca-marche', 'kept']);
    expect(links(outline(wrap)).map((a) => a.getAttribute('href'))).toEqual(ids.map((id) => `#${id}`));
  });

  it('lists the levels it is asked for', async () => {
    const wrap = await fixture(page(' levels="h2, h4"'));
    const el = outline(wrap);
    expect(texts(el)).toEqual(['Install', 'Use', 'Deep detail', 'Theme']);
    el.levels = 'h3 nonsense';
    await settle();
    expect(texts(el)).toEqual(['From npm', 'From a CDN', 'Options']);
    el.levels = 'script';
    await settle();
    expect(texts(el)).toEqual(['Install', 'From npm', 'From a CDN', 'Use', 'Options', 'Theme']);
  });

  it('takes a target property over for, and is empty with no target', async () => {
    const wrap = await fixture(`<div><punica-outline></punica-outline><section><h2>Alpha</h2><h3>Beta</h3></section></div>`);
    const el = outline(wrap);
    expect(links(el)).toEqual([]);
    expect(el.matches(':state(empty)')).toBe(true);
    el.target = wrap.querySelector('section');
    await settle();
    expect(texts(el)).toEqual(['Alpha', 'Beta']);
    expect(el.matches(':state(empty)')).toBe(false);
    expect(el.headings.map((h) => h.textContent)).toEqual(['Alpha', 'Beta']);
  });

  it('follows the target as headings are added, renamed and removed', async () => {
    const wrap = await fixture(page());
    const el = outline(wrap);
    const doc = wrap.querySelector('#doc');
    const h = document.createElement('h2');
    h.textContent = 'Changelog';
    doc.append(h);
    await frames();
    expect(texts(el).at(-1)).toBe('Changelog');
    expect(h.id).toBe('changelog');
    h.textContent = 'Release notes';
    await frames();
    expect(texts(el).at(-1)).toBe('Release notes');
    h.remove();
    await frames();
    expect(texts(el)).toEqual(['Install', 'From npm', 'From a CDN', 'Use', 'Options', 'Theme']);
  });

  it('marks the section in view with aria-current="location"', async () => {
    const wrap = await fixture(`<div><punica-outline for="scroller"></punica-outline>
      <div id="scroller" style="block-size: 300px; overflow: auto">
        <h2 id="one">One</h2>${para}<h2 id="two">Two</h2>${para}<h2 id="three">Three</h2>${para}${para}
      </div></div>`);
    const el = outline(wrap);
    const scroller = wrap.querySelector('#scroller');
    const current = () => el.shadowRoot.querySelector('a[aria-current]')?.textContent;
    await frames(4);
    expect(current()).toBe('One');
    expect(el.active).toBe('one');
    expect(el.shadowRoot.querySelector('a[aria-current]').getAttribute('aria-current')).toBe('location');
    expect(el.shadowRoot.querySelector('a[aria-current]').getAttribute('part')).toBe('link current');
    scroller.scrollTop = wrap.querySelector('#two').offsetTop - scroller.offsetTop;
    await frames(4);
    expect(current()).toBe('Two');
    // Between headings, the last one passed stays current.
    scroller.scrollTop += 200;
    await frames(4);
    expect(current()).toBe('Two');
    scroller.scrollTop = wrap.querySelector('#three').offsetTop - scroller.offsetTop;
    await frames(4);
    expect(current()).toBe('Three');
    expect(el.shadowRoot.querySelectorAll('a[aria-current]').length).toBe(1);
  });

  it('fires a cancelable punica-select when a link is activated, and moves there', async () => {
    const wrap = await fixture(`<div><punica-outline for="s2"></punica-outline>
      <div id="s2" style="block-size: 200px; overflow: auto"><h2 id="a1">First</h2>${para}<h2 id="a2">Second</h2>${para}</div></div>`);
    const el = outline(wrap);
    const scroller = wrap.querySelector('#s2');
    const keep = (event) => event.preventDefault();
    el.addEventListener('punica-select', keep);
    const selected = once(el, 'punica-select');
    links(el)[1].click();
    const event = await selected;
    expect(event.detail).toEqual({ value: 'a2', item: wrap.querySelector('#a2') });
    expect(location.hash).not.toBe('#a2');
    el.removeEventListener('punica-select', keep);
    links(el)[1].click();
    await frames(2);
    expect(location.hash).toBe('#a2');
    expect(scroller.scrollTop).toBeGreaterThan(0);
    expect(el.active).toBe('a2');
    history.replaceState(null, '', location.pathname + location.search);
  });

  it('scrolls to a heading inside a shadow root, which a link cannot reach', async () => {
    const wrap = await fixture('<div id="shadow-host"></div>');
    const root = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : null;
    root.innerHTML = `<punica-outline for="inner"></punica-outline>
      <div id="inner" style="block-size: 200px; overflow: auto"><h2>Top</h2>${para}<h2>Bottom</h2>${para}</div>`;
    await settle();
    const el = root.querySelector('punica-outline');
    expect(texts(el)).toEqual(['Top', 'Bottom']);
    const scroller = root.querySelector('#inner');
    const before = location.hash;
    links(el)[1].click();
    await new Promise((r) => setTimeout(r, 600));
    expect(scroller.scrollTop).toBeGreaterThan(0);
    expect(location.hash).toBe(before);
  });

  it('stops both observers on disconnect and starts them again on reconnect', async () => {
    const io = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
    const mo = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const moObserve = vi.spyOn(MutationObserver.prototype, 'observe');
    const wrap = await fixture(page());
    const el = outline(wrap);
    const doc = wrap.querySelector('#doc');
    const observed = () => moObserve.mock.calls.filter(([target]) => target === doc).length;
    expect(observed()).toBe(1);
    const before = [io.mock.calls.length, mo.mock.calls.length];
    el.remove();
    expect(io.mock.calls.length).toBeGreaterThan(before[0]);
    expect(mo.mock.calls.length).toBeGreaterThan(before[1]);
    // Out of the document, a change to the target is not seen.
    const h = document.createElement('h2');
    h.textContent = 'Later';
    doc.append(h);
    await frames();
    expect(texts(el)).not.toContain('Later');
    wrap.prepend(el);
    await settle();
    expect(observed()).toBe(2);
    expect(texts(el)).toContain('Later');
    h.remove();
    await frames();
    expect(texts(el)).not.toContain('Later');
  });

  it('writes heading text as text', async () => {
    const wrap = await fixture(`<div><punica-outline for="x"></punica-outline><div id="x"><h2>&lt;img src=x onerror="window.__outlineXss=1"&gt;</h2></div></div>`);
    const el = outline(wrap);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(texts(el)[0]).toContain('<img');
    expect(window.__outlineXss).toBeUndefined();
  });
});
