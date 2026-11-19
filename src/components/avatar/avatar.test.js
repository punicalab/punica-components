import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, a11y } from '../../../test/contract.js';
import './avatar.js';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

contract('punica-avatar', { html: '<punica-avatar name="Ada Lovelace"></punica-avatar>' });
contract('punica-avatar', { html: `<punica-avatar src="${PIXEL}" name="Ada Lovelace" color="primary"></punica-avatar>` });

const loaded = (el) =>
  new Promise((resolve) => {
    const img = el.shadowRoot.querySelector('img');
    const done = () => setTimeout(resolve, 0);
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

describe('punica-avatar', () => {
  afterEach(cleanup);

  it('is an image named by label, alt or name, through internals', async () => {
    const el = await fixture('<punica-avatar name="Ada Lovelace"></punica-avatar>');
    expect(el.internals.role).toBe('img');
    expect(el.internals.ariaLabel).toBe('Ada Lovelace');
    el.alt = 'Portrait of Ada';
    await settle();
    expect(el.internals.ariaLabel).toBe('Portrait of Ada');
    el.label = 'Ada';
    await settle();
    expect(el.internals.ariaLabel).toBe('Ada');
    el.label = el.alt = el.name = null;
    await settle();
    expect(el.internals.role).toBe(null);
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('computes initials from the first and last word of the name', async () => {
    const el = await fixture('<punica-avatar name="ada king lovelace"></punica-avatar>');
    const text = el.shadowRoot.querySelector('.initials');
    expect(text.textContent).toBe('AL');
    expect(getComputedStyle(text).display).not.toBe('none');
    expect(text.getAttribute('aria-hidden')).toBe('true');
    el.name = 'Plato';
    await settle();
    expect(text.textContent).toBe('P');
    el.name = '  ';
    await settle();
    expect(text.textContent).toBe('');
    expect(el.matches(':state(initials)')).toBe(false);
  });

  it('upper-cases initials in the language of the element', async () => {
    const wrap = await fixture('<div lang="tr"><punica-avatar name="ilker ışık"></punica-avatar></div>');
    expect(wrap.firstElementChild.shadowRoot.querySelector('.initials').textContent).toBe('İI');
  });

  it('shows the picture once it loads and the initials when it fails', async () => {
    const el = await fixture(`<punica-avatar name="Ada Lovelace"></punica-avatar>`);
    const img = el.shadowRoot.querySelector('img');
    let wait = loaded(el);
    el.src = PIXEL;
    await wait;
    expect(el.matches(':state(image)')).toBe(true);
    expect(img.hidden).toBe(false);
    expect(getComputedStyle(el.shadowRoot.querySelector('.initials')).display).toBe('none');
    expect(img.getBoundingClientRect().width).toBe(36);

    wait = loaded(el);
    el.src = 'data:image/png;base64,AAAA';
    await wait;
    expect(el.matches(':state(image)')).toBe(false);
    expect(getComputedStyle(img).display).toBe('none');
    expect(el.matches(':state(initials)')).toBe(true);

    el.src = null;
    await settle();
    expect(img.hasAttribute('src')).toBe(false);
    expect(el.matches(':state(initials)')).toBe(true);
  });

  it('shows the default slot only with no picture and no name', async () => {
    const el = await fixture('<punica-avatar label="Guest"><span id="icon">?</span></punica-avatar>');
    const icon = el.querySelector('#icon');
    expect(icon.getBoundingClientRect().width).toBeGreaterThan(0);
    el.name = 'Ada';
    await settle();
    expect(icon.getBoundingClientRect().width).toBe(0);
  });

  it('sizes and shapes by attribute, never by inline style (1.x wrote the colour on the host)', async () => {
    const el = await fixture('<punica-avatar name="Ada" size="large" shape="square" color="primary"></punica-avatar>');
    const box = el.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([44, 44]);
    const base = el.shadowRoot.querySelector('.base');
    expect(getComputedStyle(base).borderTopLeftRadius).toBe('4px');
    el.shape = null;
    el.size = 'small';
    el.color = 'red;} * {display:none';
    await settle();
    expect(getComputedStyle(base).borderTopLeftRadius).toBe('50%');
    expect(el.getBoundingClientRect().width).toBe(28);
    expect(el.hasAttribute('style')).toBe(false);
    expect(getComputedStyle(base).display).toBe('flex');
  });

  it('places the status slot at the corner, outside the clip', async () => {
    const el = await fixture(
      '<punica-avatar name="Ada"><span slot="status" style="display:block;width:8px;height:8px"></span></punica-avatar>'
    );
    const host = el.getBoundingClientRect();
    const dot = el.querySelector('[slot=status]').getBoundingClientRect();
    expect(dot.width).toBe(8);
    expect(Math.round(host.right - dot.right)).toBe(0);
    expect(Math.round(host.bottom - dot.bottom)).toBe(0);
  });

  it('treats src and name as data', async () => {
    const bad = '"><img src=x onerror=alert(1)>';
    const el = await fixture('<punica-avatar></punica-avatar>');
    el.name = bad;
    el.src = bad;
    await settle();
    expect(el.shadowRoot.querySelectorAll('img').length).toBe(1);
    expect(el.shadowRoot.querySelector('img').getAttribute('src')).toBe(bad);
    expect(el.shadowRoot.querySelector('.initials').textContent).toBe('"O');
  });
});

describe('punica-avatar neutral', () => {
  afterEach(cleanup);

  it('keeps its text readable on the neutral grey in light and dark', async () => {
    for (const scheme of ['light', 'dark']) {
      const wrap = await fixture(`<div style="color-scheme: ${scheme}; background: var(--punica-color-surface); padding: 8px"><punica-avatar name="Grace Hopper"></punica-avatar></div>`);
      expect(await a11y(wrap)).toEqual([]);
      cleanup();
    }
  });
});

describe('punica-avatar status', () => {
  afterEach(cleanup);

  it('draws no ring at the corner while nothing is in the status slot', async () => {
    const el = await fixture('<punica-avatar name="Ada Lovelace"></punica-avatar>');
    expect(getComputedStyle(el.shadowRoot.querySelector('.status')).boxShadow).toBe('none');
  });

  it('rings the slotted mark in the surface colour', async () => {
    const el = await fixture('<punica-avatar name="Ada Lovelace"><span slot="status" style="inline-size: 6px; block-size: 6px"></span></punica-avatar>');
    expect(getComputedStyle(el.querySelector('[slot=status]')).boxShadow).not.toBe('none');
  });
});
