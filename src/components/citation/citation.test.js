import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './citation.js';

const html = `<p>Water boils at a lower temperature at altitude
  <punica-citation index="1" href="https://example.com/boiling" heading="Boiling points" source="example.com">
    At 3,000 m water boils near 90 °C.
  </punica-citation>.</p>`;

const get = (root) => {
  const el = root.matches?.('punica-citation') ? root : root.querySelector('punica-citation');
  const shadow = el.shadowRoot;
  return {
    el,
    link: shadow.querySelector('a'),
    button: shadow.querySelector('button'),
    popover: shadow.querySelector('punica-popover'),
    card: shadow.querySelector('[part="card"]')
  };
};

contract('punica-citation', {
  html,
  open: (p) => p.querySelector('punica-citation').show()
});
contract('punica-citation', {
  html: '<punica-citation index="2" heading="Field notes">A snippet.</punica-citation>',
  open: (el) => el.show()
});

describe('punica-citation', () => {
  afterEach(cleanup);

  it('is a native link to the source, named after it', async () => {
    const { link, button } = get(await fixture(html));
    expect(link.hidden).toBe(false);
    expect(button.hidden).toBe(true);
    expect(link.getAttribute('href')).toBe('https://example.com/boiling');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.textContent).toBe('1');
    expect(link.getAttribute('aria-label')).toBe('Source 1: Boiling points');
  });

  it('is a native button when it has no address', async () => {
    const { el, link, button, popover } = get(await fixture('<punica-citation index="2" heading="Notes">Snippet</punica-citation>'));
    expect(link.hidden).toBe(true);
    expect(button.hidden).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    await settle();
    expect(el.open).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(popover.panel.matches(':popover-open')).toBe(true);
    button.click();
    await settle();
    expect(el.open).toBe(false);
  });

  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' java\tscript:alert(1)', 'data:text/html,<b>x', 'vbscript:x'])(
    'does not link to %s',
    async (href) => {
      const el = await fixture('<punica-citation index="3" heading="Bad"></punica-citation>');
      el.href = href;
      await settle();
      const { link, button } = get(el);
      expect(link.hidden).toBe(true);
      expect(link.hasAttribute('href')).toBe(false);
      expect(button.hidden).toBe(false);
    }
  );

  it('reads its card from the start of the line', async () => {
    const el = await fixture('<punica-citation index="1" heading="Boiling points" source="example.com">A snippet long enough to wrap onto a second line of the card.</punica-citation>');
    el.show();
    await settle();
    const card = el.shadowRoot.querySelector('[part="card"]');
    expect(getComputedStyle(card).textAlign).toBe('start');
  });

  it('opens its card on focus, with title, source and snippet, and Escape closes it', async () => {
    const root = await fixture(html);
    const { el, link, popover, card } = get(root);
    const opened = once(el, 'punica-open');
    link.focus();
    await opened;
    await settle();
    expect(el.open).toBe(true);
    expect(popover.panel.matches(':popover-open')).toBe(true);
    expect(card.querySelector('[part="title"]').textContent).toBe('Boiling points');
    expect(card.querySelector('[part="source"]').textContent).toBe('example.com');
    expect(card.querySelector('slot:not([name])').assignedNodes().map((n) => n.textContent).join('').trim()).toBe(
      'At 3,000 m water boils near 90 °C.'
    );
    expect(card.getBoundingClientRect().width).toBeGreaterThan(0);
    // The card describes the marker and focus stays on the marker.
    expect(link.getAttribute('aria-describedby')).toBe(card.id);
    expect(el.shadowRoot.activeElement).toBe(link);

    const closed = once(el, 'punica-close');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect((await closed).detail.reason).toBe('escape');
    await settle();
    expect(el.open).toBe(false);
    expect(popover.panel.matches(':popover-open')).toBe(false);
    expect(el.shadowRoot.activeElement).toBe(link);
  });

  it('closes when focus leaves', async () => {
    const root = await fixture(`<div>${html}<button id="next">Next</button></div>`);
    const { el, link } = get(root);
    link.focus();
    await settle();
    expect(el.open).toBe(true);
    root.querySelector('#next').focus();
    await settle();
    expect(el.open).toBe(false);
  });

  it('opens on hover after a moment and closes after the pointer left', async () => {
    const { el, link } = get(await fixture(html));
    link.dispatchEvent(new PointerEvent('pointerenter'));
    expect(el.open).toBe(false);
    await new Promise((r) => setTimeout(r, 220));
    expect(el.open).toBe(true);
    link.dispatchEvent(new PointerEvent('pointerleave'));
    await new Promise((r) => setTimeout(r, 280));
    expect(el.open).toBe(false);
  });

  it('stays open while the pointer is on the card', async () => {
    const { el, link, card } = get(await fixture(html));
    link.dispatchEvent(new PointerEvent('pointerenter'));
    await new Promise((r) => setTimeout(r, 220));
    link.dispatchEvent(new PointerEvent('pointerleave'));
    card.dispatchEvent(new PointerEvent('pointerenter'));
    await new Promise((r) => setTimeout(r, 280));
    expect(el.open).toBe(true);
    card.dispatchEvent(new PointerEvent('pointerleave'));
    await new Promise((r) => setTimeout(r, 280));
    expect(el.open).toBe(false);
  });

  it('takes its whole name from label', async () => {
    const { link } = get(await fixture('<punica-citation index="1" href="/a" label="Kaynak 1"></punica-citation>'));
    expect(link.getAttribute('aria-label')).toBe('Kaynak 1');
    expect(link.hasAttribute('rel')).toBe(false);
  });
});
