import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './scrollArea.js';

const lines = (n) => Array.from({ length: n }, (_, i) => `<p style="margin:0;height:40px">Line ${i + 1}</p>`).join('');
const html = `<punica-scroll-area label="Activity" style="height:120px;width:240px">${lines(10)}</punica-scroll-area>`;

contract('punica-scroll-area', { html });
contract('punica-scroll-area', {
  html: `<punica-scroll-area style="height:120px;width:240px">${lines(10)}</punica-scroll-area>`
});

const viewport = (el) => el.shadowRoot.querySelector('.viewport');
const opacity = (el, which) => Number(getComputedStyle(el.shadowRoot.querySelector(`.${which}`)).opacity);
const frames = async (n = 3) => {
  for (let i = 0; i < n; i++) await settle();
};

describe('punica-scroll-area', () => {
  afterEach(cleanup);

  it('scrolls its content inside its own box, with thin scrollbars', async () => {
    const el = await fixture(html);
    const v = viewport(el);
    expect(el.getBoundingClientRect().height).toBe(120);
    expect(v.clientHeight).toBe(120);
    expect(v.scrollHeight).toBe(400);
    const cs = getComputedStyle(v);
    expect(cs.overflowY).toBe('auto');
    expect(cs.overflowX).toBe('hidden');
    expect(cs.scrollbarWidth).toBe('thin');
    expect(el.viewport).toBe(v);
  });

  it('respects a max-block-size as well as a block-size', async () => {
    const el = await fixture(`<punica-scroll-area style="max-height:100px;width:200px">${lines(10)}</punica-scroll-area>`);
    expect(el.getBoundingClientRect().height).toBe(100);
    expect(viewport(el).scrollHeight).toBe(400);
    const short = await fixture(`<punica-scroll-area style="max-height:100px;width:200px">${lines(1)}</punica-scroll-area>`);
    expect(short.getBoundingClientRect().height).toBe(40);
  });

  it('shows a shadow only at an edge with more to scroll', async () => {
    const el = await fixture(html);
    const v = viewport(el);
    await frames();
    expect(opacity(el, 'start')).toBe(0);
    expect(opacity(el, 'end')).toBe(1);
    expect(el.matches(':state(scroll-end)')).toBe(true);
    expect(el.matches(':state(scroll-start)')).toBe(false);

    v.scrollTop = 100;
    await frames();
    expect(opacity(el, 'start')).toBe(1);
    expect(opacity(el, 'end')).toBe(1);
    expect(el.matches(':state(scroll-start)')).toBe(true);

    v.scrollTop = v.scrollHeight;
    await frames();
    expect(opacity(el, 'start')).toBe(1);
    expect(opacity(el, 'end')).toBe(0);
    expect(el.matches(':state(scroll-end)')).toBe(false);
  });

  it('shows no shadow and takes no tab stop when nothing overflows', async () => {
    const el = await fixture(`<punica-scroll-area style="height:120px;width:240px">${lines(2)}</punica-scroll-area>`);
    await frames();
    expect(opacity(el, 'start')).toBe(0);
    expect(opacity(el, 'end')).toBe(0);
    expect(el.matches(':state(scrollable)')).toBe(false);
    expect(viewport(el).hasAttribute('tabindex')).toBe(false);
  });

  it('joins the tab order as a named region when it overflows with nothing focusable inside', async () => {
    const el = await fixture(html);
    await frames();
    const v = viewport(el);
    expect(v.getAttribute('tabindex')).toBe('0');
    expect(v.getAttribute('role')).toBe('region');
    expect(v.getAttribute('aria-label')).toBe('Activity');
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(v);
    el.label = null;
    await settle();
    expect(v.hasAttribute('role')).toBe(false);
    expect(v.getAttribute('tabindex')).toBe('0');
  });

  it('leaves the tab stop to a focusable child, and follows content as it changes', async () => {
    const el = await fixture(
      `<punica-scroll-area style="height:120px;width:240px">${lines(10)}<button type="button">More</button></punica-scroll-area>`
    );
    await frames();
    const v = viewport(el);
    expect(v.hasAttribute('tabindex')).toBe(false);
    el.querySelector('button').remove();
    await frames();
    expect(v.getAttribute('tabindex')).toBe('0');
    el.replaceChildren();
    await frames();
    expect(v.hasAttribute('tabindex')).toBe(false);
    expect(el.matches(':state(scrollable)')).toBe(false);
    el.insertAdjacentHTML('beforeend', lines(10));
    await frames();
    expect(el.matches(':state(scrollable)')).toBe(true);
    expect(v.getAttribute('tabindex')).toBe('0');
  });

  it('scrolls on the inline axis when horizontal', async () => {
    const el = await fixture(
      '<punica-scroll-area orientation="horizontal" style="width:200px"><div style="width:900px;height:40px">Wide</div></punica-scroll-area>'
    );
    await frames();
    const v = viewport(el);
    const cs = getComputedStyle(v);
    expect(cs.overflowX).toBe('auto');
    expect(cs.overflowY).toBe('hidden');
    expect(v.scrollWidth).toBe(900);
    expect(opacity(el, 'start')).toBe(0);
    expect(opacity(el, 'end')).toBe(1);
    const end = el.shadowRoot.querySelector('.end').getBoundingClientRect();
    expect(Math.round(end.right)).toBe(Math.round(el.getBoundingClientRect().right));
    expect(end.width).toBe(16);
    v.scrollLeft = 300;
    await frames();
    expect(opacity(el, 'start')).toBe(1);
  });

  it('stops observing on disconnect and starts again on connect', async () => {
    const el = await fixture(`<punica-scroll-area style="height:120px;width:240px">${lines(2)}</punica-scroll-area>`);
    const parent = el.parentElement;
    el.remove();
    parent.appendChild(el);
    el.insertAdjacentHTML('beforeend', lines(10));
    await frames();
    expect(el.matches(':state(scrollable)')).toBe(true);
  });
});
