import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup } from '../../../test/contract.js';
import './visuallyHidden.js';

contract('punica-visually-hidden', {
  html: '<punica-visually-hidden>3 unread messages</punica-visually-hidden>'
});

describe('punica-visually-hidden', () => {
  afterEach(cleanup);

  it('takes no room on screen and stays in the accessibility tree', async () => {
    const el = await fixture('<punica-visually-hidden>3 unread messages</punica-visually-hidden>');
    const cs = getComputedStyle(el);
    expect(cs.position).toBe('absolute');
    expect(cs.width).toBe('1px');
    expect(cs.height).toBe('1px');
    expect(cs.clipPath).toBe('inset(50%)');
    expect(cs.display).not.toBe('none');
    expect(cs.visibility).toBe('visible');
    expect(el.textContent).toBe('3 unread messages');
  });

  it('shows a focusable one while focus is inside it', async () => {
    const el = await fixture(
      '<punica-visually-hidden focusable><a href="#main">Skip to content</a></punica-visually-hidden>'
    );
    expect(getComputedStyle(el).position).toBe('absolute');
    el.querySelector('a').focus();
    expect(getComputedStyle(el).position).toBe('static');
    expect(el.getBoundingClientRect().width).toBeGreaterThan(20);
    el.querySelector('a').blur();
    expect(getComputedStyle(el).width).toBe('1px');
  });

  it('never shows without focusable, even when focused inside', async () => {
    const el = await fixture('<punica-visually-hidden><a href="#main">Skip</a></punica-visually-hidden>');
    el.querySelector('a').focus();
    expect(getComputedStyle(el).width).toBe('1px');
  });
});
