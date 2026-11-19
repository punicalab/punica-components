import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './hoverCard.js';
import '../link/link.js';

const html = `<punica-hover-card label="About Ada" delay="20" close-delay="40">
  <a slot="trigger" href="#ada">Ada Lovelace</a>
  <p>Mathematician. <a id="more" href="#more">Read more</a></p>
</punica-hover-card>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const over = (el, init = {}) => el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, composed: true, ...init }));
const out = (el, init = {}) => el.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, composed: true, ...init }));

contract('punica-hover-card', { html, open: (el) => el.show() });

describe('punica-hover-card', () => {
  afterEach(cleanup);

  it('opens a named, non-modal dialog in the top layer after the delay', async () => {
    const wrap = await fixture(`<div style="margin:40px">${html}</div>`);
    const el = wrap.querySelector('punica-hover-card');
    const trigger = el.querySelector('[slot=trigger]');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    over(trigger);
    expect(el.open).toBe(false);
    await once(el, 'punica-open');
    await settle();
    expect(el.panel.matches(':popover-open')).toBe(true);
    expect(el.panel.getAttribute('role')).toBe('dialog');
    expect(el.panel.hasAttribute('aria-modal')).toBe(false);
    expect(el.panel.getAttribute('aria-label')).toBe('About Ada');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const a = trigger.getBoundingClientRect();
    const p = el.panel.getBoundingClientRect();
    expect(p.top).toBeGreaterThanOrEqual(a.bottom);
    // Focus stays where it was.
    expect(document.activeElement).not.toBe(el);
    await wait(250);
    expect(await a11y(wrap)).toEqual([]);
  });

  it('stays open while the pointer is inside the panel and closes after it leaves', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('[slot=trigger]');
    over(trigger);
    await once(el, 'punica-open');
    out(trigger);
    over(el.querySelector('#more'));
    await wait(120);
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    out(el.querySelector('#more'));
    expect((await closed).detail.reason).toBe('pointer');
    expect(el.open).toBe(false);
  });

  it('opens on keyboard focus, lets Tab into the panel, and Escape returns focus to the trigger', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button>${html}<button id="after">After</button></div>`);
    const el = wrap.querySelector('punica-hover-card');
    const trigger = el.querySelector('[slot=trigger]');
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    await settle();
    expect(document.activeElement).toBe(trigger);
    expect(el.open).toBe(true);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(el.querySelector('#more'));
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail.reason).toBe('escape');
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('opens on keyboard focus of a custom-element trigger such as punica-link', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button><punica-hover-card label="Grace"><punica-link slot="trigger" href="#grace">@grace</punica-link><a href="#profile">Profile</a></punica-hover-card></div>`);
    const el = wrap.querySelector('punica-hover-card');
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    await settle();
    expect(document.activeElement).toBe(el.querySelector('punica-link'));
    expect(el.open).toBe(true);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(el.querySelector('a'));
    expect(el.open).toBe(true);
  });

  it('closes when focus leaves trigger and panel', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button>${html}<button id="after">After</button></div>`);
    const el = wrap.querySelector('punica-hover-card');
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    await settle();
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect((await closed).detail.reason).toBe('blur');
    expect(el.open).toBe(false);
  });

  it('keeps two instances apart and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-hover-card');
    a.show();
    b.show();
    await settle();
    expect(document.body.children.length).toBe(before + 1);
    out(a.querySelector('[slot=trigger]'));
    await wait(100);
    expect(a.open).toBe(false);
    expect(b.open).toBe(true);
  });

  it('renders markup in label as text and stays closed while disabled', async () => {
    const el = await fixture(html.replace('<punica-hover-card', '<punica-hover-card disabled'));
    el.label = '<img src=x onerror="window.__hoverXss = 1">';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.panel.getAttribute('aria-label')).toContain('<img');
    over(el.querySelector('[slot=trigger]'));
    await wait(80);
    expect(el.open).toBe(false);
    expect(window.__hoverXss).toBeUndefined();
  });
});
