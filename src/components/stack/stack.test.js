import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './stack.js';

contract('punica-stack', { html: '<punica-stack gap="16"><p>One</p><p>Two</p></punica-stack>' });

describe('punica-stack', () => {
  afterEach(cleanup);

  it('gives a child marked grow the space the others leave', async () => {
    const el = await fixture(
      '<punica-stack direction="horizontal" style="inline-size:300px"><span grow>a</span><span style="inline-size:60px">b</span></punica-stack>'
    );
    const [grown, fixed] = el.children;
    expect(Math.round(fixed.getBoundingClientRect().width)).toBe(60);
    expect(Math.round(grown.getBoundingClientRect().width)).toBe(300 - 60 - 8);
  });

  it('stacks vertically with an 8px gap by default', async () => {
    const el = await fixture('<punica-stack><div>a</div><div>b</div></punica-stack>');
    const cs = getComputedStyle(el);
    expect(cs.display).toBe('flex');
    expect(cs.flexDirection).toBe('column');
    expect(cs.rowGap).toBe('8px');
  });

  it('reads direction, align, justify and wrap', async () => {
    const el = await fixture(
      '<punica-stack direction="horizontal" align="center" justify="between" wrap><div>a</div><div>b</div></punica-stack>'
    );
    const cs = getComputedStyle(el);
    expect(cs.flexDirection).toBe('row');
    expect(cs.alignItems).toBe('center');
    expect(cs.justifyContent).toBe('space-between');
    expect(cs.flexWrap).toBe('wrap');
  });

  it('takes gap from the spacing scale and nothing else', async () => {
    const el = await fixture('<punica-stack gap="24"><div>a</div><div>b</div></punica-stack>');
    expect(getComputedStyle(el).columnGap).toBe('24px');
    el.gap = 13;
    await settle();
    expect(getComputedStyle(el).columnGap).toBe('8px');
    el.setAttribute('gap', '4px;} * {display:none');
    await settle();
    expect(getComputedStyle(el).columnGap).toBe('8px');
    expect(getComputedStyle(el.firstElementChild).display).toBe('block');
    expect(el.hasAttribute('style')).toBe(false);
  });

  it('draws a line between children with divider', async () => {
    const el = await fixture('<punica-stack divider gap="16"><div>a</div><div>b</div></punica-stack>');
    expect(getComputedStyle(el.children[0]).borderTopWidth).toBe('0px');
    expect(getComputedStyle(el.children[1]).borderTopWidth).toBe('1px');
    expect(getComputedStyle(el.children[1]).paddingTop).toBe('16px');
    el.direction = 'horizontal';
    await settle();
    expect(getComputedStyle(el.children[1]).borderTopWidth).toBe('0px');
    expect(getComputedStyle(el.children[1]).borderInlineStartWidth).toBe('1px');
  });
});

describe('align attribute and text', () => {
  afterEach(cleanup);

  it('does not change the alignment of the text inside', async () => {
    const wrap = await fixture('<div style="text-align: center"><punica-stack align="end"><span>Text</span></punica-stack></div>');
    expect(getComputedStyle(wrap.firstElementChild).textAlign).toBe('center');
  });
});
