import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './statusDot.js';

contract('punica-status-dot', { html: '<punica-status-dot color="success" label="Running"></punica-status-dot>' });
contract('punica-status-dot', { html: '<p><punica-status-dot color="error"></punica-status-dot> Failed</p>' });

describe('punica-status-dot', () => {
  afterEach(cleanup);

  it('is a 6px disc in the colour of its state', async () => {
    const wrap = await fixture('<div><punica-status-dot color="success"></punica-status-dot><i style="color:var(--punica-color-success)"></i></div>');
    const el = wrap.firstElementChild;
    const box = el.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([6, 6]);
    const dot = getComputedStyle(el.shadowRoot.querySelector('.dot'));
    expect(parseFloat(dot.borderTopLeftRadius)).toBeGreaterThanOrEqual(3);
    expect(dot.backgroundColor).toBe(getComputedStyle(wrap.lastElementChild).color);
    el.color = 'red;} * {display:none';
    await settle();
    expect(getComputedStyle(el).display).toBe('inline-block');
  });

  it('is an image with a name when labelled and hidden otherwise', async () => {
    const el = await fixture('<punica-status-dot label="Running"></punica-status-dot>');
    expect(el.internals.role).toBe('img');
    expect(el.internals.ariaLabel).toBe('Running');
    el.label = null;
    await settle();
    expect(el.internals.role).toBe(null);
    expect(el.internals.ariaHidden).toBe('true');
  });

  it('pulses only with pulse', async () => {
    const el = await fixture('<punica-status-dot></punica-status-dot>');
    const dot = el.shadowRoot.querySelector('.dot');
    expect(getComputedStyle(dot, '::after').content).toBe('none');
    el.pulse = true;
    await settle();
    expect(getComputedStyle(dot, '::after').animationName).toBe('pulse');
  });
});
