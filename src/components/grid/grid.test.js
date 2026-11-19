import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './row.js';
import './col.js';

const html = `<punica-row spacing="2">
  <punica-col xs="12" md="6"><p>One</p></punica-col>
  <punica-col xs="12" md="6"><p>Two</p></punica-col>
</punica-row>`;

contract('punica-row', { html });
contract('punica-col', { html: '<punica-row><punica-col xs="6">Half</punica-col></punica-row>' });

describe('punica-row and punica-col', () => {
  afterEach(cleanup);

  const mount = async (width, inner, attrs = '') => {
    const wrap = await fixture(`<div style="width:${width}px"><punica-row ${attrs}>${inner}</punica-row></div>`);
    await settle();
    return wrap.firstElementChild;
  };
  const widths = (row) => [...row.children].map((c) => Math.round(c.getBoundingClientRect().width));

  it('gives each column its share of the 12 columns', async () => {
    const row = await mount(1200, '<punica-col xs="6">a</punica-col><punica-col xs="4">b</punica-col><punica-col xs="2">c</punica-col>');
    expect(widths(row)).toEqual([600, 400, 200]);
    const tops = [...row.children].map((c) => c.getBoundingClientRect().top);
    expect(new Set(tops).size).toBe(1);
  });

  it('takes the gap out of the columns so a full line still fits', async () => {
    const row = await mount(1200, '<punica-col xs="6">a</punica-col><punica-col xs="6">b</punica-col>', 'spacing="3"');
    expect(getComputedStyle(row).columnGap).toBe('24px');
    expect(getComputedStyle(row).rowGap).toBe('24px');
    expect(widths(row)).toEqual([588, 588]);
    const [a, b] = row.children;
    expect(a.getBoundingClientRect().top).toBe(b.getBoundingClientRect().top);
    row.columnSpacing = 1;
    row.rowSpacing = 5;
    await settle();
    expect(getComputedStyle(row).columnGap).toBe('8px');
    expect(getComputedStyle(row).rowGap).toBe('40px');
    expect(widths(row)).toEqual([596, 596]);
  });

  it('answers to the breakpoints of the row, not of the viewport', async () => {
    const inner = '<punica-col xs="12" sm="6" md="4" lg="3" xl="2">a</punica-col>';
    expect(widths(await mount(500, inner))).toEqual([500]);
    expect(widths(await mount(600, inner))).toEqual([300]);
    expect(widths(await mount(900, inner))).toEqual([300]);
    expect(widths(await mount(1200, inner))).toEqual([300]);
    expect(widths(await mount(1560, inner))).toEqual([260]);
  });

  it('keeps a span from its breakpoint up', async () => {
    const row = await mount(1300, '<punica-col xs="12" sm="6">a</punica-col>');
    expect(widths(row)).toEqual([650]);
  });

  it('shares what is left between columns with no span', async () => {
    const row = await mount(1200, '<punica-col xs="6">a</punica-col><punica-col>b</punica-col><punica-col>c</punica-col>');
    expect(widths(row)).toEqual([600, 300, 300]);
  });

  it('does not leak a span into a nested column', async () => {
    const row = await mount(
      1200,
      '<punica-col xs="6"><punica-row><punica-col id="inner">a</punica-col></punica-row></punica-col>'
    );
    expect(Math.round(row.querySelector('#inner').getBoundingClientRect().width)).toBe(600);
  });

  it('reads direction, justify, align and wrap as keywords', async () => {
    const row = await mount(600, '<punica-col xs="3">a</punica-col>', 'direction="row-reverse" justify="center" align="end" wrap="nowrap"');
    const cs = getComputedStyle(row);
    expect(cs.flexDirection).toBe('row-reverse');
    expect(cs.justifyContent).toBe('center');
    expect(cs.alignItems).toMatch(/end$/);
    expect(cs.flexWrap).toBe('nowrap');
    row.direction = 'column';
    row.wrap = null;
    await settle();
    expect(getComputedStyle(row).flexDirection).toBe('column');
    expect(getComputedStyle(row).flexWrap).toBe('wrap');
  });

  it('never lets an attribute value reach a stylesheet (1.x wrote them into <style> text)', async () => {
    const row = await mount(1200, '<punica-col xs="6">a</punica-col><punica-col xs="6">b</punica-col>');
    const col = row.firstElementChild;
    for (const bad of ['red;} * {display:none', '1;} :host{display:none', '"><img src=x onerror=alert(1)>', '-1', '65', '1e9', 'Infinity']) {
      row.setAttribute('spacing', bad);
      row.setAttribute('direction', bad);
      row.setAttribute('justify', bad);
      col.setAttribute('xs', bad);
      await settle();
      expect(getComputedStyle(row).columnGap, bad).toBe('0px');
      expect(getComputedStyle(row).display).toBe('flex');
      expect(getComputedStyle(row).flexDirection).toBe('row');
      expect(getComputedStyle(col).display).toBe('block');
    }
    expect(row.shadowRoot.querySelector('style, img')).toBe(null);
    expect(col.shadowRoot.querySelector('style, img')).toBe(null);
    expect(row.hasAttribute('style')).toBe(false);
    expect(col.hasAttribute('style')).toBe(false);
    col.xs = 6;
    row.spacing = 2;
    await settle();
    expect(widths(row)).toEqual([592, 592]);
  });
});

describe('align attribute and text', () => {
  afterEach(cleanup);

  it('does not change the alignment of the text inside', async () => {
    const wrap = await fixture('<div style="text-align: center"><punica-row align="end"><punica-col>Text</punica-col></punica-row></div>');
    expect(getComputedStyle(wrap.firstElementChild).textAlign).toBe('center');
  });
});
