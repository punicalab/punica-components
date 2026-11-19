import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { page } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './hidden.js';

contract('punica-hidden', { html: '<punica-hidden below="sm"><p>Wide screens only</p></punica-hidden>' });

describe('punica-hidden', () => {
  afterEach(cleanup);
  afterAll(() => page.viewport(1024, 768));

  const shown = (el) => getComputedStyle(el).display !== 'none';

  it('hides above, below and only at a breakpoint as the viewport changes', async () => {
    const wrap = await fixture(`<div>
      <punica-hidden above="md">a</punica-hidden>
      <punica-hidden below="md">b</punica-hidden>
      <punica-hidden only="md">c</punica-hidden>
      <punica-hidden only="xs">d</punica-hidden>
      <punica-hidden>e</punica-hidden>
    </div>`);
    const [above, below, only, onlyXs, plain] = wrap.children;

    await page.viewport(500, 600);
    await settle();
    expect([above, below, only, onlyXs, plain].map(shown)).toEqual([true, false, true, false, true]);

    await page.viewport(1000, 600);
    await settle();
    expect([above, below, only, onlyXs, plain].map(shown)).toEqual([false, true, false, true, true]);

    await page.viewport(1300, 600);
    await settle();
    expect([above, below, only, onlyXs, plain].map(shown)).toEqual([false, true, true, true, true]);
  });

  it('follows an attribute change with no listener of its own (1.x observed breakPoint, which never fired)', async () => {
    await page.viewport(1000, 600);
    const el = await fixture('<punica-hidden above="lg">x</punica-hidden>');
    expect(shown(el)).toBe(true);
    el.above = 'sm';
    await settle();
    expect(shown(el)).toBe(false);
    el.above = null;
    el.below = 'xl';
    await settle();
    expect(shown(el)).toBe(false);
  });

  it('generates no box of its own while showing', async () => {
    const el = await fixture('<punica-hidden><span>x</span></punica-hidden>');
    expect(getComputedStyle(el).display).toBe('contents');
    expect(el.shadowRoot.querySelectorAll('*').length).toBe(1);
  });
});
