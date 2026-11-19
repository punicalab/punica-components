import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './avatarGroup.js';

const people = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Edsger Dijkstra'];
const avatars = people.map((name) => `<punica-avatar name="${name}"></punica-avatar>`).join('');
const html = `<punica-avatar-group label="Project members" max="3">${avatars}</punica-avatar-group>`;
const more = (el) => el.shadowRoot.querySelector('.more');
const count = (el) => el.shadowRoot.querySelector('.count');
const popover = (el) => el.shadowRoot.querySelector('punica-popover');
const assigned = (el) => el.shadowRoot.querySelector('slot').assignedElements();

contract('punica-avatar-group', {
  html,
  open: async (el) => {
    more(el).click();
    await settle();
  }
});

describe('punica-avatar-group', () => {
  afterEach(cleanup);

  it('is a named group showing every avatar while max is unset', async () => {
    const el = await fixture(html.replace(' max="3"', ''));
    expect(el.internals.role).toBe('group');
    expect(el.internals.ariaLabel).toBe('Project members');
    expect(assigned(el)).toHaveLength(5);
    expect(more(el).closest('punica-popover').hidden).toBe(true);
    expect(count(el).hidden).toBe(true);
    expect(el.matches(':state(overflowing)')).toBe(false);
  });

  it('shows max avatars and collapses the rest into a +N button', async () => {
    const el = await fixture(html);
    expect(assigned(el).map((a) => a.getAttribute('name'))).toEqual(people.slice(0, 3));
    expect(popover(el).hidden).toBe(false);
    expect(more(el).textContent).toBe('+2');
    expect(more(el).getAttribute('aria-label')).toBe('2 more');
    expect(el.hiddenAvatars.map((a) => a.getAttribute('name'))).toEqual(people.slice(3));
    expect(el.matches(':state(overflowing)')).toBe(true);
    // The hidden ones take no space.
    const hidden = el.querySelectorAll('punica-avatar')[4];
    expect(hidden.getBoundingClientRect().width).toBe(0);
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('opens the list of hidden names from the keyboard and Escape returns focus', async () => {
    const wrap = await fixture(`<div><button id="before">Before</button>${html}</div>`);
    const el = wrap.querySelector('punica-avatar-group');
    wrap.querySelector('#before').focus();
    await userEvent.keyboard('{Tab}');
    expect(el.shadowRoot.activeElement).toBe(more(el));
    const opened = once(el, 'punica-open');
    await userEvent.keyboard('{Enter}');
    await opened;
    await settle();
    expect(more(el).getAttribute('aria-expanded')).toBe('true');
    const names = [...el.shadowRoot.querySelectorAll('.item .name')].map((n) => n.textContent);
    expect(names).toEqual(['Katherine Johnson', 'Edsger Dijkstra']);
    const panel = popover(el).panel;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-label')).toBe('2 more');
    await new Promise((r) => setTimeout(r, 200));
    expect(await a11y(wrap)).toEqual([]);
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{Escape}');
    expect((await closed).detail).toEqual({ reason: 'escape' });
    expect(el.shadowRoot.activeElement).toBe(more(el));
  });

  it('with overflow="count" shows a plain count that is not a button', async () => {
    const el = await fixture(html.replace('max="3"', 'max="2" overflow="count"'));
    expect(popover(el).hidden).toBe(true);
    expect(count(el).hidden).toBe(false);
    expect(count(el).textContent).toBe('+3');
    expect(count(el).getAttribute('role')).toBe('img');
    expect(count(el).getAttribute('aria-label')).toBe('3 more');
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  it('follows children added and removed, max changes and a translated label', async () => {
    const el = await fixture(html);
    el.max = 4;
    el.labelOverflow = 'و {count} آخرون';
    await settle();
    expect(more(el).getAttribute('aria-label')).toBe('و 1 آخرون');
    el.lastElementChild.remove();
    await settle();
    expect(popover(el).hidden).toBe(true);
    expect(assigned(el)).toHaveLength(4);
    const added = document.createElement('punica-avatar');
    added.setAttribute('name', 'Barbara Liskov');
    el.append(added);
    await settle();
    expect(more(el).textContent).toBe('+1');
    added.setAttribute('name', 'Margaret Hamilton');
    await settle();
    more(el).click();
    await settle();
    expect(el.shadowRoot.querySelector('.item .name').textContent).toBe('Margaret Hamilton');
  });

  it('sizes every avatar from the group, over their own size', async () => {
    const el = await fixture(html.replace('<punica-avatar name', '<punica-avatar size="small" name').replace('max="3"', 'max="3" size="large"'));
    for (const avatar of assigned(el)) expect(avatar.getBoundingClientRect().width).toBe(44);
    expect(more(el).getBoundingClientRect().height).toBe(44);
  });

  it('overlaps toward the inline end, mirrored right to left', async () => {
    const wrap = await fixture(`<div>${html}</div>`);
    const el = wrap.querySelector('punica-avatar-group');
    const [a, b] = assigned(el).map((x) => x.getBoundingClientRect());
    expect(b.left).toBeLessThan(a.right);
    expect(b.left).toBeGreaterThan(a.left);
    expect(a.left).toBeGreaterThanOrEqual(el.getBoundingClientRect().left);
    wrap.dir = 'rtl';
    await settle();
    const [c, d] = assigned(el).map((x) => x.getBoundingClientRect());
    expect(d.right).toBeGreaterThan(c.left);
    expect(d.right).toBeLessThan(c.right);
    expect(c.right).toBeLessThanOrEqual(el.getBoundingClientRect().right);
  });

  it('renders hidden names as text', async () => {
    const bad = '<img src=x onerror="window.__pwned=1">';
    const el = await fixture(`<punica-avatar-group max="0"><punica-avatar></punica-avatar></punica-avatar-group>`);
    el.firstElementChild.setAttribute('name', bad);
    el.labelOverflow = bad;
    await settle();
    more(el).click();
    await settle();
    expect(el.shadowRoot.querySelector('.item .name').textContent).toBe(bad);
    expect(el.shadowRoot.querySelector('img:not([part])')).toBe(null);
    expect(more(el).getAttribute('aria-label')).toBe(bad);
    expect(window.__pwned).toBeUndefined();
  });
});
