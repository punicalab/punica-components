import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './infoTip.js';

const html = `<punica-info-tip>Revenue after refunds, before tax.</punica-info-tip>`;
const page = `<div style="padding:80px 160px"><button id="before">Before</button> Net revenue ${html} <button id="after">After</button></div>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const btn = (el) => el.shadowRoot.querySelector('.button');
const panel = (el) => el.shadowRoot.querySelector('.panel');
const showing = (el) => panel(el).matches(':popover-open');

contract('punica-info-tip', {
  html,
  open: async (el) => {
    el.show();
    await settle();
  }
});

describe('punica-info-tip', () => {
  afterEach(cleanup);

  it('is a button named by label and described by the explanation', async () => {
    const el = await fixture(html);
    const button = btn(el);
    expect(button.localName).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('More information');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    if ('ariaDescribedByElements' in button) expect(button.ariaDescribedByElements).toEqual([panel(el)]);
    el.label = 'About net revenue';
    await settle();
    expect(button.getAttribute('aria-label')).toBe('About net revenue');
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('opens on click, pinned, and a second click closes it', async () => {
    const el = await fixture(page.replace('<punica-info-tip>', '<punica-info-tip>'));
    const tip = el.querySelector('punica-info-tip');
    const opened = once(tip, 'punica-open');
    btn(tip).click();
    await opened;
    await settle();
    expect(showing(tip)).toBe(true);
    expect(btn(tip).getAttribute('aria-expanded')).toBe('true');
    await wait(200);
    expect(await a11y(el)).toEqual([]);
    const closed = once(tip, 'punica-close');
    btn(tip).click();
    expect((await closed).detail).toEqual({ reason: 'button' });
    expect(showing(tip)).toBe(false);
    expect(btn(tip).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens from the keyboard with Enter and Space; Escape closes and focus stays on the button', async () => {
    const wrap = await fixture(page);
    const tip = wrap.querySelector('punica-info-tip');
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    expect(tip.shadowRoot.activeElement).toBe(btn(tip));
    expect(tip.open).toBe(false);
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(tip.open).toBe(true);
    const closed = once(tip, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail.reason).toBe('escape');
    expect(tip.shadowRoot.activeElement).toBe(btn(tip));
    await userEvent.keyboard(' ');
    await settle();
    expect(tip.open).toBe(true);
    // Tab away closes it.
    const blurred = once(tip, 'punica-close');
    await userEvent.keyboard('{Tab}');
    expect((await blurred).detail.reason).toBe('blur');
    expect(document.activeElement).toBe(wrap.querySelector('#after'));
  });

  it('returns focus to the button when Escape is pressed inside the panel', async () => {
    const tip = await fixture('<punica-info-tip>Read the <a href="#guide">guide</a>.</punica-info-tip>');
    tip.show();
    await settle();
    tip.querySelector('a').focus();
    const closed = once(tip, 'punica-close');
    await userEvent.keyboard('{Escape}');
    await closed;
    expect(tip.shadowRoot.activeElement).toBe(btn(tip));
  });

  it('closes on a press outside', async () => {
    const wrap = await fixture(page);
    const tip = wrap.querySelector('punica-info-tip');
    btn(tip).click();
    await settle();
    const closed = once(tip, 'punica-close');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect((await closed).detail.reason).toBe('outside');
  });

  it('previews on hover without pinning, and a click then pins it', async () => {
    const wrap = await fixture(`<div style="padding:80px 20px">${html}<p id="away" style="margin-block-start:160px">Elsewhere</p></div>`);
    const tip = wrap.querySelector('punica-info-tip');
    tip.delay = 0;
    await settle();
    await userEvent.hover(btn(tip));
    await wait(30);
    expect(tip.open).toBe(true);
    expect(btn(tip).getAttribute('aria-expanded')).toBe('false');
    btn(tip).click();
    await settle();
    expect(tip.open).toBe(true);
    expect(btn(tip).getAttribute('aria-expanded')).toBe('true');
    await userEvent.hover(wrap.querySelector('#away'));
    await wait(200);
    expect(tip.open).toBe(true);
    tip.hide();
    await settle();
    await userEvent.hover(btn(tip));
    await wait(30);
    expect(tip.open).toBe(true);
    const closed = once(tip, 'punica-close');
    await userEvent.hover(wrap.querySelector('#away'));
    expect((await closed).detail.reason).toBe('pointer');
  });

  it('opens on the side asked, mirrored right to left', async () => {
    const ltr = await fixture(`<div style="padding:120px 20px">${html.replace('<punica-info-tip', '<punica-info-tip side="inline-end"')}</div>`);
    const tip = ltr.querySelector('punica-info-tip');
    tip.show();
    await settle();
    const b = btn(tip).getBoundingClientRect();
    expect(panel(tip).getBoundingClientRect().left).toBeGreaterThanOrEqual(b.right);
    tip.hide();
    ltr.dir = 'rtl';
    await settle();
    tip.show();
    await settle();
    expect(panel(tip).getBoundingClientRect().right).toBeLessThanOrEqual(btn(tip).getBoundingClientRect().left);
  });

  it('shows markup in its slot as given and never parses its label', async () => {
    const el = await fixture(html);
    el.label = '<img src=x onerror="window.__pwned=1">';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(btn(el).getAttribute('aria-label')).toBe('<img src=x onerror="window.__pwned=1">');
    expect(window.__pwned).toBeUndefined();
  });
});
