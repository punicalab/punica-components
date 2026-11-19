import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './tokenizer.js';

const html = `<punica-tokenizer label="Tags" name="tag" value='["red","blue"]'></punica-tokenizer>`;
const withOptions = `<punica-tokenizer label="Tags" name="tag">
  <punica-option value="r">Red</punica-option>
  <punica-option value="g">Green</punica-option>
  <punica-option value="b">Blue</punica-option>
</punica-tokenizer>`;

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const input = (el) => el.shadowRoot.querySelector('input');
const tokens = (el) => [...el.shadowRoot.querySelectorAll('[part="token"]')];
const texts = (el) => tokens(el).map((t) => t.querySelector('.token-label').textContent);
const listbox = (el) => el.shadowRoot.querySelector('[part="listbox"]');
const shown = (el) => [...el.querySelectorAll('punica-option')].filter((o) => !o.hidden).map((o) => o.text);
const active = (el) => [...el.querySelectorAll('punica-option')].find((o) => o.active) || null;
const type = (el, text) => {
  input(el).focus();
  input(el).value = text;
  input(el).dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
};

contract('punica-tokenizer', { html: withOptions, open: (el) => el.show() });

describe('punica-tokenizer', () => {
  afterEach(cleanup);

  it('keeps the height of its size with a token in it', async () => {
    const row = await fixture(`<div>
      <punica-tokenizer size="small" label="S" value='["a"]'></punica-tokenizer>
      <punica-tokenizer label="M" value='["a"]'></punica-tokenizer>
      <punica-tokenizer size="large" label="L" value='["a"]'></punica-tokenizer>
    </div>`);
    await settle();
    expect([...row.children].map((t) => t.getBoundingClientRect().height)).toEqual([28, 36, 44]);
  });

  it('draws a token per value in a named list, each with a named remove button', async () => {
    const el = await fixture(html);
    expect(el.value).toEqual(['red', 'blue']);
    expect(texts(el)).toEqual(['red', 'blue']);
    const list = el.shadowRoot.querySelector('[part="tokens"]');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Tags');
    expect(tokens(el)[0].getAttribute('role')).toBe('listitem');
    expect(tokens(el)[0].querySelector('button').getAttribute('aria-label')).toBe('Remove red');
    expect(input(el).getAttribute('aria-label')).toBe('Tags');
    expect(input(el).hasAttribute('role')).toBe(false);
    el.labelRemove = 'Kaldır';
    await settle();
    expect(tokens(el)[1].querySelector('button').getAttribute('aria-label')).toBe('Kaldır blue');
  });

  it('adds on Enter and on the separator, trims, and drops a duplicate', async () => {
    const el = await fixture(html);
    input(el).focus();
    input(el).value = ' green ';
    const changed = once(el, 'punica-change');
    expect(key(input(el), 'Enter').defaultPrevented).toBe(true);
    expect((await changed).detail).toEqual({ value: ['red', 'blue', 'green'] });
    expect(input(el).value).toBe('');
    expect(texts(el)).toEqual(['red', 'blue', 'green']);
    input(el).value = 'pink';
    expect(key(input(el), ',').defaultPrevented).toBe(true);
    expect(el.value).toEqual(['red', 'blue', 'green', 'pink']);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    input(el).value = 'red';
    key(input(el), 'Enter');
    expect(el.value.length).toBe(4);
    expect(changes).toBe(0);
    expect(input(el).value).toBe('');
  });

  it('follows the separator attribute and splits pasted or autofilled text', async () => {
    const el = await fixture('<punica-tokenizer label="Tags" separator=";"></punica-tokenizer>');
    input(el).focus();
    input(el).value = 'a,b';
    expect(key(input(el), ',').defaultPrevented).toBe(false);
    key(input(el), ';');
    expect(el.value).toEqual(['a,b']);
    type(el, 'x; y;z');
    expect(el.value).toEqual(['a,b', 'x', 'y', 'z']);
    expect(input(el).value).toBe('');
  });

  it('removes the last token with Backspace in the empty input', async () => {
    const el = await fixture(html);
    input(el).focus();
    const changed = once(el, 'punica-change');
    key(input(el), 'Backspace');
    expect((await changed).detail).toEqual({ value: ['red'] });
    expect(texts(el)).toEqual(['red']);
    input(el).value = 'x';
    input(el).setSelectionRange(1, 1);
    expect(key(input(el), 'Backspace').defaultPrevented).toBe(false);
    expect(el.value).toEqual(['red']);
  });

  it('walks the tokens with the arrow keys and removes the focused one', async () => {
    const el = await fixture(`<punica-tokenizer label="Tags" value='["a","b","c"]'></punica-tokenizer>`);
    input(el).focus();
    key(input(el), 'ArrowLeft');
    expect(el.shadowRoot.activeElement).toBe(tokens(el)[2]);
    key(tokens(el)[2], 'ArrowLeft');
    expect(el.shadowRoot.activeElement).toBe(tokens(el)[1]);
    key(tokens(el)[1], 'Home');
    expect(el.shadowRoot.activeElement).toBe(tokens(el)[0]);
    key(tokens(el)[0], 'ArrowRight');
    expect(el.shadowRoot.activeElement).toBe(tokens(el)[1]);
    const changed = once(el, 'punica-change');
    key(tokens(el)[1], 'Delete');
    expect((await changed).detail.value).toEqual(['a', 'c']);
    expect(texts(el)).toEqual(['a', 'c']);
    expect(el.shadowRoot.activeElement).toBe(tokens(el)[1]);
    key(tokens(el)[1], 'ArrowRight');
    expect(el.shadowRoot.activeElement).toBe(input(el));
    key(input(el), 'ArrowLeft');
    key(el.shadowRoot.activeElement, 'Backspace');
    expect(el.value).toEqual(['a']);
    key(el.shadowRoot.activeElement, 'End');
    expect(el.shadowRoot.activeElement).toBe(input(el));
  });

  it('removes with the remove button', async () => {
    const el = await fixture(html);
    const changed = once(el, 'punica-change');
    tokens(el)[0].querySelector('button').click();
    expect((await changed).detail.value).toEqual(['blue']);
    expect(el.shadowRoot.activeElement).toBe(input(el));
  });

  it('suggests options as a combobox, hides the taken ones and adds the picked one by its value', async () => {
    const el = await fixture(withOptions);
    await settle();
    expect(input(el).getAttribute('role')).toBe('combobox');
    expect(input(el).getAttribute('aria-expanded')).toBe('false');
    const opened = once(el, 'punica-open');
    type(el, 'e');
    await opened;
    expect(listbox(el).matches(':popover-open')).toBe(true);
    expect(input(el).getAttribute('aria-expanded')).toBe('true');
    expect(shown(el)).toEqual(['Red', 'Green', 'Blue']);
    type(el, 'gr');
    expect(shown(el)).toEqual(['Green']);
    key(input(el), 'ArrowDown');
    expect(active(el).value).toBe('g');
    expect(input(el).ariaActiveDescendantElement).toBe(active(el));
    const changed = once(el, 'punica-change');
    key(input(el), 'Enter');
    expect((await changed).detail.value).toEqual(['g']);
    expect(texts(el)).toEqual(['Green']);
    expect(input(el).value).toBe('');
    expect(shown(el)).toEqual(['Red', 'Blue']);
    key(input(el), 'Escape');
    await settle();
    expect(listbox(el).matches(':popover-open')).toBe(false);
    key(input(el), 'ArrowDown');
    expect(active(el).value).toBe('r');
    el.querySelector('[value="b"]').click();
    expect(el.value).toEqual(['g', 'b']);
  });

  it('keeps two open instances apart', async () => {
    const wrap = await fixture(`<div>${withOptions}${withOptions.replace('"Tags"', '"More"')}</div>`);
    const [a, b] = wrap.children;
    a.show();
    b.show();
    await settle();
    expect(listbox(a).matches(':popover-open')).toBe(true);
    expect(listbox(b).matches(':popover-open')).toBe(true);
    b.querySelector('[value="g"]').click();
    await settle();
    expect(b.value).toEqual(['g']);
    expect(a.value).toEqual([]);
    expect(shown(a).length).toBe(3);
    expect(listbox(a).matches(':popover-open')).toBe(true);
  });

  it('renders a value or an option label holding markup as text', async () => {
    window.__xss = 0;
    const evil = '<img src=x onerror="window.__xss=1">';
    const el = await fixture('<punica-tokenizer label="Risky"><punica-option value="o"></punica-option></punica-tokenizer>');
    el.querySelector('punica-option').label = evil;
    el.value = [evil, 'o'];
    await settle();
    expect(texts(el)).toEqual([evil, evil]);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    await new Promise((r) => setTimeout(r, 50));
    expect(window.__xss).toBe(0);
  });

  it('fires nothing for a programmatic value', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.value = ['one'];
    await settle();
    expect(texts(el)).toEqual(['one']);
    expect(changes).toBe(0);
  });

  it('has no axe violations with tokens and open suggestions', async () => {
    const el = await fixture(withOptions.replace('name="tag"', `name="tag" value='["r","x"]'`));
    el.show();
    await settle();
    await new Promise((r) => setTimeout(r, 250));
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  describe('in a form', () => {
    const form = (attrs = '') => `<form><punica-tokenizer label="Tags" name="tag" ${attrs}></punica-tokenizer></form>`;
    const two = `value='["red","blue"]'`;

    it('appears in FormData, one entry per value', async () => {
      const f = await fixture(form(two));
      expect(new FormData(f).getAll('tag')).toEqual(['red', 'blue']);
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form(`${two} disabled`));
      expect(new FormData(f).has('tag')).toBe(false);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form(two));
      const el = f.firstElementChild;
      input(el).value = 'green';
      key(input(el), 'Enter');
      expect(new FormData(f).getAll('tag')).toEqual(['red', 'blue', 'green']);
      f.reset();
      await settle();
      expect(el.value).toEqual(['red', 'blue']);
      expect(texts(el)).toEqual(['red', 'blue']);
      expect(new FormData(f).getAll('tag')).toEqual(['red', 'blue']);
    });

    it('blocks checkValidity when required and empty', async () => {
      const f = await fixture(form('required'));
      const el = f.firstElementChild;
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      input(el).value = 'a';
      key(input(el), 'Enter');
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(`<form><fieldset disabled>${form(two).replace(/<\/?form>/g, '')}</fieldset></form>`);
      await settle();
      const el = f.querySelector('punica-tokenizer');
      expect(input(el).disabled).toBe(true);
      expect(tokens(el)[0].querySelector('button').disabled).toBe(true);
      expect(el.shadowRoot.querySelector('[part=tokens]').getAttribute('aria-disabled')).toBe('true');
      expect(new FormData(f).has('tag')).toBe(false);
    });

    it('submits the form on Enter in the empty input, and adds instead when there is text', async () => {
      const f = await fixture(form(two));
      let submits = 0;
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        submits++;
      });
      const el = f.firstElementChild;
      input(el).value = 'x';
      key(input(el), 'Enter');
      expect(submits).toBe(0);
      key(input(el), 'Enter');
      expect(submits).toBe(1);
    });
  });
});

describe('punica-tokenizer delegated focus', () => {
  afterEach(cleanup);
  it('puts a focus that lands on a token into the text input', async () => {
    const el = await fixture('<punica-tokenizer label="Tags" value=\'["alpha","beta"]\'></punica-tokenizer>');
    el.shadowRoot.querySelector('.token').focus();
    expect(el.shadowRoot.activeElement.localName).toBe('input');
  });
});

