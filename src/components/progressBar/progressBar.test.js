import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './progressBar.js';

contract('punica-progress-bar', {
  html: '<punica-progress-bar value="40" label="Upload" show-value></punica-progress-bar>'
});
contract('punica-progress-bar', { html: '<punica-progress-bar label="Loading"></punica-progress-bar>' });

describe('punica-progress-bar', () => {
  afterEach(cleanup);

  it('is a progressbar with value, range and text through internals', async () => {
    const el = await fixture('<div lang="en"><punica-progress-bar value="30" max="60" label="Upload"></punica-progress-bar></div>');
    const bar = el.firstElementChild;
    const i = bar.internals;
    expect([i.role, i.ariaLabel, i.ariaValueMin, i.ariaValueMax, i.ariaValueNow, i.ariaValueText]).toEqual([
      'progressbar',
      'Upload',
      '0',
      '60',
      '30',
      '50%'
    ]);
    expect(bar.hasAttribute('role')).toBe(false);
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('fills the track in proportion and clamps to the range', async () => {
    const wrap = await fixture('<div style="width:200px"><punica-progress-bar value="25"></punica-progress-bar></div>');
    const el = wrap.firstElementChild;
    const indicator = el.shadowRoot.querySelector('.indicator');
    indicator.style.transition = 'none';
    expect(indicator.getBoundingClientRect().width).toBe(50);
    el.value = 250;
    await settle();
    expect(indicator.getBoundingClientRect().width).toBe(200);
    expect(el.internals.ariaValueNow).toBe('100');
    el.value = -5;
    await settle();
    expect(indicator.getBoundingClientRect().width).toBe(0);
    expect(el.internals.ariaValueNow).toBe('0');
    el.value = 0;
    await settle();
    expect(el.matches(':state(indeterminate)')).toBe(false);
    expect(el.internals.ariaValueNow).toBe('0');
  });

  it('is indeterminate without a value', async () => {
    const el = await fixture('<punica-progress-bar label="Loading"></punica-progress-bar>');
    expect(el.matches(':state(indeterminate)')).toBe(true);
    expect(el.internals.ariaValueNow).toBe(null);
    expect(el.internals.ariaValueText).toBe(null);
    const indicator = el.shadowRoot.querySelector('.indicator');
    expect(['sweep', 'breathe']).toContain(getComputedStyle(indicator).animationName);
    el.value = 10;
    await settle();
    expect(el.matches(':state(indeterminate)')).toBe(false);
    expect(getComputedStyle(indicator).animationName).toBe('none');
    el.setAttribute('value', 'red;} * {display:none');
    await settle();
    expect(el.value).toBe(null);
    expect(el.matches(':state(indeterminate)')).toBe(true);
  });

  it('shows the percentage in the language of the element', async () => {
    const wrap = await fixture('<div lang="tr"><punica-progress-bar value="45" show-value></punica-progress-bar></div>');
    const el = wrap.firstElementChild;
    const text = el.shadowRoot.querySelector('.value');
    expect(text.hidden).toBe(false);
    expect(text.textContent).toBe(new Intl.NumberFormat('tr', { style: 'percent' }).format(0.45));
    expect(text.textContent).toBe('%45');
    el.showValue = false;
    await settle();
    expect(getComputedStyle(text).display).toBe('none');
  });

  it('reads size and color', async () => {
    const el = await fixture('<punica-progress-bar value="50" size="large" color="success"></punica-progress-bar>');
    expect(el.shadowRoot.querySelector('.track').getBoundingClientRect().height).toBe(8);
    const probe = document.createElement('i');
    probe.style.color = 'var(--punica-color-success)';
    el.after(probe);
    expect(getComputedStyle(el.shadowRoot.querySelector('.indicator')).backgroundColor).toBe(getComputedStyle(probe).color);
  });
});

/** Relative luminance of any CSS colour, read back through a canvas. */
function luminance(color) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('punica-progress-bar track', () => {
  afterEach(cleanup);

  it('keeps every indicator at 3:1 against its track, in light and dark', async () => {
    for (const scheme of ['light', 'dark']) {
      for (const color of ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'neutral']) {
        const wrap = await fixture(`<div style="color-scheme: ${scheme}"><punica-progress-bar value="50" color="${color}"></punica-progress-bar></div>`);
        const root = wrap.firstElementChild.shadowRoot;
        const track = getComputedStyle(root.querySelector('.track')).backgroundColor;
        const indicator = getComputedStyle(root.querySelector('.indicator')).backgroundColor;
        expect(ratio(track, indicator), `${scheme} ${color}`).toBeGreaterThanOrEqual(3);
        cleanup();
      }
    }
  });
});

describe('punica-progress-bar indeterminate sweep', () => {
  afterEach(cleanup);

  for (const dir of ['ltr', 'rtl']) {
    it(`enters at one end and leaves at the other, ${dir}`, async () => {
      const wrap = await fixture(`<div dir="${dir}" style="inline-size: 300px"><punica-progress-bar></punica-progress-bar></div>`);
      const root = wrap.firstElementChild.shadowRoot;
      const track = root.querySelector('.track').getBoundingClientRect();
      const indicator = root.querySelector('.indicator');
      const [animation] = indicator.getAnimations();
      const duration = animation.effect.getComputedTiming().duration;
      animation.pause();
      const at = (t) => {
        animation.currentTime = t;
        return indicator.getBoundingClientRect();
      };
      const start = at(0);
      const end = at(duration - 1);
      // The start is the reading direction's start edge: left in LTR, right in RTL.
      if (dir === 'ltr') {
        expect(start.right).toBeLessThanOrEqual(track.left + 1);
        expect(end.left).toBeGreaterThanOrEqual(track.right - 1);
      } else {
        expect(start.left).toBeGreaterThanOrEqual(track.right - 1);
        expect(end.right).toBeLessThanOrEqual(track.left + 1);
      }
    });
  }
});

