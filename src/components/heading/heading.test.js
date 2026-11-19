import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './heading.js';

contract('punica-heading', { html: '<punica-heading level="1">Invoices</punica-heading>' });

describe('punica-heading', () => {
  afterEach(cleanup);

  it('is a heading of its level through internals, with no attribute on the host', async () => {
    const el = await fixture('<punica-heading level="3">Totals</punica-heading>');
    expect(el.internals.role).toBe('heading');
    expect(el.internals.ariaLevel).toBe('3');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-level')).toBe(false);
    el.level = 5;
    await settle();
    expect(el.internals.ariaLevel).toBe('5');
  });

  it('is level 2 by default and for a level outside 1-6', async () => {
    const el = await fixture('<punica-heading>Totals</punica-heading>');
    expect(el.level).toBe(2);
    expect(el.internals.ariaLevel).toBe('2');
    for (const bad of ['0', '7', '2.5', 'x', '"><img src=x onerror=alert(1)>']) {
      el.setAttribute('level', bad);
      await settle();
      expect(el.internals.ariaLevel, bad).toBe('2');
    }
  });

  it('sizes by level, and by size whatever the level', async () => {
    const el = await fixture('<punica-heading level="1">Totals</punica-heading>');
    expect(getComputedStyle(el).fontSize).toBe('34px');
    el.level = 6;
    await settle();
    expect(getComputedStyle(el).fontSize).toBe('14px');
    el.size = 'xlarge';
    await settle();
    expect(getComputedStyle(el).fontSize).toBe('24px');
    expect(el.internals.ariaLevel).toBe('6');
    el.size = 'red;} * {display:none';
    await settle();
    expect(getComputedStyle(el).fontSize).toBe('14px');
    expect(getComputedStyle(el).display).toBe('block');
  });

  it('truncates to one line and aligns', async () => {
    const wrap = await fixture(
      '<div style="width:80px"><punica-heading truncate align="center">A heading far too long for its box</punica-heading></div>'
    );
    const el = wrap.firstElementChild;
    const cs = getComputedStyle(el);
    expect(cs.textOverflow).toBe('ellipsis');
    expect(cs.whiteSpace).toBe('nowrap');
    expect(cs.textAlign).toBe('center');
    expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
    expect(el.getBoundingClientRect().width).toBe(80);
  });
});
