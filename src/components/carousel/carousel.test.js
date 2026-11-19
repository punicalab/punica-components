import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './carousel.js';
import './carouselItem.js';

const html = (attrs = '') => `<punica-carousel label="Featured products" style="width:300px" ${attrs}>
  <punica-carousel-item><p>Laptop <a href="#laptop">View</a></p></punica-carousel-item>
  <punica-carousel-item><p>Phone <a href="#phone">View</a></p></punica-carousel-item>
  <punica-carousel-item label="Tablet offer"><p>Tablet</p></punica-carousel-item>
  <punica-carousel-item><p>Watch</p></punica-carousel-item>
</punica-carousel>`;

const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true }));
const itemsOf = (el) => [...el.querySelectorAll('punica-carousel-item')];
const $ = (el, part) => el.shadowRoot.querySelector(`[part~=${part}]`);
const dots = (el) => [...el.shadowRoot.querySelectorAll('[role=tab]')];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** Waits until the slide at `index` sits at the start of the track. */
async function shown(el, index) {
  const track = $(el, 'track');
  for (let i = 0; i < 60; i++) {
    const delta = itemsOf(el)[index].getBoundingClientRect().left - track.getBoundingClientRect().left;
    if (Math.abs(delta) < 1) return true;
    await wait(25);
  }
  return false;
}

contract('punica-carousel', { html: html() });
contract('punica-carousel', { html: html('autoplay interval="60" loop') });
contract('punica-carousel-item', { html: html() });

describe('punica-carousel', () => {
  afterEach(cleanup);

  it('creates both tags with createElement', () => {
    expect(document.createElement('punica-carousel').attributes.length).toBe(0);
    expect(document.createElement('punica-carousel-item').attributes.length).toBe(0);
  });

  it('is a named region called a carousel, with slides named by position', async () => {
    const el = await fixture(html());
    const items = itemsOf(el);
    expect(el.internals.role).toBe('region');
    expect(el.internals.ariaRoleDescription).toBe('carousel');
    expect(el.internals.ariaLabel).toBe('Featured products');
    expect(items[0].internals.role).toBe('group');
    expect(items[0].internals.ariaRoleDescription).toBe('slide');
    expect(items.map((i) => i.internals.ariaLabel)).toEqual(['1 of 4', '2 of 4', 'Tablet offer', '4 of 4']);
  });

  it('builds the slide names with Intl from the label-slide pattern', async () => {
    const wrap = await fixture(`<div lang="ar-EG">${html('label-slide="{index} / {total}"')}</div>`);
    const n = new Intl.NumberFormat('ar-EG');
    expect(itemsOf(wrap)[1].internals.ariaLabel).toBe(`${n.format(2)} / ${n.format(4)}`);
  });

  it('lays the slides on a scroll-snap track and keeps the others inert', async () => {
    const el = await fixture(html());
    const items = itemsOf(el);
    const track = $(el, 'track');
    expect(getComputedStyle(track).scrollSnapType).toContain('x');
    expect(getComputedStyle(items[0]).scrollSnapAlign).toBe('start');
    expect(Math.round(items[0].getBoundingClientRect().width)).toBe(300);
    expect(items.map((i) => i.inert)).toEqual([false, true, true, true]);
    expect(items.map((i) => i.active)).toEqual([true, false, false, false]);
  });

  it('names previous and next and moves with them, firing punica-change', async () => {
    const el = await fixture(html());
    const previous = $(el, 'previous');
    const next = $(el, 'next');
    expect(previous.localName).toBe('button');
    expect(previous.getAttribute('aria-label')).toBe('Previous slide');
    expect(next.getAttribute('aria-label')).toBe('Next slide');
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    const event = once(el, 'punica-change');
    next.click();
    expect((await event).detail).toEqual({ index: 1, value: 1 });
    await settle();
    expect(el.index).toBe(1);
    expect(itemsOf(el)[1].inert).toBe(false);
    expect(await shown(el, 1)).toBe(true);
    expect(previous.hasAttribute('aria-disabled')).toBe(false);
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    previous.click();
    previous.click();
    expect(el.index).toBe(0);
    expect(fired).toBe(1);
  });

  it('stops at the ends without loop and wraps with it', async () => {
    const el = await fixture(html('index="3"'));
    await settle();
    expect($(el, 'next').getAttribute('aria-disabled')).toBe('true');
    $(el, 'next').click();
    expect(el.index).toBe(3);
    el.loop = true;
    await settle();
    expect($(el, 'next').hasAttribute('aria-disabled')).toBe(false);
    $(el, 'next').click();
    expect(el.index).toBe(0);
    $(el, 'previous').click();
    expect(el.index).toBe(3);
  });

  it('draws the dots as a tab list with a roving tab stop', async () => {
    const el = await fixture(html('index="1"'));
    const list = $(el, 'dots');
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-label')).toBe('Slides');
    expect(dots(el).length).toBe(4);
    expect(dots(el).map((d) => d.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);
    expect(dots(el).map((d) => d.tabIndex)).toEqual([-1, 0, -1, -1]);
    expect(dots(el)[2].getAttribute('aria-label')).toBe('3 of 4');
    const event = once(el, 'punica-change');
    dots(el)[3].click();
    expect((await event).detail.index).toBe(3);
  });

  it('moves with the arrow keys, Home and End from the track and the dots', async () => {
    const el = await fixture(html());
    const track = $(el, 'track');
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail.index));
    track.focus();
    expect(el.shadowRoot.activeElement).toBe(track);
    key(track, 'ArrowRight');
    key(track, 'ArrowRight');
    key(track, 'ArrowLeft');
    key(track, 'End');
    key(track, 'ArrowRight');
    key(track, 'Home');
    expect(seen).toEqual([1, 2, 1, 3, 0]);
    await settle();
    dots(el)[0].focus();
    key(dots(el)[0], 'ArrowRight');
    await settle();
    expect(el.index).toBe(1);
    expect(el.shadowRoot.activeElement).toBe(dots(el)[1]);
  });

  it('mirrors the arrow keys in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${html()}</div>`);
    const el = wrap.querySelector('punica-carousel');
    key($(el, 'track'), 'ArrowLeft');
    expect(el.index).toBe(1);
    key($(el, 'track'), 'ArrowRight');
    expect(el.index).toBe(0);
    el.index = 2;
    await settle();
    const track = $(el, 'track');
    let aligned = false;
    for (let i = 0; i < 60 && !aligned; i++) {
      aligned = Math.abs(itemsOf(el)[2].getBoundingClientRect().right - track.getBoundingClientRect().right) < 1;
      if (!aligned) await wait(25);
    }
    expect(aligned).toBe(true);
  });

  it('leaves keys typed inside a slide alone', async () => {
    const el = await fixture(html());
    key(el.querySelector('a'), 'ArrowRight');
    expect(el.index).toBe(0);
  });

  it('follows index and the API without firing', async () => {
    const el = await fixture(html());
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    el.index = 2;
    await settle();
    expect(itemsOf(el)[2].active).toBe(true);
    expect(await shown(el, 2)).toBe(true);
    el.next();
    expect(el.index).toBe(3);
    el.previous();
    expect(el.index).toBe(2);
    await wait(400);
    expect(fired).toBe(0);
  });

  it('takes the slide the user scrolled to as the index', async () => {
    const el = await fixture(html());
    const track = $(el, 'track');
    const event = once(el, 'punica-change');
    track.scrollTo({ left: 600, behavior: 'instant' });
    expect((await event).detail.index).toBe(2);
    expect(el.index).toBe(2);
  });

  it('advances by itself with autoplay and shows a pause button', async () => {
    const el = await fixture(html('autoplay interval="60" loop'));
    const pause = $(el, 'pause');
    expect(pause.hidden).toBe(false);
    expect(pause.getAttribute('aria-label')).toBe('Pause');
    expect($(el, 'track').getAttribute('aria-live')).toBe('off');
    expect(el.playing).toBe(true);
    // At least one advance; a busy machine may take longer than three intervals.
    await expect.poll(() => el.index, { timeout: 3000 }).toBeGreaterThan(0);
    pause.click();
    await settle();
    expect(pause.getAttribute('aria-label')).toBe('Play');
    expect($(el, 'track').getAttribute('aria-live')).toBe('polite');
    const at = el.index;
    await wait(200);
    expect(el.index).toBe(at);
    pause.click();
    await settle();
    await wait(200);
    expect(el.index).not.toBe(at);
  });

  it('pauses autoplay while the pointer or focus is inside', async () => {
    const el = await fixture(html('autoplay interval="60" loop'));
    el.dispatchEvent(new PointerEvent('pointerenter'));
    expect(el.playing).toBe(false);
    const at = el.index;
    await wait(200);
    expect(el.index).toBe(at);
    el.dispatchEvent(new PointerEvent('pointerleave'));
    expect(el.playing).toBe(true);
    $(el, 'track').focus();
    expect(el.playing).toBe(false);
    $(el, 'track').blur();
    expect(el.playing).toBe(true);
  });

  it('has no pause button and no timer without autoplay', async () => {
    const el = await fixture(html());
    expect($(el, 'pause').hidden).toBe(true);
    expect(el.playing).toBe(false);
  });

  it('stops its timer when removed', async () => {
    const el = await fixture(html('autoplay interval="60" loop'));
    el.remove();
    const at = el.index;
    await wait(200);
    expect(el.index).toBe(at);
  });

  it('works when the slides exist before the carousel is connected, and takes later ones', async () => {
    const el = document.createElement('punica-carousel');
    el.label = 'News';
    const a = document.createElement('punica-carousel-item');
    const b = document.createElement('punica-carousel-item');
    a.textContent = 'A';
    b.textContent = 'B';
    el.append(a, b);
    el.index = 1;
    const host = await fixture('<div style="width:200px"></div>');
    host.append(el);
    await settle();
    expect(b.active).toBe(true);
    expect(a.inert).toBe(true);
    expect(b.internals.ariaLabel).toBe('2 of 2');
    const c = document.createElement('punica-carousel-item');
    c.textContent = 'C';
    el.append(c);
    await settle();
    await settle();
    expect(dots(el).length).toBe(3);
    expect(c.internals.ariaLabel).toBe('3 of 3');
  });
});
