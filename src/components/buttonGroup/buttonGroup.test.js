import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import '../button/button.js';
import '../iconButton/iconButton.js';
import '../toggleButton/toggleButton.js';
import './buttonGroup.js';

const html = (attrs = '', variant = 'outlined') => `<punica-button-group label="Text alignment" ${attrs}>
  <punica-button variant="${variant}">Left</punica-button>
  <punica-button variant="${variant}">Center</punica-button>
  <punica-button variant="${variant}">Right</punica-button>
</punica-button-group>`;

const inner = (button) => button.shadowRoot.querySelector('button');
const radii = (button) => {
  const s = getComputedStyle(inner(button));
  return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius];
};

contract('punica-button-group', { html: html() });

describe('punica-button-group', () => {
  afterEach(cleanup);

  it('is created by createElement', () => {
    expect(document.createElement('punica-button-group').attributes.length).toBe(0);
  });

  it('is a named group', async () => {
    const el = await fixture(html());
    expect(el.internals.role).toBe('group');
    expect(el.internals.ariaLabel).toBe('Text alignment');
  });

  it('joins the radii of its buttons', async () => {
    const el = await fixture(html());
    const [a, b, c] = el.querySelectorAll('punica-button');
    expect(radii(a)).toEqual(['8px', '0px', '0px', '8px']);
    expect(radii(b)).toEqual(['0px', '0px', '0px', '0px']);
    expect(radii(c)).toEqual(['0px', '8px', '8px', '0px']);
  });

  it('mirrors the join in RTL', async () => {
    const wrap = await fixture(`<div dir="rtl">${html()}</div>`);
    const [a, , c] = wrap.querySelectorAll('punica-button');
    expect(radii(a)).toEqual(['0px', '8px', '8px', '0px']);
    expect(radii(c)).toEqual(['8px', '0px', '0px', '8px']);
  });

  it('joins top to bottom when vertical', async () => {
    const el = await fixture(html('orientation="vertical"'));
    const [a, b, c] = el.querySelectorAll('punica-button');
    expect(radii(a)).toEqual(['8px', '8px', '0px', '0px']);
    expect(radii(c)).toEqual(['0px', '0px', '8px', '8px']);
    expect(b.getBoundingClientRect().top).toBeGreaterThan(a.getBoundingClientRect().top);
  });

  for (const [tag, attrs] of [
    ['punica-icon-button', 'variant="outlined" label="Bold"'],
    ['punica-toggle-button', 'label="Bold"']
  ]) {
    const group = (extra = '') => `<punica-button-group label="Format" ${extra}>
      <${tag} ${attrs}>B</${tag}><${tag} ${attrs}>I</${tag}><${tag} ${attrs}>U</${tag}>
    </punica-button-group>`;

    it(`joins the radii of ${tag}`, async () => {
      const el = await fixture(group());
      const [a, b, c] = el.querySelectorAll(tag);
      expect(radii(a)).toEqual(['8px', '0px', '0px', '8px']);
      expect(radii(b)).toEqual(['0px', '0px', '0px', '0px']);
      expect(radii(c)).toEqual(['0px', '8px', '8px', '0px']);
      // Bordered buttons share one border.
      expect(Math.round(b.getBoundingClientRect().left - a.getBoundingClientRect().right)).toBe(-1);
    });

    it(`mirrors ${tag} in RTL and stacks it when vertical`, async () => {
      const wrap = await fixture(`<div dir="rtl">${group()}</div>`);
      const [a, , c] = wrap.querySelectorAll(tag);
      expect(radii(a)).toEqual(['0px', '8px', '8px', '0px']);
      expect(radii(c)).toEqual(['8px', '0px', '0px', '8px']);
      cleanup();
      const el = await fixture(group('orientation="vertical"'));
      const [d, e, f] = el.querySelectorAll(tag);
      expect(radii(d)).toEqual(['8px', '8px', '0px', '0px']);
      expect(radii(e)).toEqual(['0px', '0px', '0px', '0px']);
      expect(radii(f)).toEqual(['0px', '0px', '8px', '8px']);
    });

    it(`leaves a single ${tag} whole`, async () => {
      const el = await fixture(
        `<punica-button-group label="One"><${tag} ${attrs}>B</${tag}></punica-button-group>`
      );
      expect(radii(el.querySelector(tag))).toEqual(['8px', '8px', '8px', '8px']);
    });
  }

  it('leaves a single button whole', async () => {
    const el = await fixture(
      '<punica-button-group label="One"><punica-button>Only</punica-button></punica-button-group>'
    );
    expect(radii(el.querySelector('punica-button'))).toEqual(['8px', '8px', '8px', '8px']);
  });

  it('writes no attribute on its buttons', async () => {
    // 1.x copied variant, size, color and disabled onto every child.
    const el = await fixture(html('', 'filled'));
    const before = [...el.querySelectorAll('punica-button')].map((b) => b.getAttributeNames().join());
    el.orientation = 'vertical';
    el.fullWidth = true;
    await settle();
    expect([...el.querySelectorAll('punica-button')].map((b) => b.getAttributeNames().join())).toEqual(before);
    expect(before).toEqual(['variant', 'variant', 'variant']);
  });

  it('overlaps outlined borders and keeps every button in the tab order', async () => {
    const el = await fixture(html());
    const [a, b] = el.querySelectorAll('punica-button');
    expect(Math.round(b.getBoundingClientRect().left - a.getBoundingClientRect().right)).toBe(-1);
    b.focus();
    expect(document.activeElement).toBe(b);
  });

  it('fills its container with full-width', async () => {
    const wrap = await fixture(`<div style="width:300px">${html('full-width')}</div>`);
    const el = wrap.querySelector('punica-button-group');
    expect(Math.round(el.getBoundingClientRect().width)).toBe(300);
  });
});
