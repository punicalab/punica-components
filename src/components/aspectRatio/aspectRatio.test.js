import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './aspectRatio.js';

contract('punica-aspect-ratio', {
  html: '<punica-aspect-ratio ratio="16/9"><div>Preview</div></punica-aspect-ratio>'
});

describe('punica-aspect-ratio', () => {
  afterEach(cleanup);

  const mount = async (ratio) => {
    const wrap = await fixture(
      `<div style="width:320px"><punica-aspect-ratio${ratio == null ? '' : ` ratio="${ratio}"`}><div></div></punica-aspect-ratio></div>`
    );
    return wrap.firstElementChild;
  };

  it('sizes its block from its inline size and the ratio', async () => {
    const el = await mount('16/9');
    expect(el.getBoundingClientRect().height).toBe(180);
    expect(el.firstElementChild.getBoundingClientRect().height).toBe(180);
    el.ratio = '4 / 1';
    await settle();
    expect(el.getBoundingClientRect().height).toBe(80);
    el.ratio = '2';
    await settle();
    expect(el.getBoundingClientRect().height).toBe(160);
  });

  it('is square by default and for a ratio that is not number/number', async () => {
    const el = await mount(null);
    expect(el.getBoundingClientRect().height).toBe(320);
    for (const bad of ['16:9', '0/0', '1/0', 'auto', '1/1;} * {display:none', '"><img src=x onerror=alert(1)>']) {
      el.ratio = bad;
      await settle();
      expect(el.getBoundingClientRect().height, bad).toBe(320);
    }
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.hasAttribute('style')).toBe(false);
  });
});
