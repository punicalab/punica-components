import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './appBar.js';

const html = `<punica-app-bar>
  <button type="button" slot="start" aria-label="Menu">≡</button>
  <strong>Studio</strong>
  <button type="button" slot="end">Account</button>
</punica-app-bar>`;

contract('punica-app-bar', { html });

describe('punica-app-bar', () => {
  afterEach(cleanup);

  it('is role=banner through internals (1.x set the invalid role="header")', async () => {
    const el = await fixture(html);
    expect(el.internals.role).toBe('banner');
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('lays out start, content and end in a row', async () => {
    const wrap = await fixture(`<div style="width:800px">${html}</div>`);
    const el = wrap.firstElementChild;
    const host = el.getBoundingClientRect();
    expect(host.width).toBe(800);
    const start = el.querySelector('[slot=start]').getBoundingClientRect();
    const title = el.querySelector('strong').getBoundingClientRect();
    const end = el.querySelector('[slot=end]').getBoundingClientRect();
    expect(Math.round(start.left)).toBe(Math.round(host.left));
    expect(start.right).toBeLessThanOrEqual(title.left);
    expect(Math.round(end.right)).toBe(Math.round(host.right));
    expect(el.shadowRoot.querySelector('.content').getBoundingClientRect().width).toBeGreaterThan(500);
  });

  it('is static by default, and sticky or fixed at the block start when asked', async () => {
    const el = await fixture(html);
    expect(getComputedStyle(el).position).toBe('static');
    el.position = 'sticky';
    await settle();
    let cs = getComputedStyle(el);
    expect(cs.position).toBe('sticky');
    expect(cs.top).toBe('0px');
    expect(cs.zIndex).toBe('1000');
    el.position = 'fixed';
    await settle();
    cs = getComputedStyle(el);
    expect(cs.position).toBe('fixed');
    expect(cs.top).toBe('0px');
    expect(el.getBoundingClientRect().width).toBe(document.documentElement.clientWidth);
    el.position = 'absolute;} * {display:none';
    await settle();
    expect(getComputedStyle(el).position).toBe('static');
  });

  it('takes its background from color', async () => {
    const wrap = await fixture(
      `<div>${html}<i style="color:var(--punica-color-primary);background:var(--punica-color-surface)"></i></div>`
    );
    const el = wrap.firstElementChild;
    const probe = getComputedStyle(wrap.lastElementChild);
    expect(getComputedStyle(el).backgroundColor).toBe(probe.color);
    el.color = 'neutral';
    await settle();
    expect(getComputedStyle(el).backgroundColor).toBe(probe.backgroundColor);
    expect(getComputedStyle(el).borderBottomWidth).toBe('1px');
  });
});
