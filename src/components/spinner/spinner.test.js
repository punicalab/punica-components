import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './spinner.js';

contract('punica-spinner', { html: '<punica-spinner label="Loading invoices"></punica-spinner>' });

describe('punica-spinner', () => {
  afterEach(cleanup);

  it('is an indeterminate progressbar with a name', async () => {
    const el = await fixture('<punica-spinner></punica-spinner>');
    expect(el.internals.role).toBe('progressbar');
    expect(el.internals.ariaLabel).toBe('Loading');
    expect(el.internals.ariaValueNow).toBe(null);
    el.label = 'Saving';
    await settle();
    expect(el.internals.ariaLabel).toBe('Saving');
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('is hidden from assistive technology when decorative', async () => {
    const el = await fixture('<punica-spinner decorative></punica-spinner>');
    expect(el.internals.role).toBe(null);
    expect(el.internals.ariaHidden).toBe('true');
    el.decorative = false;
    await settle();
    expect(el.internals.role).toBe('progressbar');
    expect(el.internals.ariaHidden).toBe(null);
  });

  it('sizes by name and turns', async () => {
    const el = await fixture('<punica-spinner></punica-spinner>');
    expect(el.getBoundingClientRect().width).toBe(24);
    const ring = el.shadowRoot.querySelector('.ring');
    expect(['spin', 'breathe']).toContain(getComputedStyle(ring).animationName);
    el.size = 'small';
    await settle();
    expect(el.getBoundingClientRect().height).toBe(16);
    el.size = 'large';
    await settle();
    expect(el.getBoundingClientRect().width).toBe(40);
    el.size = '9px;} * {display:none';
    await settle();
    expect(el.getBoundingClientRect().width).toBe(24);
  });

  it('declares a reduced-motion fallback that does not rotate', () => {
    const sheets = customElements.get('punica-spinner')._sheets();
    const rules = sheets.flatMap((s) => [...s.cssRules]);
    const reduced = rules.find((r) => r instanceof CSSMediaRule && r.conditionText.includes('prefers-reduced-motion'));
    expect(reduced.cssRules[0].style.animationName).toBe('breathe');
  });
});
