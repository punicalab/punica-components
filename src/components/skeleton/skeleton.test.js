import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './skeleton.js';

contract('punica-skeleton', { html: '<punica-skeleton lines="3"></punica-skeleton>' });
contract('punica-skeleton', { html: '<punica-skeleton variant="circle"></punica-skeleton>' });

const bars = (el) => [...el.shadowRoot.querySelectorAll('.line')];

describe('punica-skeleton', () => {
  afterEach(cleanup);

  it('is hidden from assistive technology', async () => {
    const el = await fixture('<punica-skeleton></punica-skeleton>');
    expect(el.internals.ariaHidden).toBe('true');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('draws one bar per line, the last one shorter', async () => {
    const wrap = await fixture('<div style="width:200px"><punica-skeleton lines="3"></punica-skeleton></div>');
    const el = wrap.firstElementChild;
    expect(bars(el).map((b) => b.getBoundingClientRect().width)).toEqual([200, 200, 120]);
    el.lines = 1;
    await settle();
    expect(bars(el).map((b) => b.getBoundingClientRect().width)).toEqual([200]);
    for (const bad of [0, -3, 51, 2.5, 1e9]) {
      el.lines = bad;
      await settle();
      expect(bars(el).length, String(bad)).toBe(1);
    }
    el.lines = 4;
    el.variant = 'rect';
    await settle();
    expect(bars(el).length).toBe(1);
  });

  it('shapes a circle and a rectangle', async () => {
    const el = await fixture('<punica-skeleton variant="circle"></punica-skeleton>');
    let box = el.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([40, 40]);
    expect(getComputedStyle(bars(el)[0]).borderTopLeftRadius).toBe('50%');
    expect(bars(el)[0].getBoundingClientRect().height).toBe(40);
    el.variant = 'rect';
    el.width = '120px';
    el.height = '2rem';
    await settle();
    box = el.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([120, 32]);
    expect(bars(el)[0].getBoundingClientRect().height).toBe(32);
  });

  it('takes width and height only as CSS lengths', async () => {
    const wrap = await fixture('<div style="width:200px"><punica-skeleton width="50%" height="20px"></punica-skeleton></div>');
    const el = wrap.firstElementChild;
    expect(el.getBoundingClientRect().width).toBe(100);
    expect(el.getBoundingClientRect().height).toBe(20);
    expect(bars(el)[0].getBoundingClientRect().height).toBe(20);
    for (const bad of [
      'red;} * {display:none',
      '10px;} :host{display:none}',
      '10px} * {display:none} :host{',
      '"><img src=x onerror=alert(1)>',
      '10px /* x */',
      'url(javascript:alert(1))',
      'blue',
      '10'
    ]) {
      el.setAttribute('width', bad);
      await settle();
      expect(el.getBoundingClientRect().width, bad).toBe(200);
      expect(getComputedStyle(el).display).toBe('block');
      expect(getComputedStyle(wrap).display).toBe('block');
    }
    expect(el.shadowRoot.querySelector('style, img')).toBe(null);
    expect(el.hasAttribute('style')).toBe(false);
    el.width = 'calc(100% - 50px)';
    await settle();
    expect(el.getBoundingClientRect().width).toBe(150);
  });

  it('shimmers, and the stylesheet stops it under reduced motion', async () => {
    const el = await fixture('<punica-skeleton></punica-skeleton>');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    expect(getComputedStyle(bars(el)[0]).animationName).toBe(reduced ? 'none' : 'shimmer');
    const rules = customElements.get('punica-skeleton')._sheets().flatMap((s) => [...s.cssRules]);
    const rule = rules.find((r) => r instanceof CSSMediaRule && r.conditionText.includes('prefers-reduced-motion'));
    expect(rule.cssRules[0].style.animationName).toBe('none');
  });
});
