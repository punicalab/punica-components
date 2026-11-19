import { describe, it, expect, afterEach, vi } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './timestamp.js';

const ISO = '2026-03-04T15:06:07.000Z';
const NOW = Date.parse('2026-06-01T12:00:00.000Z');

contract('punica-timestamp', { html: `<punica-timestamp value="${ISO}" lang="en"></punica-timestamp>` });
contract('punica-timestamp', {
  html: `<p lang="en">Updated <punica-timestamp value="${ISO}" format="relative"></punica-timestamp></p>`
});

const time = (el) => el.shadowRoot.querySelector('time');
const fakeClock = () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(NOW);
};

describe('punica-timestamp', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('writes a native time element with the machine date and a full title', async () => {
    const el = await fixture(`<punica-timestamp value="${ISO}" locale="en-US"></punica-timestamp>`);
    const t = time(el);
    expect(t.getAttribute('datetime')).toBe(ISO);
    expect(t.textContent).toBe(
      new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ISO))
    );
    expect(t.title).toBe(new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long' }).format(new Date(ISO)));
    expect(t.title).toContain('2026');
  });

  it('takes epoch milliseconds, as an attribute or a number', async () => {
    const ms = Date.parse(ISO);
    const el = await fixture(`<punica-timestamp value="${ms}"></punica-timestamp>`);
    expect(time(el).getAttribute('datetime')).toBe(ISO);
    el.value = ms + 1000;
    await settle();
    expect(time(el).getAttribute('datetime')).toBe('2026-03-04T15:06:08.000Z');
    expect(el.date.getTime()).toBe(ms + 1000);
  });

  it('formats date, time and datetime with the styles and the language', async () => {
    const el = await fixture(`<punica-timestamp value="${ISO}" locale="de" format="date" date-style="long"></punica-timestamp>`);
    const date = new Date(ISO);
    expect(time(el).textContent).toBe(new Intl.DateTimeFormat('de', { dateStyle: 'long' }).format(date));
    el.format = 'time';
    el.timeStyle = 'medium';
    await settle();
    expect(time(el).textContent).toBe(new Intl.DateTimeFormat('de', { timeStyle: 'medium' }).format(date));
    el.format = 'datetime';
    el.locale = 'tr';
    await settle();
    expect(time(el).textContent).toBe(new Intl.DateTimeFormat('tr', { dateStyle: 'long', timeStyle: 'medium' }).format(date));
  });

  it('reads the language from the nearest lang attribute', async () => {
    const wrap = await fixture(`<div lang="fr"><punica-timestamp value="${ISO}" format="date" date-style="full"></punica-timestamp></div>`);
    const el = wrap.firstElementChild;
    expect(time(el).textContent).toBe(new Intl.DateTimeFormat('fr', { dateStyle: 'full' }).format(new Date(ISO)));
  });

  it('writes nothing for a value that is no date, and never parses it as markup', async () => {
    const el = await fixture('<punica-timestamp></punica-timestamp>');
    el.value = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(time(el).textContent).toBe('');
    expect(time(el).hasAttribute('datetime')).toBe(false);
    expect(el.date).toBe(null);
    el.locale = '<img src=x onerror=alert(1)>';
    el.dateStyle = 'nonsense';
    el.value = ISO;
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(time(el).getAttribute('datetime')).toBe(ISO);
    expect(time(el).textContent).not.toBe('');
  });

  it('writes relative time and rewrites itself when the wording changes', async () => {
    const el = await fixture('<punica-timestamp format="relative" locale="en"></punica-timestamp>');
    fakeClock();
    el.value = new Date(NOW - 58_500).toISOString();
    await settle();
    expect(time(el).textContent).toBe('58 seconds ago');
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(500);
    expect(time(el).textContent).toBe('59 seconds ago');
    vi.advanceTimersByTime(1000);
    expect(time(el).textContent).toBe('1 minute ago');
    // The next change is a minute away: one timer, not one a second.
    vi.advanceTimersByTime(59_000);
    expect(time(el).textContent).toBe('1 minute ago');
    vi.advanceTimersByTime(1000);
    expect(time(el).textContent).toBe('2 minutes ago');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('writes future and distant moments in the right unit', async () => {
    const el = await fixture('<punica-timestamp format="relative" locale="en"></punica-timestamp>');
    fakeClock();
    const at = async (offset) => {
      el.value = NOW + offset;
      await settle();
      return time(el).textContent;
    };
    expect(await at(0)).toBe('now');
    expect(await at(3 * 3600_000)).toBe('in 3 hours');
    expect(await at(-86_400_000)).toBe('yesterday');
    expect(await at(-3 * 604_800_000)).toBe('3 weeks ago');
    expect(await at(2 * 31_536_000_000)).toBe('in 2 years');
    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('has no timer after disconnect and one again after reconnect', async () => {
    const el = await fixture('<punica-timestamp format="relative" locale="en"></punica-timestamp>');
    const parent = el.parentElement;
    fakeClock();
    el.value = NOW - 5_000;
    await settle();
    expect(vi.getTimerCount()).toBe(1);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(120_000);
    expect(time(el).textContent).toBe('5 seconds ago');
    parent.appendChild(el);
    expect(vi.getTimerCount()).toBe(1);
    expect(time(el).textContent).toBe('2 minutes ago');
    vi.advanceTimersByTime(60_000);
    expect(time(el).textContent).toBe('3 minutes ago');
  });

  it('arms no timer for an absolute format', async () => {
    const el = await fixture('<punica-timestamp format="relative" locale="en"></punica-timestamp>');
    fakeClock();
    el.value = NOW;
    await settle();
    expect(vi.getTimerCount()).toBe(1);
    el.format = 'date';
    await settle();
    expect(vi.getTimerCount()).toBe(0);
  });
});
