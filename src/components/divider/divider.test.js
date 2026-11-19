import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './divider.js';

contract('punica-divider', { html: '<div><p>Above</p><punica-divider></punica-divider><p>Below</p></div>' });
contract('punica-divider', { html: '<punica-divider>or</punica-divider>' });

describe('punica-divider', () => {
  afterEach(cleanup);

  it('is a horizontal separator drawn as one line', async () => {
    const wrap = await fixture('<div style="width:200px"><punica-divider></punica-divider></div>');
    const el = wrap.firstElementChild;
    expect(el.internals.role).toBe('separator');
    expect(el.internals.ariaOrientation).toBe('horizontal');
    expect(el.hasAttribute('role')).toBe(false);
    const lines = el.shadowRoot.querySelectorAll('.line');
    expect(getComputedStyle(lines[0]).borderTopWidth).toBe('1px');
    expect(lines[0].getBoundingClientRect().width).toBe(200);
    expect(getComputedStyle(lines[1]).display).toBe('none');
  });

  it('follows orientation (1.x observed camelCase flexItem and never reacted)', async () => {
    const wrap = await fixture(
      '<div style="display:flex;height:40px"><span>a</span><punica-divider orientation="vertical"></punica-divider><span>b</span></div>'
    );
    const el = wrap.querySelector('punica-divider');
    expect(el.internals.ariaOrientation).toBe('vertical');
    const line = el.shadowRoot.querySelector('.line');
    expect(getComputedStyle(line).borderInlineStartWidth).toBe('1px');
    expect(getComputedStyle(line).borderTopWidth).toBe('0px');
    expect(el.getBoundingClientRect().height).toBe(40);
    el.orientation = 'horizontal';
    await settle();
    expect(el.internals.ariaOrientation).toBe('horizontal');
    expect(getComputedStyle(line).borderTopWidth).toBe('1px');
  });

  it('is presentation when decorative', async () => {
    const el = await fixture('<punica-divider decorative></punica-divider>');
    expect(el.internals.role).toBe('presentation');
    expect(el.internals.ariaOrientation).toBe(null);
    el.decorative = false;
    await settle();
    expect(el.internals.role).toBe('separator');
  });

  it('shows a label between two lines and names the separator with it', async () => {
    const wrap = await fixture('<div style="width:300px"><punica-divider>or</punica-divider></div>');
    const el = wrap.firstElementChild;
    await settle();
    const [first, second] = el.shadowRoot.querySelectorAll('.line');
    expect(getComputedStyle(second).display).toBe('block');
    expect(first.getBoundingClientRect().width).toBeGreaterThan(100);
    expect(Math.abs(first.getBoundingClientRect().width - second.getBoundingClientRect().width)).toBeLessThan(1);
    expect(el.internals.ariaLabel).toBe('or');
    el.textContent = '';
    await settle();
    expect(getComputedStyle(second).display).toBe('none');
    expect(el.internals.ariaLabel).toBe(null);
  });

  it('indents with inset', async () => {
    const wrap = await fixture('<div style="width:200px"><punica-divider inset></punica-divider></div>');
    expect(wrap.firstElementChild.getBoundingClientRect().width).toBe(168);
  });
});
