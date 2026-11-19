import { describe, it, expect, afterEach, vi } from 'vitest';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './timer.js';

contract('punica-timer', { html: '<punica-timer label="Time left" duration="90" running lang="en"></punica-timer>' });
contract('punica-timer', { html: '<punica-timer label="Elapsed" mode="stopwatch" lang="en"></punica-timer>' });

const text = (el) => el.shadowRoot.querySelector('time').textContent;
const status = (el) => el.shadowRoot.querySelector('[role=status]').textContent;
const fakeClock = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });

/** Runs `fn` with no Intl.DurationFormat, as on an older browser. */
async function withoutDurationFormat(fn) {
  const original = Object.getOwnPropertyDescriptor(Intl, 'DurationFormat');
  if (original) delete Intl.DurationFormat;
  try {
    await fn();
  } finally {
    if (original) Object.defineProperty(Intl, 'DurationFormat', original);
  }
}

describe('punica-timer', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('is a timer to assistive technology, named by label, and silent between announcements', async () => {
    const el = await fixture('<punica-timer label="Time left" duration="65" locale="en"></punica-timer>');
    expect(el.internals.role).toBe('timer');
    expect(el.internals.ariaLive).toBe('off');
    expect(el.internals.ariaLabel).toBe('Time left');
    const time = el.shadowRoot.querySelector('time');
    expect(time.getAttribute('datetime')).toBe('PT65S');
    expect(text(el)).toMatch(/1:05$/);
    expect(status(el)).toBe('');
    el.label = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.internals.ariaLabel).toBe('<img src=x onerror=alert(1)>');
    expect(el.shadowRoot.querySelector('img')).toBe(null);
  });

  it('falls back to zero-padded digits without Intl.DurationFormat', async () => {
    await withoutDurationFormat(async () => {
      const el = await fixture('<punica-timer duration="65"></punica-timer>');
      expect(text(el)).toBe('01:05');
      el.duration = 3725;
      await settle();
      expect(text(el)).toBe('1:02:05');
      el.duration = 0;
      await settle();
      expect(text(el)).toBe('00:00');
    });
  });

  it('counts down from duration and fires punica-complete once', async () => {
    await withoutDurationFormat(async () => {
      const el = await fixture('<punica-timer duration="3"></punica-timer>');
      const events = [];
      el.addEventListener('punica-complete', (e) => events.push(e));
      fakeClock();
      expect(vi.getTimerCount()).toBe(0);
      el.start();
      await settle();
      expect(el.running).toBe(true);
      expect(el.hasAttribute('running')).toBe(true);
      expect(text(el)).toBe('00:03');
      vi.advanceTimersByTime(1000);
      expect(text(el)).toBe('00:02');
      expect(el.remaining).toBe(2000);
      vi.advanceTimersByTime(2000);
      expect(text(el)).toBe('00:00');
      expect(events.length).toBe(1);
      expect(events[0].detail).toEqual({});
      expect(events[0].bubbles && events[0].composed).toBe(true);
      await settle();
      expect(el.running).toBe(false);
      expect(el.matches(':state(complete)')).toBe(true);
      vi.advanceTimersByTime(5000);
      await settle();
      expect(events.length).toBe(1);
      expect(vi.getTimerCount()).toBe(0);
      // start() after the end begins again.
      el.start();
      await settle();
      expect(text(el)).toBe('00:03');
      vi.advanceTimersByTime(3000);
      expect(events.length).toBe(2);
    });
  });

  it('pauses, resumes without counting the pause, and resets', async () => {
    await withoutDurationFormat(async () => {
      const el = await fixture('<punica-timer duration="60" running></punica-timer>');
      fakeClock();
      el.reset();
      vi.advanceTimersByTime(10_000);
      expect(text(el)).toBe('00:50');
      el.pause();
      await settle();
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(30_000);
      expect(text(el)).toBe('00:50');
      el.start();
      await settle();
      vi.advanceTimersByTime(5_000);
      expect(text(el)).toBe('00:45');
      expect(el.elapsed).toBe(15_000);
      el.reset();
      expect(text(el)).toBe('01:00');
      expect(el.running).toBe(true);
      vi.advanceTimersByTime(1000);
      expect(text(el)).toBe('00:59');
    });
  });

  it('does not drift when its timeouts fire late', async () => {
    await withoutDurationFormat(async () => {
      const el = await fixture('<punica-timer mode="stopwatch" running></punica-timer>');
      fakeClock();
      el.reset();
      // 100 ticks, each 37 ms late: the display follows the clock, not the tick count.
      for (let i = 0; i < 100; i++) vi.advanceTimersByTime(1037);
      expect(Math.floor(el.elapsed / 1000)).toBe(103);
      vi.advanceTimersByTime(1000);
      expect(text(el)).toBe('01:44');
    });
  });

  it('counts up as a stopwatch and never completes', async () => {
    await withoutDurationFormat(async () => {
      const el = await fixture('<punica-timer mode="stopwatch" duration="2"></punica-timer>');
      let completes = 0;
      el.addEventListener('punica-complete', () => completes++);
      fakeClock();
      el.running = true;
      await settle();
      expect(text(el)).toBe('00:00');
      expect(el.remaining).toBe(null);
      vi.advanceTimersByTime(3_600_000 + 61_000);
      expect(text(el)).toBe('1:01:01');
      expect(completes).toBe(0);
    });
  });

  it('counts down to until', async () => {
    await withoutDurationFormat(async () => {
      const el = await fixture('<punica-timer></punica-timer>');
      let completes = 0;
      el.addEventListener('punica-complete', () => completes++);
      fakeClock();
      vi.setSystemTime(Date.parse('2026-06-01T12:00:00Z'));
      el.until = '2026-06-01T12:01:30Z';
      el.running = true;
      await settle();
      expect(text(el)).toBe('01:30');
      vi.advanceTimersByTime(89_000);
      expect(text(el)).toBe('00:01');
      vi.advanceTimersByTime(1000);
      expect(completes).toBe(1);
      el.until = '<img src=x onerror=alert(1)>';
      await settle();
      expect(el.shadowRoot.querySelector('img')).toBe(null);
      expect(text(el)).toBe('00:00');
    });
  });

  it('holds no timer after disconnect and catches up after reconnect', async () => {
    await withoutDurationFormat(async () => {
      const el = await fixture('<punica-timer duration="60" running></punica-timer>');
      const parent = el.parentElement;
      fakeClock();
      el.reset();
      expect(vi.getTimerCount()).toBe(1);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(20_000);
      expect(text(el)).toBe('01:00');
      parent.appendChild(el);
      expect(vi.getTimerCount()).toBe(1);
      expect(text(el)).toBe('00:40');
      vi.advanceTimersByTime(1000);
      expect(text(el)).toBe('00:39');
    });
  });

  it('announces only at announce-every', async () => {
    const el = await fixture('<punica-timer duration="30" announce-every="10" locale="en"></punica-timer>');
    fakeClock();
    el.start();
    await settle();
    const first = status(el);
    expect(first).toContain('30');
    vi.advanceTimersByTime(9000);
    expect(status(el)).toBe(first);
    vi.advanceTimersByTime(1000);
    expect(status(el)).toContain('20');
    expect(status(el)).not.toBe(first);
    expect(el.shadowRoot.querySelector('[role=status]').getAttribute('aria-live')).toBe('polite');
  });

  it('writes through Intl.DurationFormat where the browser has it', async () => {
    if (typeof Intl.DurationFormat !== 'function') return;
    const el = await fixture('<punica-timer duration="3725" locale="en" format="long"></punica-timer>');
    expect(text(el)).toBe(new Intl.DurationFormat('en', { style: 'long' }).format({ hours: 1, minutes: 2, seconds: 5 }));
    el.format = 'digital';
    await settle();
    expect(text(el)).toBe('1:02:05');
  });
});
