import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import '../button/button.js';
import './emptyState.js';

const html = `<punica-empty-state heading="No invoices yet">
  <span slot="icon" aria-hidden="true">□</span>
  Invoices you send appear here.
  <punica-button slot="actions">New invoice</punica-button>
</punica-empty-state>`;

contract('punica-empty-state', { html });
contract('punica-empty-state', { html: '<punica-empty-state size="section" heading="No results"></punica-empty-state>' });

describe('punica-empty-state', () => {
  afterEach(cleanup);

  it('writes heading as a heading of the given level, as text', async () => {
    const el = await fixture(html);
    const heading = el.shadowRoot.querySelector('.heading');
    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('3');
    expect(heading.textContent).toBe('No invoices yet');
    el.headingLevel = 2;
    el.heading = '"><img src=x onerror=alert(1)>';
    await settle();
    expect(heading.getAttribute('aria-level')).toBe('2');
    expect(heading.textContent).toBe('"><img src=x onerror=alert(1)>');
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    el.headingLevel = 9;
    el.heading = null;
    await settle();
    expect(heading.getAttribute('aria-level')).toBe('3');
    expect(getComputedStyle(heading).display).toBe('none');
  });

  it('stacks icon, heading, description and actions, centred', async () => {
    const wrap = await fixture(`<div style="width:600px;height:400px">${html}</div>`);
    const el = wrap.firstElementChild;
    const centre = (node) => {
      const r = node.getBoundingClientRect();
      return Math.round(r.left + r.width / 2);
    };
    const parts = ['.icon', '.heading', '.description', '.actions'].map((s) => el.shadowRoot.querySelector(s));
    const tops = parts.map((p) => p.getBoundingClientRect().top);
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);
    for (const part of parts) expect(Math.abs(centre(part) - centre(el))).toBeLessThanOrEqual(1);
    expect(getComputedStyle(el).textAlign).toBe('center');
  });

  it('fills a panel, and is compact as a section', async () => {
    const wrap = await fixture(`<div style="width:600px;height:400px">${html}</div>`);
    const el = wrap.firstElementChild;
    expect(el.getBoundingClientRect().height).toBe(400);
    const first = el.shadowRoot.querySelector('.icon').getBoundingClientRect();
    expect(first.top - el.getBoundingClientRect().top).toBeGreaterThan(48);
    el.size = 'section';
    await settle();
    expect(el.getBoundingClientRect().height).toBeLessThan(200);
    expect(getComputedStyle(el).paddingTop).toBe('16px');
    expect(getComputedStyle(el.shadowRoot.querySelector('.heading')).fontSize).toBe('14px');
  });
});
