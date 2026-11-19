import { describe, it, expect, afterEach, vi } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './codeBlock.js';

const html = `<punica-code-block language="js" label="Example" line-numbers>
  const a = 1;
  const b = 2;
</punica-code-block>`;

contract('punica-code-block', { html });

const lines = (el) => [...el.shadowRoot.querySelectorAll('.line')];
const shown = (el) => lines(el).filter((l) => !l.hidden).map((l) => l.textContent.replace(/\n$/, ''));

function stubClipboard() {
  const writeText = vi.fn(() => Promise.resolve());
  const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return {
    writeText,
    restore() {
      delete navigator.clipboard;
      if (original) Object.defineProperty(Navigator.prototype, 'clipboard', original);
    }
  };
}

describe('punica-code-block', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('scrolls a long line inside a container that shrink-wraps it, instead of widening it', async () => {
    const box = await fixture(`<div style="display:flex;flex-direction:column;align-items:flex-start;inline-size:300px">
      <punica-code-block>${'x'.repeat(300)}</punica-code-block>
      <punica-code-block>short</punica-code-block>
    </div>`);
    await settle();
    const [long, short] = box.querySelectorAll('punica-code-block');
    expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(300);
    const pre = long.shadowRoot.querySelector('pre');
    expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);
    expect(short.getBoundingClientRect().width).toBeLessThan(300);
  });

  it('keeps code left to right in a right-to-left page', async () => {
    const el = await fixture('<div dir="rtl"><punica-code-block line-numbers>const a = 1;</punica-code-block></div>');
    await settle();
    const block = el.querySelector('punica-code-block');
    const pre = block.shadowRoot.querySelector('pre');
    expect(getComputedStyle(pre).direction).toBe('ltr');
    const line = block.shadowRoot.querySelector('.line').getBoundingClientRect();
    expect(Math.round(line.left - pre.getBoundingClientRect().left)).toBeLessThan(40);
  });

  it('renders its text content in pre > code, without the markup indentation', async () => {
    const el = await fixture(html);
    const code = el.shadowRoot.querySelector('pre > code');
    expect(code.getAttribute('part')).toBe('code');
    expect(shown(el)).toEqual(['const a = 1;', 'const b = 2;']);
    expect(el.text).toBe('const a = 1;\nconst b = 2;');
    expect(el.shadowRoot.querySelector('.language').textContent).toBe('js');
    const pre = el.shadowRoot.querySelector('pre');
    expect(pre.getAttribute('role')).toBe('region');
    expect(pre.getAttribute('aria-label')).toBe('Example');
    expect(pre.tabIndex).toBe(0);
  });

  it('renders markup in the text or in code as text', async () => {
    const el = await fixture('<punica-code-block></punica-code-block>');
    el.textContent = '<img src=x onerror=alert(1)>';
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(shown(el)).toEqual(['<img src=x onerror=alert(1)>']);
    el.code = '<script>alert(2)</script>\n<b>x</b>';
    await settle();
    expect(el.shadowRoot.querySelector('script, b')).toBe(null);
    expect(shown(el)).toEqual(['<script>alert(2)</script>', '<b>x</b>']);
  });

  it('follows text added after it connected and prefers the code property', async () => {
    const el = await fixture('<punica-code-block></punica-code-block>');
    el.append('one\ntwo');
    await settle();
    expect(shown(el)).toEqual(['one', 'two']);
    el.code = 'three';
    await settle();
    expect(shown(el)).toEqual(['three']);
    el.code = null;
    await settle();
    expect(shown(el)).toEqual(['one', 'two']);
  });

  it('stops observing on disconnect and observes again on reconnect', async () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const el = await fixture('<punica-code-block>a</punica-code-block>');
    const parent = el.parentElement;
    const own = () => observe.mock.calls.filter(([target]) => target === el).length;
    expect(own()).toBe(1);
    const before = disconnect.mock.calls.length;
    el.remove();
    expect(disconnect.mock.calls.length).toBe(before + 1);
    el.textContent = 'changed while away';
    parent.appendChild(el);
    await settle();
    expect(own()).toBe(2);
    expect(shown(el)).toEqual(['changed while away']);
    el.textContent = 'and after';
    await settle();
    expect(shown(el)).toEqual(['and after']);
  });

  it('copies the code and announces it, then clears the announcement', async () => {
    const clipboard = stubClipboard();
    try {
      const el = await fixture(html);
      const button = el.shadowRoot.querySelector('.copy');
      const status = el.shadowRoot.querySelector('[role=status]');
      expect(button.getAttribute('aria-label')).toBe('Copy');
      expect(status.getAttribute('aria-live')).toBe('polite');
      vi.useFakeTimers();
      button.click();
      await vi.advanceTimersByTimeAsync(0);
      expect(clipboard.writeText).toHaveBeenCalledWith('const a = 1;\nconst b = 2;');
      expect(status.textContent).toBe('Copied');
      expect(el.matches(':state(copied)')).toBe(true);
      await vi.advanceTimersByTimeAsync(2000);
      expect(status.textContent).toBe('');
      expect(el.matches(':state(copied)')).toBe(false);
    } finally {
      clipboard.restore();
    }
  });

  it('leaves no timer after a copy when it is disconnected', async () => {
    const clipboard = stubClipboard();
    try {
      const el = await fixture(html);
      vi.useFakeTimers();
      await el.copy();
      expect(vi.getTimerCount()).toBe(1);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
      expect(el.shadowRoot.querySelector('[role=status]').textContent).toBe('');
    } finally {
      clipboard.restore();
    }
  });

  it('uses the label attributes for its strings', async () => {
    const clipboard = stubClipboard();
    try {
      const el = await fixture('<punica-code-block label-copy="Kopyala" label-copied="Kopyalandı">x</punica-code-block>');
      expect(el.shadowRoot.querySelector('.copy').getAttribute('aria-label')).toBe('Kopyala');
      expect(await el.copy()).toBe(true);
      expect(el.shadowRoot.querySelector('[role=status]').textContent).toBe('Kopyalandı');
    } finally {
      clipboard.restore();
    }
  });

  it('says nothing when the clipboard refuses', async () => {
    const clipboard = stubClipboard();
    clipboard.writeText.mockImplementation(() => Promise.reject(new Error('denied')));
    try {
      const el = await fixture(html);
      expect(await el.copy()).toBe(false);
      expect(el.shadowRoot.querySelector('[role=status]').textContent).toBe('');
    } finally {
      clipboard.restore();
    }
  });

  it('cuts at max-lines and expands from the keyboard-operable button', async () => {
    const el = await fixture('<punica-code-block max-lines="2"></punica-code-block>');
    el.code = 'a\nb\nc\nd';
    await settle();
    const button = el.shadowRoot.querySelector('.expand');
    expect(button.hidden).toBe(false);
    expect(button.textContent).toBe('Show more');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(shown(el)).toEqual(['a', 'b']);
    const toggled = once(el, 'punica-toggle');
    button.focus();
    expect(el.shadowRoot.activeElement).toBe(button);
    button.click();
    expect((await toggled).detail).toEqual({ open: true });
    await settle();
    expect(shown(el)).toEqual(['a', 'b', 'c', 'd']);
    expect(button.textContent).toBe('Show less');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    el.code = 'a\nb';
    await settle();
    expect(button.hidden).toBe(true);
  });

  it('fires nothing when open is set from code', async () => {
    const el = await fixture('<punica-code-block max-lines="1"></punica-code-block>');
    let fired = 0;
    el.addEventListener('punica-toggle', () => fired++);
    el.open = true;
    await settle();
    expect(fired).toBe(0);
  });

  it('draws the fragment a highlight function returns, line by line', async () => {
    const el = await fixture('<punica-code-block language="js" line-numbers></punica-code-block>');
    const calls = [];
    el.highlight = (text, language) => {
      calls.push([text, language]);
      const fragment = document.createDocumentFragment();
      const comment = document.createElement('span');
      comment.className = 'comment';
      comment.textContent = '/* one\ntwo */';
      fragment.append(comment, '\nconst x = 1;');
      return fragment;
    };
    el.code = '/* one\ntwo */\nconst x = 1;';
    await settle();
    expect(calls.at(-1)).toEqual(['/* one\ntwo */\nconst x = 1;', 'js']);
    expect(shown(el)).toEqual(['/* one', 'two */', 'const x = 1;']);
    const [first, second, third] = lines(el);
    expect(first.querySelector('.comment').textContent).toBe('/* one');
    expect(second.querySelector('.comment').textContent).toBe('two */');
    expect(third.querySelector('.comment')).toBe(null);
    el.highlight = () => null;
    await settle();
    expect(el.shadowRoot.querySelector('.comment')).toBe(null);
    expect(shown(el)).toEqual(['/* one', 'two */', 'const x = 1;']);
  });

  it('numbers lines and wraps on request', async () => {
    const el = await fixture('<punica-code-block line-numbers wrap>a\nb</punica-code-block>');
    const [first, second] = lines(el);
    expect(getComputedStyle(first, '::before').content).toContain('counter(line)');
    expect(first.getBoundingClientRect().top).toBeLessThan(second.getBoundingClientRect().top);
    expect(getComputedStyle(el.shadowRoot.querySelector('pre')).whiteSpace).toContain('pre-wrap');
  });
});
