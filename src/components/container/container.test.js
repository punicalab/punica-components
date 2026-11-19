import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './container.js';

contract('punica-container', { html: '<punica-container max-width="md"><p>Content</p></punica-container>' });

describe('punica-container', () => {
  afterEach(cleanup);

  it('centres itself and caps its inline size by name', async () => {
    const wrap = await fixture('<div style="width:2000px"><punica-container max-width="sm">x</punica-container></div>');
    const el = wrap.firstElementChild;
    expect(getComputedStyle(el).maxWidth).toBe('600px');
    const box = el.getBoundingClientRect();
    const outer = wrap.getBoundingClientRect();
    expect(box.width).toBe(600);
    expect(Math.round(box.left - outer.left)).toBe(700);
    el.maxWidth = 'md';
    await settle();
    expect(getComputedStyle(el).maxWidth).toBe('900px');
    el.maxWidth = 'full';
    await settle();
    expect(getComputedStyle(el).maxWidth).toBe('none');
    el.maxWidth = null;
    await settle();
    expect(getComputedStyle(el).maxWidth).toBe('1200px');
  });

  it('pads its inline edges unless gutters is none', async () => {
    const el = await fixture('<punica-container>x</punica-container>');
    expect(['16px', '24px']).toContain(getComputedStyle(el).paddingInlineStart);
    el.gutters = 'none';
    await settle();
    expect(getComputedStyle(el).paddingInlineStart).toBe('0px');
    el.gutters = 'large';
    await settle();
    expect(getComputedStyle(el).paddingInlineEnd).toBe('32px');
  });

  it('ignores a max-width it does not know', async () => {
    const el = await fixture('<punica-container>x</punica-container>');
    el.setAttribute('max-width', '10px;} * {display:none');
    await settle();
    expect(getComputedStyle(el).maxWidth).toBe('1200px');
    expect(getComputedStyle(el).display).toBe('block');
  });
});
