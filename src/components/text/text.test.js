import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './text.js';

contract('punica-text', { html: '<punica-text variant="caption">Updated two minutes ago</punica-text>' });

const long = 'A long sentence that is repeated to fill several lines of a narrow box. '.repeat(6);

describe('punica-text', () => {
  afterEach(cleanup);

  it('is inline body text by default and a block when asked', async () => {
    const el = await fixture('<punica-text>Body</punica-text>');
    const cs = getComputedStyle(el);
    expect(cs.display).toBe('inline');
    expect(cs.fontSize).toBe('16px');
    el.block = true;
    await settle();
    expect(getComputedStyle(el).display).toBe('block');
  });

  it('draws the fixed-width face with mono, and none of code\'s box', async () => {
    const el = await fixture('<punica-text mono>extension-database</punica-text>');
    const cs = getComputedStyle(el);
    expect(cs.fontFamily).toMatch(/mono/i);
    expect(cs.paddingInlineStart).toBe('0px');
    expect(cs.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(cs.fontSize).toBe('16px');
  });

  it('sets italics and tabular figures when asked', async () => {
    const el = await fixture('<punica-text italic tabular>12:04</punica-text>');
    const cs = getComputedStyle(el);
    expect(cs.fontStyle).toBe('italic');
    expect(cs.fontVariantNumeric).toBe('tabular-nums');
  });

  it('reads variant, size, weight, color and align', async () => {
    const el = await fixture('<punica-text variant="overline" weight="bold" color="error" align="end">x</punica-text>');
    let cs = getComputedStyle(el);
    expect(cs.fontSize).toBe('12px');
    expect(cs.textTransform).toBe('uppercase');
    expect(cs.fontWeight).toBe('700');
    expect(cs.textAlign).toBe('end');
    expect(cs.display).toBe('block');
    const probe = document.createElement('span');
    probe.style.color = 'var(--punica-color-error)';
    el.after(probe);
    expect(cs.color).toBe(getComputedStyle(probe).color);
    el.size = 'large';
    el.variant = 'code';
    await settle();
    cs = getComputedStyle(el);
    expect(cs.fontSize).toBe('18px');
    expect(cs.fontFamily).toContain('monospace');
  });

  it('clamps to the number of lines in truncate', async () => {
    const wrap = await fixture(`<div style="width:200px"><punica-text truncate="2">${long}</punica-text></div>`);
    const el = wrap.firstElementChild;
    const line = parseFloat(getComputedStyle(el).lineHeight);
    expect(Math.round(el.getBoundingClientRect().height)).toBe(Math.round(line * 2));
    el.truncate = '3';
    await settle();
    expect(Math.round(el.getBoundingClientRect().height)).toBe(Math.round(line * 3));
    el.truncate = '';
    await settle();
    expect(Math.round(el.getBoundingClientRect().height)).toBe(Math.round(line));
    el.truncate = null;
    await settle();
    expect(el.getBoundingClientRect().height).toBeGreaterThan(line * 4);
  });

  it('never lets truncate reach a stylesheet (1.x wrote it into a <style>)', async () => {
    const wrap = await fixture(`<div style="width:200px"><punica-text block>${long}</punica-text></div>`);
    const el = wrap.firstElementChild;
    const full = el.getBoundingClientRect().height;
    for (const bad of ['2;} * {display:none', 'red;} :host{display:none}', '"><img src=x onerror=alert(1)>', '-1', '0', '2.5', '1e3']) {
      el.setAttribute('truncate', bad);
      await settle();
      expect(el.getBoundingClientRect().height, bad).toBe(full);
      expect(getComputedStyle(el).display).toBe('block');
      expect(getComputedStyle(wrap).display).toBe('block');
    }
    expect(el.shadowRoot.querySelector('style, img')).toBe(null);
    expect(el.shadowRoot.querySelectorAll('*').length).toBe(1);
    expect(el.hasAttribute('style')).toBe(false);
  });
});
