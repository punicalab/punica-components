import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './center.js';

contract('punica-center', { html: '<punica-center><p>Centred</p></punica-center>' });

describe('punica-center', () => {
  afterEach(cleanup);

  it('puts its child in the middle on both axes', async () => {
    const wrap = await fixture(
      '<div style="width:200px"><punica-center style="height:100px"><div style="width:40px;height:20px"></div></punica-center></div>'
    );
    const el = wrap.firstElementChild;
    const outer = el.getBoundingClientRect();
    const inner = el.firstElementChild.getBoundingClientRect();
    expect(Math.round(inner.left - outer.left)).toBe(80);
    expect(Math.round(inner.top - outer.top)).toBe(40);
  });

  it('centres on one axis and lays out inline when asked', async () => {
    const wrap = await fixture(
      '<div style="width:200px"><punica-center axis="inline" style="height:100px"><div style="width:40px"></div></punica-center></div>'
    );
    const el = wrap.firstElementChild;
    expect(getComputedStyle(el).justifyContent).toBe('center');
    expect(getComputedStyle(el).alignItems).toBe('normal');
    el.axis = 'block';
    el.inline = true;
    await settle();
    expect(getComputedStyle(el).justifyContent).toBe('normal');
    expect(getComputedStyle(el).alignItems).toBe('center');
    expect(getComputedStyle(el).display).toBe('inline-flex');
  });
});
