import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, a11y } from '../../../test/contract.js';
import './blockquote.js';

const html = `<punica-blockquote cite="https://example.com/interview">
  <p>The best way to predict the future is to invent it.</p>
  <span slot="attribution">Alan Kay, <cite>Xerox PARC meeting</cite></span>
</punica-blockquote>`;

contract('punica-blockquote', { html });

describe('punica-blockquote', () => {
  afterEach(cleanup);

  it('renders a native blockquote with its cite inside a figure, the attribution as figcaption', async () => {
    const el = await fixture(html);
    const quote = el.shadowRoot.querySelector('figure > blockquote');
    expect(quote.getAttribute('cite')).toBe('https://example.com/interview');
    const caption = el.shadowRoot.querySelector('figure > figcaption');
    expect(caption.hidden).toBe(false);
    expect(caption.querySelector('slot').assignedElements()[0].textContent).toContain('Alan Kay');
    expect(el.matches(':state(attributed)')).toBe(true);
    el.cite = null;
    await settle();
    expect(quote.hasAttribute('cite')).toBe(false);
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('hides the figcaption with no attribution and shows it when one arrives', async () => {
    const el = await fixture('<punica-blockquote>Simple things should be simple.</punica-blockquote>');
    const caption = el.shadowRoot.querySelector('figcaption');
    expect(caption.hidden).toBe(true);
    expect(caption.getBoundingClientRect().height).toBe(0);
    const who = document.createElement('span');
    who.slot = 'attribution';
    who.textContent = 'Alan Kay';
    el.append(who);
    await settle();
    expect(caption.hidden).toBe(false);
    expect(el.matches(':state(attributed)')).toBe(true);
  });

  it('draws the rule on the inline-start edge, the right edge right to left', async () => {
    const wrap = await fixture(`<div>${html}</div>`);
    const base = wrap.querySelector('punica-blockquote').shadowRoot.querySelector('figure');
    expect(getComputedStyle(base).borderLeftWidth).toBe('4px');
    expect(getComputedStyle(base).borderRightWidth).toBe('0px');
    wrap.dir = 'rtl';
    await settle();
    expect(getComputedStyle(base).borderRightWidth).toBe('4px');
    expect(getComputedStyle(base).borderLeftWidth).toBe('0px');
  });

  it('sets an emphasis quote larger with an accent rule', async () => {
    const el = await fixture(html);
    const quote = el.shadowRoot.querySelector('blockquote');
    const plain = parseFloat(getComputedStyle(quote).fontSize);
    el.variant = 'emphasis';
    await settle();
    expect(parseFloat(getComputedStyle(quote).fontSize)).toBeGreaterThan(plain);
  });

  it('puts cite on as an attribute value, never as markup', async () => {
    const el = await fixture(html);
    el.cite = '"><img src=x onerror="window.__pwned=1">';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('blockquote').getAttribute('cite')).toBe('"><img src=x onerror="window.__pwned=1">');
    expect(window.__pwned).toBeUndefined();
  });
});
