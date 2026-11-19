import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup } from '../../../test/contract.js';
import './code.js';

contract('punica-code', { html: '<punica-code>npm test</punica-code>' });

describe('punica-code', () => {
  afterEach(cleanup);

  it('wraps its text in a native code element', async () => {
    const el = await fixture('<punica-code>npm test</punica-code>');
    const code = el.shadowRoot.querySelector('code');
    expect(code.getAttribute('part')).toBe('base');
    expect(code.querySelector('slot').assignedNodes()[0].textContent).toBe('npm test');
    expect(getComputedStyle(el).display).toBe('inline');
  });

  it('shows markup assigned as text as text', async () => {
    const el = await fixture('<punica-code></punica-code>');
    el.textContent = '<img src=x onerror=alert(1)>';
    expect(el.querySelector('img')).toBe(null);
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});
