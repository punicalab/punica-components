import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './box.js';

contract('punica-box', { html: '<punica-box border rounded padding="16">Content</punica-box>' });

describe('punica-box', () => {
  afterEach(cleanup);

  it('draws border, radius and size from its attributes', async () => {
    const wrap = await fixture(
      '<div style="width:300px;height:200px"><punica-box border rounded full-width full-height>x</punica-box></div>'
    );
    const el = wrap.firstElementChild;
    const cs = getComputedStyle(el);
    expect(cs.borderTopWidth).toBe('1px');
    expect(cs.borderTopLeftRadius).toBe('8px');
    expect(cs.width).toBe('300px');
    expect(cs.height).toBe('200px');
    expect(el.fullWidth).toBe(true);
  });

  it('takes padding from the spacing scale and ignores anything else', async () => {
    const el = await fixture('<punica-box padding="16">x</punica-box>');
    expect(getComputedStyle(el).paddingTop).toBe('16px');
    el.padding = 24;
    await settle();
    expect(getComputedStyle(el).paddingInlineStart).toBe('24px');
    el.padding = 17;
    await settle();
    expect(getComputedStyle(el).paddingTop).toBe('0px');
    el.setAttribute('padding', '16px;} * {display:none');
    await settle();
    expect(el.padding).toBe(null);
    expect(getComputedStyle(el).paddingTop).toBe('0px');
    expect(getComputedStyle(el).display).toBe('block');
  });

  it('never writes an inline style on the host', async () => {
    const el = await fixture('<punica-box padding="8" border>x</punica-box>');
    expect(el.hasAttribute('style')).toBe(false);
  });

  it('holds one slot however often it is connected (1.x appended its template on every connect)', async () => {
    const el = await fixture('<punica-box>x</punica-box>');
    const parent = el.parentElement;
    el.remove();
    parent.appendChild(el);
    el.remove();
    parent.appendChild(el);
    expect(el.shadowRoot.querySelectorAll('slot').length).toBe(1);
  });
});
