import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './kbd.js';

contract('punica-kbd', { html: '<p>Press <punica-kbd keys="Mod+K"></punica-kbd> to search</p>' });
contract('punica-kbd', { html: '<punica-kbd>Esc</punica-kbd>' });

/** Makes the platform read as `name` until the returned function is called. */
function platform(name) {
  Object.defineProperty(navigator, 'userAgentData', { value: { platform: name }, configurable: true });
  return () => delete navigator.userAgentData;
}

const keys = (el) => [...el.shadowRoot.querySelectorAll('.keys kbd')].map((k) => k.textContent);

describe('punica-kbd', () => {
  afterEach(cleanup);

  it('splits keys into one native kbd each inside a native kbd', async () => {
    const restore = platform('Windows');
    try {
      const el = await fixture('<punica-kbd keys="Ctrl + Shift+K"></punica-kbd>');
      expect(el.shadowRoot.querySelector('[part=base]').localName).toBe('kbd');
      expect(keys(el)).toEqual(['Ctrl', 'Shift', 'K']);
      expect(el.shadowRoot.querySelector('.own').hidden).toBe(true);
      el.keys = 'Ctrl++';
      await settle();
      expect(keys(el)).toEqual(['Ctrl', '+']);
      el.keys = null;
      await settle();
      expect(keys(el)).toEqual([]);
      expect(el.shadowRoot.querySelector('.own').hidden).toBe(false);
    } finally {
      restore();
    }
  });

  it('reads Mod as the platform does, on every connect', async () => {
    let restore = platform('Windows');
    const el = await fixture('<punica-kbd keys="Mod+K"></punica-kbd>');
    expect(keys(el)).toEqual(['Ctrl', 'K']);
    el.labelMod = 'Strg';
    await settle();
    expect(keys(el)).toEqual(['Strg', 'K']);
    restore();

    restore = platform('macOS');
    try {
      const parent = el.parentElement;
      el.remove();
      parent.appendChild(el);
      await settle();
      expect(keys(el)).toEqual(['⌘', 'K']);
      const fresh = await fixture('<punica-kbd keys="mod+Enter"></punica-kbd>');
      expect(keys(fresh)).toEqual(['⌘', 'Enter']);
    } finally {
      restore();
    }
  });

  it('shows one slotted key as a kbd', async () => {
    const el = await fixture('<punica-kbd>Esc</punica-kbd>');
    const own = el.shadowRoot.querySelector('.own');
    expect(own.localName).toBe('kbd');
    expect(getComputedStyle(own).borderTopWidth).toBe('1px');
    expect(getComputedStyle(own).fontFamily).toContain('monospace');
  });

  it('writes keys as text, never as markup', async () => {
    const el = await fixture('<punica-kbd></punica-kbd>');
    el.keys = '"><img src=x onerror=alert(1)>+<b>K</b>';
    await settle();
    expect(el.shadowRoot.querySelector('img, b')).toBe(null);
    expect(keys(el)).toEqual(['"><img src=x onerror=alert(1)>', '<b>K</b>']);
  });
});
