import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './section.js';

const html = `<punica-section heading="Notifications">
  <span slot="description">Choose what reaches you, and how.</span>
  <button slot="actions" type="button">Reset</button>
  <p>Email me when a teammate mentions me.</p>
</punica-section>`;
const base = (el) => el.shadowRoot.querySelector('section');
const heading = (el) => el.shadowRoot.querySelector('[part=heading]');
const toggle = (el) => el.shadowRoot.querySelector('.toggle');
const body = (el) => el.shadowRoot.querySelector('[part=body]');

contract('punica-section', { html });
contract('punica-section', { html: html.replace('<punica-section', '<punica-section collapsible open') });

describe('punica-section', () => {
  afterEach(cleanup);

  it('is a region named by a real h2, described by its description', async () => {
    const el = await fixture(html);
    const h = heading(el);
    expect(h.localName).toBe('h2');
    expect(h.textContent.trim()).toBe('Notifications');
    expect(base(el).localName).toBe('section');
    expect(base(el).getAttribute('aria-labelledby')).toBe(h.id);
    expect(base(el).getAttribute('aria-describedby')).toBe('description');
    expect(body(el).hidden).toBe(false);
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('takes its level from level, and anything out of range is 2', async () => {
    const el = await fixture(html);
    el.level = 4;
    await settle();
    expect(heading(el).localName).toBe('h4');
    expect(heading(el).textContent.trim()).toBe('Notifications');
    expect(base(el).getAttribute('aria-labelledby')).toBe(heading(el).id);
    el.level = 9;
    await settle();
    expect(heading(el).localName).toBe('h2');
    el.setAttribute('level', '1');
    await settle();
    expect(heading(el).localName).toBe('h1');
  });

  it('takes its heading from the heading slot over the attribute', async () => {
    const el = await fixture(`<punica-section heading="Plain"><span slot="heading">Billing <em>and</em> plans</span><p>Body</p></punica-section>`);
    expect(base(el).getAttribute('aria-labelledby')).toBe(heading(el).id);
    expect(heading(el).querySelector('.text').checkVisibility()).toBe(false);
    expect(heading(el).querySelector('slot[name=heading]').assignedElements()[0].textContent).toBe('Billing and plans');
  });

  it('is named by label when given, and has no header row with nothing in it', async () => {
    const el = await fixture('<punica-section><p>Only a body.</p></punica-section>');
    expect(el.shadowRoot.querySelector('[part=header]').hidden).toBe(true);
    expect(base(el).hasAttribute('aria-labelledby')).toBe(false);
    el.label = 'Summary';
    await settle();
    expect(base(el).getAttribute('aria-label')).toBe('Summary');
    expect(base(el).hasAttribute('aria-labelledby')).toBe(false);
  });

  it('hides empty description and actions, and draws a divider under the header', async () => {
    const el = await fixture('<punica-section heading="Profile" divider><p>Body</p></punica-section>');
    expect(el.shadowRoot.querySelector('[part=description]').hidden).toBe(true);
    expect(el.shadowRoot.querySelector('[part=actions]').hidden).toBe(true);
    expect(base(el).hasAttribute('aria-describedby')).toBe(false);
    const header = el.shadowRoot.querySelector('[part=header]');
    expect(getComputedStyle(header).borderBottomStyle).toBe('solid');
    el.divider = false;
    await settle();
    expect(getComputedStyle(header).borderBottomStyle).toBe('none');
  });

  it('places the actions at the end of the header row, mirrored in RTL', async () => {
    const wrap = await fixture(`<div style="width: 600px">${html}</div>`);
    const el = wrap.querySelector('punica-section');
    const x = (node) => node.getBoundingClientRect();
    const action = el.querySelector('[slot=actions]');
    expect(x(action).left).toBeGreaterThan(x(heading(el)).left);
    expect(Math.round(x(action).right)).toBe(Math.round(x(el).right));
    wrap.dir = 'rtl';
    await settle();
    expect(x(action).left).toBeLessThan(x(heading(el)).left);
    expect(Math.round(x(action).left)).toBe(Math.round(x(el).left));
  });

  it('is a disclosure when collapsible: a button in the heading, closed until open', async () => {
    const el = await fixture(html.replace('<punica-section', '<punica-section collapsible'));
    const button = toggle(el);
    expect(button.parentElement).toBe(heading(el));
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(body(el).id);
    expect(button.textContent.trim()).toBe('Notifications');
    expect(body(el).hidden).toBe(true);
    expect(el.querySelector('p').checkVisibility()).toBe(false);
    expect(await a11y(el.parentElement)).toEqual([]);

    const toggled = once(el, 'punica-toggle');
    button.click();
    expect((await toggled).detail).toEqual({ open: true });
    await settle();
    expect(el.open).toBe(true);
    expect(el.matches(':state(open)')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('p').checkVisibility()).toBe(true);

    // A programmatic change fires nothing.
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    el.hide();
    await settle();
    expect(body(el).hidden).toBe(true);
    el.toggle();
    await settle();
    expect(body(el).hidden).toBe(false);
    expect(fired).toBe(0);
  });

  it('works by keyboard: Tab reaches the toggle, Enter and Space flip it', async () => {
    const el = await fixture(html.replace('<punica-section', '<punica-section collapsible'));
    const button = toggle(el);
    await userEvent.keyboard('{Tab}');
    let tries = 0;
    while (el.shadowRoot.activeElement !== button && tries++ < 5) await userEvent.keyboard('{Tab}');
    expect(el.shadowRoot.activeElement).toBe(button);
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(el.open).toBe(true);
    await userEvent.keyboard(' ');
    await settle();
    expect(el.open).toBe(false);
  });

  it('is a plain heading again when no longer collapsible, and always shows its body', async () => {
    const el = await fixture(html.replace('<punica-section', '<punica-section collapsible'));
    el.collapsible = false;
    await settle();
    expect(toggle(el)).toBe(null);
    expect(heading(el).textContent.trim()).toBe('Notifications');
    expect(body(el).hidden).toBe(false);
    expect(el.matches(':state(open)')).toBe(false);
  });

  it('writes the heading as text', async () => {
    const el = await fixture(html);
    el.heading = '<img src=x onerror="window.__sectionXss = 1">';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(heading(el).textContent).toContain('<img');
    expect(window.__sectionXss).toBeUndefined();
  });
});
