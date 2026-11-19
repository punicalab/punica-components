import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './accordion.js';
import './accordionGroup.js';

const one = (attrs = '', n = 1) => `<punica-accordion ${attrs}>
  <span slot="summary">Section ${n}</span>
  <p>Content ${n} <a href="#more${n}">More</a></p>
</punica-accordion>`;
const group = (attrs = '') => `<punica-accordion-group ${attrs}>${one('', 1)}${one('', 2)}${one('', 3)}</punica-accordion-group>`;

contract('punica-accordion', { html: one() });
contract('punica-accordion-group', { html: group() });

describe('punica-accordion', () => {
  afterEach(cleanup);

  it('is created by createElement for both tags', () => {
    expect(document.createElement('punica-accordion').open).toBe(false);
    expect(document.createElement('punica-accordion-group').multiple).toBe(false);
  });

  it('renders the summary in a native button with aria-expanded, and a labelled region', async () => {
    const el = await fixture(one());
    const button = el.shadowRoot.querySelector('button');
    const region = el.shadowRoot.querySelector('[role=region]');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(region.id);
    expect(region.getAttribute('aria-labelledby')).toBe(button.id);
    // 1.x put aria-expanded on the host.
    expect(el.hasAttribute('aria-expanded')).toBe(false);
  });

  it('toggles from the button and fires punica-toggle, never changeExpanded', async () => {
    const el = await fixture(one());
    let legacy = 0;
    el.addEventListener('changeExpanded', () => legacy++);
    const button = el.shadowRoot.querySelector('button');
    let event = once(el, 'punica-toggle');
    button.click();
    expect((await event).detail).toEqual({ open: true });
    await settle();
    expect(el.open).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(getComputedStyle(el.shadowRoot.querySelector('[part=region]')).visibility).toBe('visible');
    event = once(el, 'punica-toggle');
    button.click();
    expect((await event).detail).toEqual({ open: false });
    expect(legacy).toBe(0);
  });

  it('delegates focus to the button', async () => {
    const el = await fixture(one());
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(el.shadowRoot.querySelector('button'));
  });

  it('fires nothing for a programmatic change', async () => {
    const el = await fixture(one());
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    el.show();
    el.toggle();
    el.open = true;
    el.hide();
    await settle();
    expect(fired).toBe(0);
  });

  it('takes no click while disabled', async () => {
    const el = await fixture(one('disabled'));
    el.shadowRoot.querySelector('button').click();
    expect(el.open).toBe(false);
    expect(el.shadowRoot.querySelector('button').disabled).toBe(true);
  });

  it('keeps closed content out of the tab order', async () => {
    const el = await fixture(one());
    const link = el.querySelector('a');
    link.focus();
    expect(document.activeElement).not.toBe(link);
  });

  it('exposes a heading level when asked', async () => {
    const el = await fixture(one('heading-level="3"'));
    const heading = el.shadowRoot.querySelector('.heading');
    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('3');
  });

  it('animates with a duration token that is zero under reduced motion', async () => {
    const el = await fixture(one());
    const region = el.shadowRoot.querySelector('[part=region]');
    expect(getComputedStyle(region).transitionProperty).toContain('grid-template-rows');
  });
});

describe('punica-accordion-group', () => {
  afterEach(cleanup);

  it('closes the others when one opens', async () => {
    const el = await fixture(group());
    const [a, b] = el.querySelectorAll('punica-accordion');
    a.shadowRoot.querySelector('button').click();
    await settle();
    expect(a.open).toBe(true);
    b.shadowRoot.querySelector('button').click();
    await settle();
    expect(a.open).toBe(false);
    expect(b.open).toBe(true);
  });

  it('closes the others when one is opened from script', async () => {
    const el = await fixture(group());
    const [a, b, c] = el.querySelectorAll('punica-accordion');
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    a.open = true;
    await settle();
    b.open = true;
    await settle();
    expect([a.open, b.open, c.open]).toEqual([false, true, false]);
    c.show();
    await settle();
    expect([a.open, b.open, c.open]).toEqual([false, false, true]);
    a.setAttribute('open', '');
    await settle();
    expect([a.open, b.open, c.open]).toEqual([true, false, false]);
    // Closing from script closes nothing else and nothing fires.
    a.open = false;
    await settle();
    expect([a.open, b.open, c.open]).toEqual([false, false, false]);
    expect(fired).toBe(0);
  });

  it('leaves script-opened sections alone with multiple, and after it is moved', async () => {
    const el = await fixture(group('multiple'));
    const [a, b] = el.querySelectorAll('punica-accordion');
    a.open = true;
    b.open = true;
    await settle();
    expect(a.open && b.open).toBe(true);
    el.multiple = false;
    await settle();
    expect([a.open, b.open]).toEqual([true, false]);
    // The observer is connection-scoped: it works again after a move.
    const parent = el.parentElement;
    el.remove();
    parent.append(el);
    await settle();
    b.open = true;
    await settle();
    expect([a.open, b.open]).toEqual([false, true]);
  });

  it('lets several stay open with multiple', async () => {
    const el = await fixture(group('multiple'));
    const [a, b] = el.querySelectorAll('punica-accordion');
    a.shadowRoot.querySelector('button').click();
    b.shadowRoot.querySelector('button').click();
    await settle();
    expect(a.open && b.open).toBe(true);
  });

  it('keeps only the first open section of the markup', async () => {
    const el = await fixture(`<punica-accordion-group>${one('open', 1)}${one('open', 2)}</punica-accordion-group>`);
    const [a, b] = el.querySelectorAll('punica-accordion');
    expect(a.open).toBe(true);
    expect(b.open).toBe(false);
  });

  it('works when the sections are created before the group is connected', async () => {
    const el = document.createElement('punica-accordion-group');
    const a = document.createElement('punica-accordion');
    const b = document.createElement('punica-accordion');
    a.open = true;
    el.append(a, b);
    const host = await fixture('<div></div>');
    host.append(el);
    await settle();
    b.shadowRoot.querySelector('button').click();
    await settle();
    expect(a.open).toBe(false);
    expect(b.open).toBe(true);
  });

  it('ignores the sections of a nested group', async () => {
    const el = await fixture(
      `<punica-accordion-group>${one('open', 1)}<punica-accordion><span slot="summary">Outer</span><punica-accordion-group>${one('', 4)}</punica-accordion-group></punica-accordion></punica-accordion-group>`
    );
    const first = el.querySelector('punica-accordion');
    const nested = el.querySelector('punica-accordion punica-accordion');
    nested.shadowRoot.querySelector('button').click();
    await settle();
    expect(first.open).toBe(true);
    expect(nested.open).toBe(true);
  });
});
