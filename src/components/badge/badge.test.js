import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, a11y } from '../../../test/contract.js';
import './badge.js';

contract('punica-badge', {
  html: '<punica-badge content="3" label="3 unread messages"><button type="button">Inbox</button></punica-badge>'
});
contract('punica-badge', { html: '<p>Drafts <punica-badge content="12" color="error"></punica-badge></p>' });

const badge = (el) => el.shadowRoot.querySelector('.badge');
const text = (el) => el.shadowRoot.querySelector('.count').textContent;
const shown = (el) => getComputedStyle(badge(el)).display !== 'none';

describe('punica-badge', () => {
  afterEach(cleanup);

  it('shows its content at the block-start inline-end corner of what it wraps', async () => {
    const el = await fixture(
      '<punica-badge content="3"><div style="width:40px;height:40px"></div></punica-badge>'
    );
    expect(text(el)).toBe('3');
    const host = el.getBoundingClientRect();
    const b = badge(el).getBoundingClientRect();
    expect(Math.round(b.left + b.width / 2)).toBe(Math.round(host.right));
    expect(Math.round(b.top + b.height / 2)).toBe(Math.round(host.top));
    expect(b.height).toBe(20);
  });

  it('moves to the other corners by logical name, mirrored in RTL', async () => {
    const wrap = await fixture(
      '<div><punica-badge content="3" placement="block-end-inline-start"><div style="width:40px;height:40px"></div></punica-badge></div>'
    );
    const el = wrap.firstElementChild;
    let host = el.getBoundingClientRect();
    let b = badge(el).getBoundingClientRect();
    expect(Math.round(b.left + b.width / 2)).toBe(Math.round(host.left));
    expect(Math.round(b.top + b.height / 2)).toBe(Math.round(host.bottom));
    wrap.dir = 'rtl';
    await settle();
    host = el.getBoundingClientRect();
    b = badge(el).getBoundingClientRect();
    expect(Math.round(b.left + b.width / 2)).toBe(Math.round(host.right));
    el.placement = null;
    await settle();
    b = badge(el).getBoundingClientRect();
    expect(Math.round(b.left + b.width / 2)).toBe(Math.round(host.left));
    expect(Math.round(b.top + b.height / 2)).toBe(Math.round(host.top));
  });

  it('caps a count at max', async () => {
    const el = await fixture('<punica-badge content="150">x</punica-badge>');
    expect(text(el)).toBe('99+');
    el.max = 999;
    await settle();
    expect(text(el)).toBe('150');
    el.max = 9;
    el.content = '10';
    await settle();
    expect(text(el)).toBe('9+');
    el.content = '9';
    await settle();
    expect(text(el)).toBe('9');
  });

  it('hides a count of 0 unless show-zero, and shows nothing with no content', async () => {
    const el = await fixture('<punica-badge content="0">x</punica-badge>');
    expect(shown(el)).toBe(false);
    el.showZero = true;
    await settle();
    expect(shown(el)).toBe(true);
    expect(text(el)).toBe('0');
    el.showZero = false;
    el.content = null;
    await settle();
    expect(shown(el)).toBe(false);
    el.content = 'new';
    await settle();
    expect(shown(el)).toBe(true);
    expect(text(el)).toBe('new');
  });

  it('is a disc with no text as a dot', async () => {
    const el = await fixture('<punica-badge dot content="5">x</punica-badge>');
    expect(shown(el)).toBe(true);
    expect(text(el)).toBe('');
    const b = badge(el).getBoundingClientRect();
    expect([b.width, b.height]).toEqual([8, 8]);
    el.content = '0';
    await settle();
    expect(shown(el)).toBe(false);
    el.content = null;
    await settle();
    expect(shown(el)).toBe(true);
  });

  it('reads the label to assistive technology in place of the bare count', async () => {
    const el = await fixture('<punica-badge content="3" label="3 unread messages">x</punica-badge>');
    const count = el.shadowRoot.querySelector('.count');
    const label = el.shadowRoot.querySelector('.label');
    expect(count.getAttribute('aria-hidden')).toBe('true');
    expect(label.textContent).toBe('3 unread messages');
    expect(label.getBoundingClientRect().width).toBe(1);
    el.label = null;
    await settle();
    expect(count.hasAttribute('aria-hidden')).toBe(false);
    expect(label.textContent).toBe('');
  });

  it('sits in the line when it wraps nothing', async () => {
    const el = await fixture('<punica-badge content="12"></punica-badge>');
    await settle();
    expect(el.matches(':state(standalone)')).toBe(true);
    expect(getComputedStyle(badge(el)).position).toBe('static');
    expect(el.getBoundingClientRect().width).toBeGreaterThanOrEqual(20);
  });

  it('writes content as text and builds its tree once (1.x appended it on every connect)', async () => {
    const el = await fixture('<punica-badge>x</punica-badge>');
    el.content = '"><img src=x onerror=alert(1)>';
    el.label = '<b>bold</b>';
    await settle();
    expect(el.shadowRoot.querySelector('img, b')).toBe(null);
    expect(text(el)).toBe('"><img src=x onerror=alert(1)>');
    const parent = el.parentElement;
    el.remove();
    parent.appendChild(el);
    el.remove();
    parent.appendChild(el);
    expect(el.shadowRoot.querySelectorAll('.badge').length).toBe(1);
  });
});

describe('punica-badge neutral', () => {
  afterEach(cleanup);

  it('keeps its text readable on the neutral grey in light and dark', async () => {
    for (const scheme of ['light', 'dark']) {
      const wrap = await fixture(`<div style="color-scheme: ${scheme}; background: var(--punica-color-surface); padding: 8px"><punica-badge content="3" color="neutral"></punica-badge></div>`);
      expect(await a11y(wrap)).toEqual([]);
      cleanup();
    }
  });
});

describe('punica-badge in right-to-left', () => {
  afterEach(cleanup);

  it('keeps the plus after the number', async () => {
    const wrap = await fixture('<div dir="rtl"><punica-badge content="120"></punica-badge></div>');
    const text = wrap.firstElementChild.shadowRoot.querySelector('.count').firstChild;
    expect(text.data).toBe('99+');
    const range = document.createRange();
    const box = (start, end) => {
      range.setStart(text, start);
      range.setEnd(text, end);
      return range.getBoundingClientRect();
    };
    expect(box(2, 3).left).toBeGreaterThanOrEqual(box(0, 2).right - 0.5);
  });
});

