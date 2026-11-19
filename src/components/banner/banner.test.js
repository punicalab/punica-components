import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import '../button/button.js';
import './banner.js';

contract('punica-banner', {
  html: `<punica-banner color="warning" dismissible>
    Your trial ends in three days.
    <punica-button slot="actions" size="small" variant="outlined" color="neutral">Upgrade</punica-button>
  </punica-banner>`
});

describe('punica-banner', () => {
  afterEach(cleanup);

  it('is its own element, not an alert', async () => {
    const el = await fixture('<punica-banner>x</punica-banner>');
    expect(el.localName).toBe('punica-banner');
    expect(customElements.get('punica-banner')).not.toBe(customElements.get('punica-alert'));
  });

  it('spans the full width with square corners', async () => {
    const wrap = await fixture('<div style="width:700px"><punica-banner>Scheduled maintenance tonight.</punica-banner></div>');
    const el = wrap.firstElementChild;
    expect(el.getBoundingClientRect().width).toBe(700);
    const cs = getComputedStyle(el);
    expect(cs.borderTopLeftRadius).toBe('0px');
    expect(cs.borderInlineStartWidth).toBe('0px');
    expect(cs.borderBottomWidth).toBe('1px');
  });

  it('is status, or alert for an error or a warning', async () => {
    const el = await fixture('<punica-banner>x</punica-banner>');
    expect(el.internals.role).toBe('status');
    el.color = 'error';
    await settle();
    expect(el.internals.role).toBe('alert');
  });

  it('takes an icon and actions in their slots', async () => {
    const el = await fixture(
      '<punica-banner><span slot="icon">!</span>Message<button slot="actions">Details</button></punica-banner>'
    );
    expect(el.shadowRoot.querySelector('slot[name=icon]').assignedElements().length).toBe(1);
    expect(el.shadowRoot.querySelector('slot[name=actions]').assignedElements().length).toBe(1);
    const message = el.shadowRoot.querySelector('.content').getBoundingClientRect();
    expect(el.querySelector('button').getBoundingClientRect().left).toBeGreaterThanOrEqual(message.right);
  });

  it('dismisses with punica-dismiss', async () => {
    const el = await fixture('<punica-banner dismissible label-close="Dismiss">x</punica-banner>');
    const close = el.shadowRoot.querySelector('.close');
    expect(close.getAttribute('aria-label')).toBe('Dismiss');
    const fired = once(el, 'punica-dismiss');
    close.click();
    expect((await fired).detail).toEqual({});
    expect(el.hidden).toBe(true);
  });
});
