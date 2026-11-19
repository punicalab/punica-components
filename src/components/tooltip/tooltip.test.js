import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './tooltip.js';
import '../button/button.js';

const html = '<punica-tooltip text="Saves the document" delay="20"><button>Save</button></punica-tooltip>';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const over = (el, init = {}) => el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, composed: true, ...init }));
const out = (el, init = {}) => el.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, composed: true, ...init }));

contract('punica-tooltip', { html, open: (el) => el.show() });

describe('punica-tooltip', () => {
  afterEach(cleanup);

  it('opens a role=tooltip panel in the top layer after the delay, on the chosen side', async () => {
    const wrap = await fixture(`<div style="margin:80px">${html}</div>`);
    const el = wrap.querySelector('punica-tooltip');
    const trigger = el.querySelector('button');
    over(trigger);
    expect(el.open).toBe(false);
    const opened = once(el, 'punica-open');
    await opened;
    await settle();
    expect(el.open).toBe(true);
    expect(el.panel.getAttribute('role')).toBe('tooltip');
    expect(el.panel.matches(':popover-open')).toBe(true);
    const a = trigger.getBoundingClientRect();
    const p = el.panel.getBoundingClientRect();
    expect(p.bottom).toBeLessThanOrEqual(a.top);
    expect(Math.abs(p.left + p.width / 2 - (a.left + a.width / 2))).toBeLessThan(2);
    el.side = 'block-end';
    el.align = 'start';
    await settle();
    const q = el.panel.getBoundingClientRect();
    expect(q.top).toBeGreaterThanOrEqual(a.bottom);
    expect(Math.abs(q.left - a.left)).toBeLessThan(2);
    await wait(250);
    expect(await a11y(wrap)).toEqual([]);
  });

  it('closes when the pointer leaves, and stays while the pointer is on the tooltip', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('button');
    over(trigger);
    await once(el, 'punica-open');
    out(trigger);
    over(el.panel);
    await wait(160);
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    out(el.panel);
    expect((await closed).detail.reason).toBe('pointer');
    expect(el.open).toBe(false);
    expect(el.panel.matches(':popover-open')).toBe(false);
  });

  it('does not open when the pointer leaves before the delay', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('button');
    over(trigger);
    out(trigger);
    await wait(180);
    expect(el.open).toBe(false);
  });

  it('opens on keyboard focus, closes on Escape and on blur', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button>${html}</div>`);
    const el = wrap.querySelector('punica-tooltip');
    const trigger = el.querySelector('button');
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    await settle();
    expect(document.activeElement).toBe(trigger);
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail.reason).toBe('escape');
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await userEvent.keyboard('{Tab}');
    await settle();
    expect(el.open).toBe(true);
    const blurred = once(el, 'punica-close');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect((await blurred).detail.reason).toBe('blur');
    expect(el.open).toBe(false);
  });

  it('opens on keyboard focus of a custom-element trigger such as punica-button', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button><punica-tooltip text="Copy the link"><punica-button>Copy</punica-button></punica-tooltip></div>`);
    const el = wrap.querySelector('punica-tooltip');
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    await settle();
    expect(document.activeElement).toBe(el.querySelector('punica-button'));
    expect(el.open).toBe(true);
    // A mouse click focuses it too, and does not open it.
    await userEvent.keyboard('{Escape}');
    await settle();
    wrap.querySelector('#before').focus();
    await userEvent.click(el.querySelector('punica-button'));
    await settle();
    // Not before the hover delay: the click's focus is not keyboard focus.
    expect(el.open).toBe(false);
    el.hide();
    await settle();
  });

  it('describes the trigger with its text and follows later changes to text', async () => {
    const el = await fixture(html);
    const trigger = el.querySelector('button');
    const described = () =>
      (trigger.ariaDescribedByElements || []).map((n) => n.textContent.trim()).join(' ') ||
      trigger.getAttribute('aria-description');
    expect(described()).toBe('Saves the document');
    el.text = 'Saves a copy';
    await settle();
    expect(described()).toBe('Saves a copy');
    expect(el.shadowRoot.querySelector('[part=text]').textContent).toBe('Saves a copy');
    el.remove();
    expect(trigger.hasAttribute('aria-description')).toBe(false);
    expect((trigger.ariaDescribedByElements || []).length).toBe(0);
  });

  it('describes the trigger by a slotted content element', async () => {
    const el = await fixture(
      '<punica-tooltip><button>Save</button><span slot="content">Saves <b>everything</b></span></punica-tooltip>'
    );
    const trigger = el.querySelector('button');
    const content = el.querySelector('[slot=content]');
    if ('ariaDescribedByElements' in trigger) {
      expect(trigger.ariaDescribedByElements).toEqual([content]);
      expect(trigger.hasAttribute('aria-description')).toBe(false);
    } else {
      expect(trigger.getAttribute('aria-description')).toBe('Saves everything');
    }
  });

  it('renders markup in text as text', async () => {
    const el = await fixture('<punica-tooltip><button>Save</button></punica-tooltip>');
    el.setAttribute('text', '<img src=x onerror="window.__tooltipXss = 1">');
    el.show();
    await settle();
    await wait(50);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('[part=text]').textContent).toBe('<img src=x onerror="window.__tooltipXss = 1">');
    expect(window.__tooltipXss).toBeUndefined();
  });

  it('keeps two instances apart and adds nothing to the body', async () => {
    const before = document.body.children.length;
    const wrap = await fixture(`<div>${html}${html}</div>`);
    const [a, b] = wrap.querySelectorAll('punica-tooltip');
    a.show();
    b.show();
    await settle();
    expect(document.body.children.length).toBe(before + 1);
    out(a.querySelector('button'));
    await wait(160);
    expect(a.open).toBe(false);
    expect(b.open).toBe(true);
  });

  it('does not open while disabled', async () => {
    const el = await fixture(html.replace('<punica-tooltip', '<punica-tooltip disabled'));
    over(el.querySelector('button'));
    await wait(80);
    expect(el.open).toBe(false);
  });
});
