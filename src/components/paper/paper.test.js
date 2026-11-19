import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './paper.js';

contract('punica-paper', { html: '<punica-paper elevation="2">Content</punica-paper>' });

describe('punica-paper', () => {
  afterEach(cleanup);

  it('has a surface background, a radius and the default padding', async () => {
    const el = await fixture('<punica-paper>x</punica-paper>');
    const cs = getComputedStyle(el);
    expect(cs.paddingTop).toBe('16px');
    expect(cs.borderTopLeftRadius).toBe('8px');
    expect(cs.boxShadow).toBe('none');
    expect(cs.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('maps elevation 0-5 to the shadow tokens', async () => {
    const el = await fixture('<punica-paper elevation="3">x</punica-paper>');
    const three = getComputedStyle(el).boxShadow;
    expect(three).not.toBe('none');
    el.elevation = 5;
    await settle();
    expect(getComputedStyle(el).boxShadow).not.toBe(three);
    el.elevation = 9;
    await settle();
    expect(getComputedStyle(el).boxShadow).toBe('none');
  });

  it('outlined draws a border and no shadow', async () => {
    const el = await fixture('<punica-paper variant="outlined" elevation="4" radius="none">x</punica-paper>');
    const cs = getComputedStyle(el);
    expect(cs.boxShadow).toBe('none');
    expect(cs.borderTopWidth).toBe('1px');
    expect(cs.borderTopLeftRadius).toBe('0px');
  });

  it('takes padding from the spacing scale only', async () => {
    const el = await fixture('<punica-paper padding="32">x</punica-paper>');
    expect(getComputedStyle(el).paddingTop).toBe('32px');
    el.setAttribute('padding', '0;} * {display:none');
    await settle();
    expect(getComputedStyle(el).paddingTop).toBe('16px');
    expect(el.hasAttribute('style')).toBe(false);
  });

  it('holds one slot however often it is connected', async () => {
    const el = await fixture('<punica-paper>x</punica-paper>');
    const parent = el.parentElement;
    el.remove();
    parent.appendChild(el);
    expect(el.shadowRoot.querySelectorAll('slot').length).toBe(1);
  });
});

describe('punica-paper elevation', () => {
  afterEach(cleanup);

  it('lifts a raised paper onto the raised surface in dark mode', async () => {
    const wrap = await fixture(
      '<div style="color-scheme: dark"><punica-paper>Flat</punica-paper><punica-paper elevation="2">Raised</punica-paper><punica-paper elevation="2" variant="outlined">Outlined</punica-paper></div>'
    );
    const [flat, raised, outlined] = [...wrap.children].map((c) => getComputedStyle(c).backgroundColor);
    expect(raised).not.toBe(flat);
    expect(outlined).toBe(flat);
  });
});
