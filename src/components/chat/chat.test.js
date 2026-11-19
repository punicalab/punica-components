import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './chatLayout.js';
import './chatMessageList.js';
import './chatMessage.js';
import './chatMessageBubble.js';
import './chatMessageMetadata.js';
import './chatSystemMessage.js';
import './chatComposer.js';
import './chatToolCalls.js';
import './chatToolCall.js';
import './chatDictationButton.js';

const message = `<punica-chat-message sender="assistant" name="Ivy">
  <span slot="avatar" aria-hidden="true">I</span>
  <punica-chat-message-bubble>Here is the plan.</punica-chat-message-bubble>
  <punica-chat-message-metadata slot="metadata">
    <time slot="time" datetime="2026-11-18T10:10">10:10</time>
    <span slot="model">sonnet</span>
    <span slot="tokens">412 tokens</span>
  </punica-chat-message-metadata>
  <button slot="actions" type="button">Copy</button>
</punica-chat-message>`;

const toolCalls = `<punica-chat-tool-calls open>
  <punica-chat-tool-call name="fs.readFile" status="success" duration="420" open>
    <pre slot="input">{ "path": "a.txt" }</pre>
    <pre slot="output">hello</pre>
  </punica-chat-tool-call>
  <punica-chat-tool-call name="net.request" status="error"></punica-chat-tool-call>
</punica-chat-tool-calls>`;

contract('punica-chat-layout', {
  html: `<punica-chat-layout style="block-size: 320px">
    <h2 slot="header">Assistant</h2>
    <punica-chat-message-list>${message}</punica-chat-message-list>
    <punica-chat-composer slot="composer" placeholder="Ask anything"></punica-chat-composer>
  </punica-chat-layout>`
});
contract('punica-chat-message-list', {
  html: `<punica-chat-message-list label="Conversation">${message}<p slot="empty">No messages yet.</p></punica-chat-message-list>`
});
contract('punica-chat-message', { html: message });
contract('punica-chat-message-bubble', {
  html: '<punica-chat-message sender="user" name="You"><punica-chat-message-bubble>Hello there</punica-chat-message-bubble></punica-chat-message>'
});
contract('punica-chat-message-metadata', {
  html: '<punica-chat-message-metadata><time slot="time" datetime="2026-11-18T10:10">10:10</time><span slot="model">sonnet</span></punica-chat-message-metadata>'
});
contract('punica-chat-system-message', {
  html: '<punica-chat-system-message color="info"><span slot="icon" aria-hidden="true">i</span>The model changed to sonnet</punica-chat-system-message>'
});
contract('punica-chat-composer', {
  html: `<punica-chat-composer label="Message" placeholder="Ask anything">
    <button slot="start" type="button">Attach</button>
    <span slot="footer">Answers can be wrong.</span>
  </punica-chat-composer>`
});
contract('punica-chat-tool-calls', { html: toolCalls });
contract('punica-chat-tool-call', {
  html: '<punica-chat-tool-call name="fs.readFile" status="running" open><pre slot="input">{ "path": "a.txt" }</pre></punica-chat-tool-call>'
});

/* ---------------------------------------------------------------- composer */

const type = (el, text) => {
  const textarea = el.shadowRoot.querySelector('textarea');
  textarea.value = text;
  textarea.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  return textarea;
};
const press = (target, init) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, composed: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

describe('punica-chat-composer', () => {
  afterEach(cleanup);

  it('fires punica-input with the value while typing', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const input = once(el, 'punica-input');
    type(el, 'hel');
    expect((await input).detail).toEqual({ value: 'hel' });
    expect(el.value).toBe('hel');
  });

  it('sends on Enter and clears the field', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const textarea = type(el, 'hello');
    const submitted = [];
    el.addEventListener('punica-submit', (e) => submitted.push(e.detail));
    const event = press(textarea, { key: 'Enter' });
    expect(event.defaultPrevented).toBe(true);
    expect(submitted).toEqual([{ value: 'hello' }]);
    expect(el.value).toBe('');
    expect(textarea.value).toBe('');
  });

  it('starts a new line on Shift+Enter', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const textarea = type(el, 'hello');
    let submits = 0;
    el.addEventListener('punica-submit', () => submits++);
    const event = press(textarea, { key: 'Enter', shiftKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(submits).toBe(0);
    expect(el.value).toBe('hello');
  });

  it('leaves Enter to an active IME composition', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const textarea = type(el, 'こんにち');
    let submits = 0;
    el.addEventListener('punica-submit', () => submits++);
    const composing = press(textarea, { key: 'Enter', isComposing: true });
    const legacy = press(textarea, { key: 'Enter', keyCode: 229 });
    expect(composing.defaultPrevented).toBe(false);
    expect(legacy.defaultPrevented).toBe(false);
    expect(submits).toBe(0);
    expect(el.value).toBe('こんにち');
  });

  it('keeps the text when punica-submit is prevented', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const textarea = type(el, 'keep me');
    el.addEventListener('punica-submit', (e) => e.preventDefault());
    press(textarea, { key: 'Enter' });
    expect(el.value).toBe('keep me');
    expect(textarea.value).toBe('keep me');
  });

  it('sends nothing while empty or only white space, and disables the send button', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const button = el.shadowRoot.querySelector('[part="send-button"]');
    let submits = 0;
    el.addEventListener('punica-submit', () => submits++);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Send');
    const textarea = type(el, '   ');
    await settle();
    expect(button.disabled).toBe(true);
    press(textarea, { key: 'Enter' });
    expect(submits).toBe(0);
    type(el, 'hi');
    await settle();
    expect(button.disabled).toBe(false);
    button.click();
    expect(submits).toBe(1);
  });

  it('turns the send button into a stop button while busy', async () => {
    const el = await fixture('<punica-chat-composer busy label-stop="Halt"></punica-chat-composer>');
    const button = el.shadowRoot.querySelector('[part="send-button"]');
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Halt');
    const textarea = type(el, 'next question');
    let submits = 0;
    el.addEventListener('punica-submit', () => submits++);
    press(textarea, { key: 'Enter' });
    expect(submits).toBe(0);
    expect(el.value).toBe('next question');
    const stopped = once(el, 'punica-stop');
    button.click();
    expect((await stopped).detail).toEqual({});
    el.busy = false;
    await settle();
    expect(button.getAttribute('aria-label')).toBe('Send');
  });

  it('is in the form data, submits its form on send and goes back to its default on reset', async () => {
    const form = await fixture(
      '<form><input name="a" value="1"><punica-chat-composer name="message" value="draft"></punica-chat-composer></form>'
    );
    const el = form.querySelector('punica-chat-composer');
    expect(el.value).toBe('draft');
    expect(new FormData(form).get('message')).toBe('draft');
    const textarea = type(el, 'typed');
    await settle();
    expect(Object.fromEntries(new FormData(form))).toEqual({ a: '1', message: 'typed' });

    let data;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      data = Object.fromEntries(new FormData(form));
    });
    press(textarea, { key: 'Enter' });
    expect(data).toEqual({ a: '1', message: 'typed' });
    await settle();
    expect(new FormData(form).get('message')).toBe('');

    type(el, 'again');
    form.reset();
    await settle();
    expect(el.value).toBe('draft');
    expect(textarea.value).toBe('draft');
    expect(new FormData(form).get('message')).toBe('draft');
  });

  it('submits nothing while disabled, and is disabled by a fieldset', async () => {
    const form = await fixture(
      '<form><fieldset disabled><punica-chat-composer name="message" value="x"></punica-chat-composer></fieldset></form>'
    );
    await settle();
    const el = form.querySelector('punica-chat-composer');
    expect(el.shadowRoot.querySelector('textarea').disabled).toBe(true);
    expect(new FormData(form).has('message')).toBe(false);
  });

  it('is invalid while required and empty', async () => {
    const el = await fixture('<punica-chat-composer required></punica-chat-composer>');
    expect(el.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    type(el, 'x');
    await settle();
    expect(el.checkValidity()).toBe(true);
  });

  it('focuses its text area', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(el.shadowRoot.querySelector('textarea'));
  });

  it('grows with its text up to max-rows', async () => {
    const el = await fixture('<punica-chat-composer max-rows="3"></punica-chat-composer>');
    const textarea = el.shadowRoot.querySelector('textarea');
    const one = textarea.getBoundingClientRect().height;
    type(el, 'a\nb');
    await settle();
    const two = textarea.getBoundingClientRect().height;
    expect(two).toBeGreaterThan(one);
    type(el, 'a\nb\nc\nd\ne\nf\ng\nh');
    await settle();
    const many = textarea.getBoundingClientRect().height;
    const line = two - one;
    expect(Math.round(many - one)).toBe(Math.round(line * 2));
  });

  it('hands pasted and dropped files over in punica-attach', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const textarea = el.shadowRoot.querySelector('textarea');
    const files = new DataTransfer();
    files.items.add(new File(['x'], 'a.txt', { type: 'text/plain' }));

    const pasted = once(el, 'punica-attach');
    const paste = new ClipboardEvent('paste', { clipboardData: files, bubbles: true, cancelable: true });
    textarea.dispatchEvent(paste);
    expect((await pasted).detail.files.map((f) => f.name)).toEqual(['a.txt']);
    expect(paste.defaultPrevented).toBe(true);

    const dropped = once(el, 'punica-attach');
    const drop = new DragEvent('drop', { dataTransfer: files, bubbles: true, cancelable: true, composed: true });
    textarea.dispatchEvent(drop);
    const detail = (await dropped).detail;
    expect(Array.isArray(detail.files)).toBe(true);
    expect(detail.files[0]).toBeInstanceOf(File);
    expect(drop.defaultPrevented).toBe(true);

    // Pasted text is the text area's own business.
    let attaches = 0;
    el.addEventListener('punica-attach', () => attaches++);
    const text = new DataTransfer();
    text.setData('text/plain', 'plain');
    const plain = new ClipboardEvent('paste', { clipboardData: text, bubbles: true, cancelable: true });
    textarea.dispatchEvent(plain);
    expect(attaches).toBe(0);
    expect(plain.defaultPrevented).toBe(false);
  });
});

/* ------------------------------------------------------------------ layout */

const layoutHtml = `<punica-chat-layout style="block-size: 200px; inline-size: 300px">
  <div id="list"><p style="block-size: 60px; margin: 0">first</p></div>
</punica-chat-layout>`;
const gap = (scroller) => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
const add = (list, n = 1) => {
  for (let i = 0; i < n; i++) {
    const p = document.createElement('p');
    p.style.cssText = 'block-size: 60px; margin: 0';
    p.textContent = 'more';
    list.appendChild(p);
  }
};
const frames = async (n = 2) => {
  for (let i = 0; i < n; i++) await settle();
};

function trackObservers(name) {
  const Original = window[name];
  const live = new Set();
  window[name] = class extends Original {
    observe(...args) {
      live.add(this);
      return super.observe(...args);
    }
    disconnect() {
      live.delete(this);
      return super.disconnect();
    }
  };
  return { live, restore: () => (window[name] = Original) };
}

describe('punica-chat-layout', () => {
  afterEach(cleanup);

  it('stays at the latest content while content is appended', async () => {
    const el = await fixture(layoutHtml);
    const scroller = el.shadowRoot.querySelector('[part="scroller"]');
    const list = el.querySelector('#list');
    for (let round = 0; round < 5; round++) {
      add(list, 3);
      await frames();
      expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
      expect(gap(scroller)).toBeLessThanOrEqual(1);
    }
    expect(el.atBottom).toBe(true);
    expect(el.shadowRoot.querySelector('[part="scroll-button"]').hidden).toBe(true);
  });

  it('follows content that grows without a mutation it can see', async () => {
    const el = await fixture(layoutHtml);
    const scroller = el.shadowRoot.querySelector('[part="scroller"]');
    const first = el.querySelector('p');
    // A size change only: what a streaming punica-markdown's shadow tree does.
    const inner = document.createElement('div');
    first.attachShadow({ mode: 'open' }).appendChild(inner);
    first.style.blockSize = 'auto';
    for (const size of [300, 600, 900]) {
      inner.style.blockSize = `${size}px`;
      await frames(3);
      expect(scroller.scrollHeight).toBeGreaterThan(size);
      expect(gap(scroller)).toBeLessThanOrEqual(1);
    }
  });

  it('stops following once the reader scrolls up, and says so', async () => {
    const el = await fixture(layoutHtml);
    const scroller = el.shadowRoot.querySelector('[part="scroller"]');
    const button = el.shadowRoot.querySelector('[part="scroll-button"]');
    const list = el.querySelector('#list');
    add(list, 10);
    await frames();
    expect(gap(scroller)).toBeLessThanOrEqual(1);

    const states = [];
    el.addEventListener('punica-scroll-state', (e) => states.push(e.detail));
    scroller.scrollTop = 100;
    // Content arrives in the same frame as the reader's scroll.
    add(list, 2);
    await frames();
    expect(scroller.scrollTop).toBe(100);
    expect(states).toEqual([{ atBottom: false }]);
    expect(el.atBottom).toBe(false);
    expect(button.hidden).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Jump to latest');

    add(list, 5);
    await frames();
    expect(scroller.scrollTop).toBe(100);

    button.click();
    await frames();
    expect(gap(scroller)).toBeLessThanOrEqual(1);
    expect(states).toEqual([{ atBottom: false }, { atBottom: true }]);
    expect(button.hidden).toBe(true);

    add(list, 3);
    await frames();
    expect(gap(scroller)).toBeLessThanOrEqual(1);
  });

  it('follows again when the reader scrolls back to the end', async () => {
    const el = await fixture(layoutHtml);
    const scroller = el.shadowRoot.querySelector('[part="scroller"]');
    const list = el.querySelector('#list');
    add(list, 10);
    await frames();
    scroller.scrollTop = 0;
    await frames();
    expect(el.atBottom).toBe(false);
    scroller.scrollTop = scroller.scrollHeight;
    await frames();
    expect(el.atBottom).toBe(true);
    add(list, 3);
    await frames();
    expect(gap(scroller)).toBeLessThanOrEqual(1);
  });

  it('scrollToLatest() goes to the end', async () => {
    const el = await fixture(layoutHtml);
    const scroller = el.shadowRoot.querySelector('[part="scroller"]');
    add(el.querySelector('#list'), 10);
    await frames();
    scroller.scrollTop = 0;
    await frames();
    el.scrollToLatest();
    expect(gap(scroller)).toBeLessThanOrEqual(1);
    expect(el.atBottom).toBe(true);
  });

  it('stops its observers on disconnect and starts them again on reconnect', async () => {
    const resize = trackObservers('ResizeObserver');
    const mutation = trackObservers('MutationObserver');
    try {
      const el = await fixture(layoutHtml);
      const parent = el.parentElement;
      expect(resize.live.size).toBe(1);
      expect(mutation.live.size).toBe(1);
      el.remove();
      expect(resize.live.size).toBe(0);
      expect(mutation.live.size).toBe(0);
      parent.appendChild(el);
      await frames();
      expect(resize.live.size).toBe(1);
      expect(mutation.live.size).toBe(1);

      const scroller = el.shadowRoot.querySelector('[part="scroller"]');
      add(el.querySelector('#list'), 10);
      await frames();
      expect(gap(scroller)).toBeLessThanOrEqual(1);
      el.remove();
      expect(resize.live.size).toBe(0);
      expect(mutation.live.size).toBe(0);
    } finally {
      resize.restore();
      mutation.restore();
    }
  });

  it('names its scroller and shows header and composer only when filled', async () => {
    const el = await fixture('<punica-chat-layout label="Support chat" style="block-size: 200px"><p>hi</p></punica-chat-layout>');
    const root = el.shadowRoot;
    expect(root.querySelector('[part="scroller"]').getAttribute('aria-label')).toBe('Support chat');
    expect(root.querySelector('[part="header"]').hidden).toBe(true);
    expect(root.querySelector('[part="composer"]').hidden).toBe(true);
    const header = Object.assign(document.createElement('h2'), { slot: 'header', textContent: 'Chat' });
    el.appendChild(header);
    await settle();
    expect(root.querySelector('[part="header"]').hidden).toBe(false);
  });
});

/* ---------------------------------------------------------------- messages */

describe('punica-chat-message-list', () => {
  afterEach(cleanup);

  it('is a polite log with a name', async () => {
    const el = await fixture('<punica-chat-message-list label="Support"></punica-chat-message-list>');
    expect(el.internals.role).toBe('log');
    expect(el.internals.ariaLive).toBe('polite');
    expect(el.internals.ariaLabel).toBe('Support');
  });

  it('shows the empty slot only while there is no message', async () => {
    const el = await fixture('<punica-chat-message-list><p slot="empty">Nothing yet</p></punica-chat-message-list>');
    const empty = el.shadowRoot.querySelector('[part="empty"]');
    expect(el.matches(':state(empty)')).toBe(true);
    expect(getComputedStyle(empty).display).not.toBe('none');
    el.appendChild(document.createElement('punica-chat-message'));
    await settle();
    expect(el.matches(':state(empty)')).toBe(false);
    expect(getComputedStyle(empty).display).toBe('none');
  });

  it('puts the same gap between messages', async () => {
    const el = await fixture(
      `<punica-chat-message-list>${message}${message}${message}</punica-chat-message-list>`
    );
    const [a, b, c] = [...el.children].map((m) => m.getBoundingClientRect());
    expect(Math.round(b.top - a.bottom)).toBe(24);
    expect(Math.round(c.top - b.bottom)).toBe(24);
  });
});

describe('punica-chat-message', () => {
  afterEach(cleanup);

  it('is an article named after its sender, busy while streaming', async () => {
    const el = await fixture('<punica-chat-message sender="assistant" name="Ivy" status="streaming">…</punica-chat-message>');
    expect(el.internals.role).toBe('article');
    expect(el.internals.ariaLabel).toBe('Ivy');
    expect(el.internals.ariaBusy).toBe('true');
    expect(el.shadowRoot.querySelector('[part="name"]').textContent).toBe('Ivy');
    expect(el.shadowRoot.querySelector('.status-text').textContent).toBe('Writing');
    el.status = 'complete';
    el.label = 'Ivy, 10:10';
    await settle();
    expect(el.internals.ariaBusy).toBe(null);
    expect(el.internals.ariaLabel).toBe('Ivy, 10:10');
    expect(el.shadowRoot.querySelector('[part="status"]').hidden).toBe(true);
  });

  it('says an error in words, not only in colour', async () => {
    const el = await fixture('<punica-chat-message status="error" label-error="Could not answer">x</punica-chat-message>');
    const status = el.shadowRoot.querySelector('[part="status"]');
    expect(status.hidden).toBe(false);
    expect(status.textContent.trim()).toBe('Could not answer');
    expect(getComputedStyle(status.querySelector('.error-icon')).display).not.toBe('none');
  });

  it('keeps its actions focusable while they are not shown, and shows them on focus', async () => {
    const el = await fixture(message);
    const actions = el.shadowRoot.querySelector('[part="actions"]');
    const button = el.querySelector('[slot="actions"]');
    const style = getComputedStyle(actions);
    expect(style.display).not.toBe('none');
    expect(style.visibility).toBe('visible');
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(el.matches(':focus-within')).toBe(true);
    await new Promise((r) => setTimeout(r, 200));
    expect(getComputedStyle(actions).opacity).toBe('1');
  });

  it('styles its bubbles by sender, and a bubble variant overrides', async () => {
    const wrap = await fixture(`<div>
      <punica-chat-message sender="user"><punica-chat-message-bubble id="u">a</punica-chat-message-bubble></punica-chat-message>
      <punica-chat-message sender="assistant"><punica-chat-message-bubble id="a">b</punica-chat-message-bubble>
        <punica-chat-message-bubble id="p" variant="plain">c</punica-chat-message-bubble></punica-chat-message>
      <punica-chat-message sender="user"><punica-chat-message-bubble id="o" variant="outlined">d</punica-chat-message-bubble></punica-chat-message>
    </div>`);
    const surface = (id) => getComputedStyle(wrap.querySelector(`#${id}`).shadowRoot.querySelector('[part="base"]'));
    expect(surface('u').backgroundColor).not.toBe(surface('a').backgroundColor);
    expect(surface('u').color).not.toBe(surface('a').color);
    expect(surface('p').backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(surface('p').paddingInlineStart).toBe('0px');
    expect(surface('o').backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(surface('o').color).toBe(surface('a').color);
    // A user's turn sits at the inline end.
    const user = wrap.querySelector('#u').getBoundingClientRect();
    const host = wrap.querySelector('punica-chat-message').getBoundingClientRect();
    expect(Math.round(user.right)).toBe(Math.round(host.right));
  });
});

describe('punica-chat-system-message', () => {
  afterEach(cleanup);

  it('is a note, centred', async () => {
    const el = await fixture('<punica-chat-system-message style="inline-size: 400px">Context trimmed</punica-chat-system-message>');
    expect(el.internals.role).toBe('note');
    const host = el.getBoundingClientRect();
    const label = el.shadowRoot.querySelector('[part="label"]').getBoundingClientRect();
    expect(Math.abs(label.left + label.width / 2 - (host.left + host.width / 2))).toBeLessThan(1);
  });
});

/* -------------------------------------------------------------- tool calls */

describe('punica-chat-tool-calls', () => {
  afterEach(cleanup);

  it('folds its list behind a native button and reports the toggle', async () => {
    const el = await fixture(toolCalls.replace(' open>', '>'));
    const header = el.shadowRoot.querySelector('button');
    const panel = el.shadowRoot.querySelector('[part="panel"]');
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(el.shadowRoot.querySelector('[part="count"]').textContent).toBe('2');
    expect(header.textContent).toContain('Tool calls');

    const toggled = once(el, 'punica-toggle');
    header.click();
    expect((await toggled).detail).toEqual({ open: true });
    await settle();
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);

    let events = 0;
    el.addEventListener('punica-toggle', () => events++);
    el.open = false;
    await settle();
    expect(events).toBe(0);
    expect(panel.hidden).toBe(true);
  });
});

describe('punica-chat-tool-call', () => {
  afterEach(cleanup);

  it('is a disclosure: a native button with aria-expanded over its panel', async () => {
    const el = await fixture(
      '<punica-chat-tool-call name="fs.readFile" status="success"><pre slot="input">in</pre><pre slot="output">out</pre></punica-chat-tool-call>'
    );
    const header = el.shadowRoot.querySelector('button');
    const panel = el.shadowRoot.querySelector('[part="panel"]');
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(header.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(true);
    el.focus();
    expect(el.shadowRoot.activeElement).toBe(header);

    const toggled = once(el, 'punica-toggle');
    header.click();
    expect((await toggled).detail).toEqual({ open: true });
    await settle();
    expect(el.open).toBe(true);
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    const [input, output] = panel.querySelectorAll('[part="section"]');
    expect(input.hidden).toBe(false);
    expect(output.hidden).toBe(false);
    expect(input.querySelector('[part="section-label"]').textContent).toBe('Input');

    const closed = once(el, 'punica-toggle');
    header.click();
    expect((await closed).detail).toEqual({ open: false });
  });

  it('hides a section nothing is slotted into', async () => {
    const el = await fixture('<punica-chat-tool-call name="x" open><pre slot="input">in</pre></punica-chat-tool-call>');
    const [input, output] = el.shadowRoot.querySelectorAll('[part="section"]');
    expect(input.hidden).toBe(false);
    expect(output.hidden).toBe(true);
  });

  it.each([
    ['pending', 'Pending', '.glyph-pending'],
    ['running', 'Running', '.glyph-running'],
    ['success', 'Done', '.glyph-success'],
    ['error', 'Failed', '.glyph-error']
  ])('shows %s by an icon and by text', async (status, text, glyph) => {
    const el = await fixture(`<punica-chat-tool-call name="x" status="${status}"></punica-chat-tool-call>`);
    const root = el.shadowRoot;
    expect(root.querySelector('[part="status-text"]').textContent).toBe(text);
    const shown = [...root.querySelectorAll('.glyph')].filter((g) => getComputedStyle(g).display !== 'none');
    expect(shown).toEqual([root.querySelector(glyph)]);
    // The button's name carries the status.
    expect(root.querySelector('button').textContent).toContain(text);
  });

  it('takes the status text from its label attributes', async () => {
    const el = await fixture('<punica-chat-tool-call name="x" status="error" label-error="Başarısız"></punica-chat-tool-call>');
    expect(el.shadowRoot.querySelector('[part="status-text"]').textContent).toBe('Başarısız');
  });

  it('formats its duration in the element’s language', async () => {
    const wrap = await fixture(
      '<div lang="en"><punica-chat-tool-call name="a" duration="420"></punica-chat-tool-call><punica-chat-tool-call name="b" duration="1540"></punica-chat-tool-call><punica-chat-tool-call name="c"></punica-chat-tool-call></div>'
    );
    const text = [...wrap.children].map((el) => el.shadowRoot.querySelector('[part="duration"]').textContent);
    expect(text).toEqual(['420ms', '1.5s', '']);
    wrap.lang = 'de';
    wrap.children[1].duration = 2500;
    await settle();
    expect(wrap.children[1].shadowRoot.querySelector('[part="duration"]').textContent).toMatch(/^2,5\s/);
  });
});

/* --------------------------------------------------------------- dictation */

/** A stand-in for the browser's SpeechRecognition, installed per test. */
class FakeRecognition {
  static instances = [];
  lang = '';
  interimResults = false;
  continuous = false;
  maxAlternatives = 0;
  onresult = null;
  onerror = null;
  onend = null;
  started = false;
  stopped = false;
  aborted = false;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
    queueMicrotask(() => this.onend?.());
  }
  abort() {
    this.aborted = true;
    this.onerror?.({ error: 'aborted' });
    this.onend?.();
  }
  /** Delivers results; each is [transcript, isFinal]. */
  hear(resultIndex, ...results) {
    this.onresult?.({
      resultIndex,
      results: results.map(([transcript, isFinal]) => Object.assign([{ transcript }], { isFinal }))
    });
  }
  fail(error) {
    this.onerror?.({ error });
    this.onend?.();
  }
  static get last() {
    return FakeRecognition.instances.at(-1);
  }
}

const SPEECH = ['SpeechRecognition', 'webkitSpeechRecognition'];
let saved = [];
/** Installs `Ctor` as the browser's recognition, or removes it with null. */
function installSpeech(Ctor) {
  saved = SPEECH.map((name) => [name, Object.getOwnPropertyDescriptor(window, name)]);
  for (const name of SPEECH) delete window[name];
  if (Ctor) Object.defineProperty(window, 'webkitSpeechRecognition', { value: Ctor, configurable: true, writable: true });
  FakeRecognition.instances = [];
}
function restoreSpeech() {
  for (const name of SPEECH) delete window[name];
  for (const [name, descriptor] of saved) if (descriptor) Object.defineProperty(window, name, descriptor);
  saved = [];
}

const mic = (el) => el.shadowRoot.querySelector('[part="base"]');

describe('punica-chat-dictation-button: with speech recognition', () => {
  beforeEach(() => installSpeech(FakeRecognition));
  afterEach(() => {
    cleanup();
    restoreSpeech();
  });

  contract('punica-chat-dictation-button', {
    html: '<punica-chat-dictation-button></punica-chat-dictation-button>',
    open: (el) => mic(el).click()
  });
  contract('punica-chat-dictation-button', {
    html: '<punica-chat-composer label="Message"><punica-chat-dictation-button slot="end" label="Dictate"></punica-chat-dictation-button></punica-chat-composer>'
  });

  it('is a named toggle button that starts and stops recognition', async () => {
    const el = await fixture('<div lang="tr-TR"><punica-chat-dictation-button></punica-chat-dictation-button></div>');
    const button = el.firstElementChild;
    const base = mic(button);
    expect(button.supported).toBe(true);
    expect(getComputedStyle(button).display).not.toBe('none');
    expect(base.getAttribute('aria-pressed')).toBe('false');
    expect(base.getAttribute('aria-label')).toBe('Start dictation');
    button.focus();
    expect(button.shadowRoot.activeElement).toBe(base);

    base.click();
    await settle();
    const rec = FakeRecognition.last;
    expect(rec.started).toBe(true);
    expect(rec.lang).toBe('tr-TR');
    expect(rec.interimResults).toBe(true);
    expect(button.listening).toBe(true);
    expect(button.matches(':state(listening)')).toBe(true);
    expect(base.getAttribute('aria-pressed')).toBe('true');
    expect(base.getAttribute('aria-label')).toBe('Stop dictation');
    // A visible recording state: the ring is drawn.
    expect(getComputedStyle(button.shadowRoot.querySelector('[part="indicator"]')).opacity).not.toBe('0');

    base.click();
    await settle();
    expect(rec.stopped).toBe(true);
    expect(button.listening).toBe(false);
    expect(base.getAttribute('aria-pressed')).toBe('false');
    expect(button.matches(':state(listening)')).toBe(false);
  });

  it('takes its language from locale over the closest lang', async () => {
    const el = await fixture('<div lang="de"><punica-chat-dictation-button locale="en-GB" label="Diktieren" label-stop="Anhalten"></punica-chat-dictation-button></div>');
    const button = el.firstElementChild;
    expect(mic(button).getAttribute('aria-label')).toBe('Diktieren');
    button.start();
    await settle();
    expect(FakeRecognition.last.lang).toBe('en-GB');
    expect(mic(button).getAttribute('aria-label')).toBe('Anhalten');
  });

  it('fires interim words in punica-input and a settled phrase in punica-change', async () => {
    const button = await fixture('<punica-chat-dictation-button></punica-chat-dictation-button>');
    button.start();
    const rec = FakeRecognition.last;
    const events = [];
    button.addEventListener('punica-input', (e) => events.push([e.type, e.detail]));
    button.addEventListener('punica-change', (e) => events.push([e.type, e.detail]));
    rec.hear(0, ['book a', false]);
    rec.hear(0, ['book a room', false]);
    rec.hear(0, ['book a room for Thursday', true]);
    rec.hear(1, ['book a room for Thursday', true], [' at ten', false]);
    expect(events).toEqual([
      ['punica-input', { value: 'book a', final: false }],
      ['punica-input', { value: 'book a room', final: false }],
      ['punica-change', { value: 'book a room for Thursday', final: true }],
      ['punica-input', { value: 'at ten', final: false }]
    ]);
  });

  it('writes into the composer at the caret: interim words stand in place until they settle', async () => {
    const composer = await fixture(
      '<punica-chat-composer><punica-chat-dictation-button slot="end"></punica-chat-dictation-button></punica-chat-composer>'
    );
    const button = composer.querySelector('punica-chat-dictation-button');
    const textarea = composer.shadowRoot.querySelector('textarea');
    textarea.value = 'Hello world';
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    textarea.setSelectionRange(5, 5);
    const values = [];
    composer.addEventListener('punica-input', (e) => e.target === composer && values.push(e.detail.value));
    mic(button).click();
    const rec = FakeRecognition.last;
    rec.hear(0, ['dear', false]);
    expect(composer.value).toBe('Hello dear world');
    rec.hear(0, ['dear old', false]);
    expect(composer.value).toBe('Hello dear old world');
    rec.hear(0, ['dear old', true]);
    expect(composer.value).toBe('Hello dear old world');
    rec.hear(1, ['dear old', true], ['and', false]);
    expect(composer.value).toBe('Hello dear old and world');
    rec.hear(1, ['dear old', true], ['and new', true]);
    expect(composer.value).toBe('Hello dear old and new world');
    expect(values.at(-1)).toBe('Hello dear old and new world');
    expect(textarea.selectionStart).toBe('Hello dear old and new'.length);
    await settle();
    // The send button follows the text.
    expect(composer.shadowRoot.querySelector('[part="send-button"]').disabled).toBe(false);
  });

  it('keeps the composer untouched when the event is prevented, and writes nothing outside a composer slot', async () => {
    const wrap = await fixture(`<div>
      <punica-chat-composer><punica-chat-dictation-button slot="start"></punica-chat-dictation-button></punica-chat-composer>
      <punica-chat-composer id="other"></punica-chat-composer><punica-chat-dictation-button id="loose"></punica-chat-dictation-button>
    </div>`);
    const composer = wrap.querySelector('punica-chat-composer');
    const button = composer.querySelector('punica-chat-dictation-button');
    button.addEventListener('punica-change', (e) => e.preventDefault());
    button.start();
    FakeRecognition.last.hear(0, ['ignored', true]);
    expect(composer.value).toBe('');
    const loose = wrap.querySelector('#loose');
    loose.start();
    FakeRecognition.last.hear(0, ['nowhere', true]);
    expect(wrap.querySelector('#other').value).toBe('');
  });

  it('stops on Escape and when the page is hidden, not when the window loses focus', async () => {
    const button = await fixture('<punica-chat-dictation-button></punica-chat-dictation-button>');
    button.start();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(FakeRecognition.last.stopped).toBe(true);
    expect(button.listening).toBe(false);

    button.start();
    // A permission prompt blurs the window; listening must survive it.
    window.dispatchEvent(new FocusEvent('blur'));
    expect(button.listening).toBe(true);
    button.stop();

    button.start();
    const hidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    try {
      document.dispatchEvent(new Event('visibilitychange'));
    } finally {
      delete document.hidden;
      expect(Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')).toEqual(hidden);
    }
    expect(FakeRecognition.last.stopped).toBe(true);
    expect(button.listening).toBe(false);

    // Escape after the session does nothing.
    const count = FakeRecognition.instances.length;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(FakeRecognition.instances.length).toBe(count);
  });

  it('leaves no recognition running when it is removed, and works again when put back', async () => {
    const button = await fixture('<punica-chat-dictation-button></punica-chat-dictation-button>');
    const parent = button.parentElement;
    mic(button).click();
    const rec = FakeRecognition.last;
    button.remove();
    expect(rec.aborted).toBe(true);
    expect(rec.onresult).toBe(null);
    expect(button.listening).toBe(false);
    parent.append(button);
    await settle();
    expect(mic(button).getAttribute('aria-pressed')).toBe('false');
    mic(button).click();
    expect(FakeRecognition.last).not.toBe(rec);
    expect(button.listening).toBe(true);
  });

  it('fires punica-error when permission is denied or nothing was heard, and stops', async () => {
    const button = await fixture('<punica-chat-dictation-button></punica-chat-dictation-button>');
    button.start();
    let error = once(button, 'punica-error');
    FakeRecognition.last.fail('not-allowed');
    expect((await error).detail).toEqual({ error: 'not-allowed' });
    expect(button.listening).toBe(false);
    await settle();
    expect(mic(button).getAttribute('aria-pressed')).toBe('false');

    button.start();
    error = once(button, 'punica-error');
    FakeRecognition.last.fail('no-speech');
    expect((await error).detail).toEqual({ error: 'no-speech' });
    expect(button.listening).toBe(false);
  });

  it('reports a recognition that cannot start', async () => {
    class Refusing extends FakeRecognition {
      start() {
        throw new DOMException('busy', 'InvalidStateError');
      }
    }
    restoreSpeech();
    installSpeech(Refusing);
    const button = await fixture('<punica-chat-dictation-button></punica-chat-dictation-button>');
    const error = once(button, 'punica-error');
    button.start();
    expect((await error).detail).toEqual({ error: 'start-failed' });
    expect(button.listening).toBe(false);
  });

  it('does not start while disabled, or while its composer is', async () => {
    const wrap = await fixture(`<div>
      <punica-chat-dictation-button disabled></punica-chat-dictation-button>
      <punica-chat-composer disabled><punica-chat-dictation-button slot="end"></punica-chat-dictation-button></punica-chat-composer>
    </div>`);
    const [own, inComposer] = wrap.querySelectorAll('punica-chat-dictation-button');
    expect(mic(own).disabled).toBe(true);
    expect(mic(inComposer).disabled).toBe(true);
    own.start();
    inComposer.start();
    expect(FakeRecognition.instances.length).toBe(0);
  });
});

describe('punica-chat-dictation-button: without speech recognition', () => {
  beforeEach(() => installSpeech(null));
  afterEach(() => {
    cleanup();
    restoreSpeech();
  });

  contract('punica-chat-dictation-button', { html: '<punica-chat-dictation-button></punica-chat-dictation-button>' });

  it('hides itself, and the composer keeps its layout', async () => {
    const composer = await fixture(
      '<punica-chat-composer><punica-chat-dictation-button slot="end"></punica-chat-dictation-button></punica-chat-composer>'
    );
    const button = composer.querySelector('punica-chat-dictation-button');
    expect(button.supported).toBe(false);
    expect(button.matches(':state(unsupported)')).toBe(true);
    expect(getComputedStyle(button).display).toBe('none');
    expect(button.checkVisibility()).toBe(false);
    button.start();
    expect(button.listening).toBe(false);
  });
});

describe('punica-chat-composer insertText', () => {
  afterEach(cleanup);

  it('inserts at the caret in place of the selection, spaced from the words around it, and fires punica-input', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    const textarea = type(el, 'Send the report');
    textarea.setSelectionRange(5, 8);
    const input = once(el, 'punica-input');
    el.insertText('my');
    expect((await input).detail).toEqual({ value: 'Send my report' });
    expect(el.value).toBe('Send my report');
    expect(textarea.selectionStart).toBe(7);
    el.insertText('weekly');
    expect(el.value).toBe('Send my weekly report');
  });

  it('replaces provisional text with the next insertion, and forgets it once the person types', async () => {
    const el = await fixture('<punica-chat-composer></punica-chat-composer>');
    el.insertText('hel', { provisional: true });
    el.insertText('hello the', { provisional: true });
    expect(el.value).toBe('hello the');
    el.insertText('hello there');
    expect(el.value).toBe('hello there');
    el.insertText('again', { provisional: true });
    expect(el.value).toBe('hello there again');
    type(el, 'hello there again!');
    el.insertText('ok');
    expect(el.value).toBe('hello there again! ok');
  });

  it('does nothing while disabled', async () => {
    const el = await fixture('<punica-chat-composer disabled value="x"></punica-chat-composer>');
    el.insertText('more');
    expect(el.value).toBe('x');
  });
});
