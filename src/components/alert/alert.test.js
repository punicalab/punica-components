import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import '../button/button.js';
import alertStyles from './alert.css';
import './alert.js';

contract('punica-alert', { html: '<punica-alert color="success">The invoice was sent.</punica-alert>' });
contract('punica-alert', {
  html: `<punica-alert color="error" dismissible>
    Sending failed.
    <punica-button slot="actions" variant="outlined" color="neutral" size="small">Retry</punica-button>
  </punica-alert>`
});

const shownIcons = (el) =>
  [...el.shadowRoot.querySelectorAll('.default')].filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.classList[1]);

describe('punica-alert', () => {
  afterEach(cleanup);

  it('is role=alert for an error or a warning and role=status otherwise, through internals', async () => {
    const el = await fixture('<punica-alert>Saved.</punica-alert>');
    expect(el.internals.role).toBe('status');
    for (const [color, role] of [['error', 'alert'], ['warning', 'alert'], ['success', 'status'], ['info', 'status'], ['primary', 'status']]) {
      el.color = color;
      await settle();
      expect(el.internals.role, color).toBe(role);
    }
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('draws the icon of its colour, or the slotted one', async () => {
    const el = await fixture('<punica-alert>Saved.</punica-alert>');
    expect(shownIcons(el)).toEqual(['info']);
    for (const color of ['success', 'warning', 'error']) {
      el.color = color;
      await settle();
      expect(shownIcons(el)).toEqual([color]);
    }
    el.color = 'neutral';
    await settle();
    expect(shownIcons(el)).toEqual(['info']);
    const own = document.createElement('span');
    own.slot = 'icon';
    own.textContent = '!';
    el.append(own);
    await settle();
    expect(el.shadowRoot.querySelector('slot[name=icon]').assignedElements()).toEqual([own]);
    expect(el.shadowRoot.querySelector('.default').getBoundingClientRect().width).toBe(0);
  });

  it('is one element with icon, message and actions in a row (1.x needed three child elements)', async () => {
    const el = await fixture(
      '<punica-alert style="width:400px">Message<button slot="actions">Undo</button></punica-alert>'
    );
    const icon = el.shadowRoot.querySelector('.icon').getBoundingClientRect();
    const content = el.shadowRoot.querySelector('.content').getBoundingClientRect();
    const action = el.querySelector('button').getBoundingClientRect();
    expect(icon.right).toBeLessThanOrEqual(content.left);
    expect(content.right).toBeLessThanOrEqual(action.left);
    expect(Math.abs(icon.top - content.top)).toBeLessThan(2);
  });

  it('shows a named close button when dismissible', async () => {
    const el = await fixture('<punica-alert>Saved.</punica-alert>');
    const close = el.shadowRoot.querySelector('.close');
    expect(getComputedStyle(close).display).toBe('none');
    el.dismissible = true;
    await settle();
    expect(getComputedStyle(close).display).not.toBe('none');
    expect(close.getAttribute('aria-label')).toBe('Close');
    el.labelClose = 'Kapat';
    await settle();
    expect(close.getAttribute('aria-label')).toBe('Kapat');
    close.focus();
    expect(el.shadowRoot.activeElement).toBe(close);
  });

  it('fires punica-dismiss and hides, unless the event is prevented', async () => {
    const el = await fixture('<punica-alert dismissible>Saved.</punica-alert>');
    const fired = once(el, 'punica-dismiss');
    el.shadowRoot.querySelector('.close').click();
    const event = await fired;
    expect(event.detail).toEqual({});
    expect(event.bubbles && event.composed && event.cancelable).toBe(true);
    expect(el.hidden).toBe(true);
    expect(getComputedStyle(el).display).toBe('none');

    const kept = await fixture('<punica-alert dismissible>Saved.</punica-alert>');
    kept.addEventListener('punica-dismiss', (e) => e.preventDefault());
    kept.shadowRoot.querySelector('.close').click();
    expect(kept.hidden).toBe(false);
  });

  it('fires nothing for a programmatic change', async () => {
    const el = await fixture('<punica-alert dismissible>Saved.</punica-alert>');
    let fired = 0;
    el.addEventListener('punica-dismiss', () => fired++);
    el.dismissible = false;
    el.color = 'error';
    el.hidden = true;
    await settle();
    expect(fired).toBe(0);
  });

  it('paints each variant from the tokens', async () => {
    const wrap = await fixture(`<div>
      <punica-alert color="error">x</punica-alert>
      <i style="color:var(--punica-color-error-light);background:var(--punica-color-error)"></i>
    </div>`);
    const el = wrap.firstElementChild;
    const probe = getComputedStyle(wrap.lastElementChild);
    expect(getComputedStyle(el).backgroundColor).toBe(probe.color);
    el.variant = 'filled';
    await settle();
    expect(getComputedStyle(el).backgroundColor).toBe(probe.backgroundColor);
    el.variant = 'outlined';
    await settle();
    expect(getComputedStyle(el).borderTopColor).toBe(probe.backgroundColor);
    el.color = 'red;} * {display:none';
    await settle();
    expect(getComputedStyle(el).display).toBe('flex');
  });
});

describe('punica-alert actions', () => {
  afterEach(cleanup);

  it('centres a small action on the first line of the message', async () => {
    const el = await fixture(
      '<punica-alert>Three files are waiting.<button slot="actions" style="block-size: var(--punica-size-sm); margin: 0">Upload</button></punica-alert>'
    );
    const line = el.shadowRoot.querySelector('.icon').getBoundingClientRect();
    const action = el.querySelector('button').getBoundingClientRect();
    const middle = (r) => r.top + r.height / 2;
    expect(Math.abs(middle(action) - middle(line))).toBeLessThan(1);
  });
});

describe('punica-alert forced colours', () => {
  it('draws the icon in the text colour of the forced palette', () => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(alertStyles);
    const media = [...sheet.cssRules].find((r) => r instanceof CSSMediaRule && r.conditionText.includes('forced-colors'));
    const icon = [...media.cssRules].find((r) => r.selectorText === '.icon');
    expect(icon?.style.color).toBe('canvastext');
  });
});

