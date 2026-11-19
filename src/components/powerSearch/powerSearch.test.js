import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './powerSearch.js';

const FILTERS = [
  { key: 'status', label: 'Status', type: 'select', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }] },
  { key: 'owner', label: 'Owner', type: 'text', operators: [{ value: 'is', label: 'is' }, { value: 'not', label: 'is not' }] },
  { key: 'due', label: 'Due date', type: 'date' }
];

const html = `<punica-power-search label="Search issues" name="q" placeholder="Search or filter"></punica-power-search>`;
const mount = async (markup = html) => {
  const el = await fixture(markup);
  el.filters = FILTERS;
  await settle();
  return el;
};

contract('punica-power-search', {
  html,
  open: (el) => {
    el.filters = FILTERS;
    el.show();
  }
});

const sr = (el, sel) => el.shadowRoot.querySelector(sel);
const input = (el) => sr(el, '[part="input"]');
const rows = (el) => [...el.shadowRoot.querySelectorAll('[part="option"]')].map((o) => o.textContent);
const active = (el) => input(el).ariaActiveDescendantElement?.textContent ?? null;
const tokens = (el) => [...el.shadowRoot.querySelectorAll('[part="token-label"]')].map((t) => t.textContent);
const pending = (el) => (sr(el, '[part="pending"]').hidden ? null : sr(el, '[part="pending"]').textContent);

describe('punica-power-search', () => {
  afterEach(cleanup);

  it('suggests the fields whose label matches what is typed', async () => {
    const el = await mount();
    input(el).focus();
    await userEvent.keyboard('st');
    await settle();
    expect(rows(el)).toEqual(['Status']);
    expect(el.open).toBe(true);
    expect(input(el).getAttribute('aria-expanded')).toBe('true');
    expect(el.value).toEqual({ query: 'st', filters: [] });
  });

  it('builds a select filter by keyboard: field, then value, as a token', async () => {
    const wrap = await fixture(`<div>${html}</div>`);
    const el = wrap.firstElementChild;
    el.filters = FILTERS;
    const seen = [];
    wrap.addEventListener('punica-change', (e) => seen.push(e.detail));
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(active(el)).toBe('Status');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(pending(el)).toBe('Status');
    expect(el.matches(':state(pending)')).toBe(true);
    expect(rows(el)).toEqual(['Open', 'Closed']);
    expect(input(el).getAttribute('aria-label')).toBe('Status');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await settle();
    expect(tokens(el)).toEqual(['Status: Closed']);
    expect(pending(el)).toBe(null);
    expect(el.value).toEqual({ query: '', filters: [{ key: 'status', operator: 'is', value: 'closed' }] });
    expect(seen).toEqual([{ value: el.value }]);
    expect(el.shadowRoot.activeElement).toBe(input(el));
  });

  it('asks for the operator when a field has several, and takes typed text as a value', async () => {
    const el = await mount();
    input(el).focus();
    await userEvent.keyboard('own');
    await settle();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await settle();
    expect(rows(el)).toEqual(['is', 'is not']);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await settle();
    expect(pending(el)).toBe('Owner is not');
    await userEvent.keyboard('dana{Enter}');
    await settle();
    expect(tokens(el)).toEqual(['Owner is not dana']);
    expect(el.value.filters).toEqual([{ key: 'owner', operator: 'not', value: 'dana' }]);
    // The text typed to find the field was not the query.
    expect(el.value.query).toBe('');
  });

  it('takes a date for a date field and shows it in the language of the page', async () => {
    const wrap = await fixture(`<div lang="en-GB">${html}</div>`);
    const el = wrap.firstElementChild;
    el.filters = FILTERS;
    input(el).focus();
    await userEvent.keyboard('due{ArrowDown}{Enter}');
    await settle();
    const date = sr(el, '[part="date"]');
    expect(date.hidden).toBe(false);
    expect(el.shadowRoot.activeElement).toBe(date);
    date.value = '2026-03-04';
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(el.value.filters).toEqual([{ key: 'due', operator: 'on', value: '2026-03-04' }]);
    expect(tokens(el)).toEqual(['Due date: 4 Mar 2026']);
  });

  it('keeps free text as the query, fires punica-input while typing and punica-search on Enter', async () => {
    const form = await fixture(`<form>${html}</form>`);
    const el = form.firstElementChild;
    el.filters = FILTERS;
    const inputs = [];
    el.addEventListener('punica-input', (e) => inputs.push(e.detail.value.query));
    let submitted = 0;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted++;
    });
    input(el).focus();
    await userEvent.keyboard('login bug');
    expect(inputs.at(-1)).toBe('login bug');
    const searched = once(el, 'punica-search');
    const changed = once(el, 'punica-change');
    await userEvent.keyboard('{Enter}');
    expect((await searched).detail).toEqual({ value: { query: 'login bug', filters: [] } });
    expect((await changed).detail.value.query).toBe('login bug');
    expect(submitted).toBe(1);
    el.addEventListener('punica-search', (e) => e.preventDefault());
    await userEvent.keyboard('{Enter}');
    expect(submitted).toBe(1);
  });

  it('removes the last token on Backspace, and leaves the value step first', async () => {
    const el = await mount();
    el.value = { query: '', filters: [{ key: 'status', operator: 'is', value: 'open' }, { key: 'owner', operator: 'is', value: 'sam' }] };
    await settle();
    expect(tokens(el)).toEqual(['Status: Open', 'Owner: sam']);
    input(el).focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(pending(el)).toBe('Status');
    await userEvent.keyboard('{Backspace}');
    expect(pending(el)).toBe(null);
    await userEvent.keyboard('{Backspace}');
    await settle();
    expect(tokens(el)).toEqual(['Status: Open']);
  });

  it('walks the tokens with the arrows and removes one with Delete, mirrored right-to-left', async () => {
    for (const dir of ['ltr', 'rtl']) {
      const wrap = await fixture(`<div dir="${dir}">${html}</div>`);
      const el = wrap.firstElementChild;
      el.filters = FILTERS;
      el.value = { query: '', filters: [{ key: 'status', operator: 'is', value: 'open' }, { key: 'owner', operator: 'is', value: 'sam' }] };
      await settle();
      input(el).focus();
      const back = dir === 'rtl' ? '{ArrowRight}' : '{ArrowLeft}';
      await userEvent.keyboard(back);
      expect(el.shadowRoot.activeElement.textContent).toContain('Owner');
      await userEvent.keyboard(back);
      expect(el.shadowRoot.activeElement.textContent).toContain('Status');
      await userEvent.keyboard('{Delete}');
      await settle();
      expect(tokens(el)).toEqual(['Owner: sam']);
      expect(el.shadowRoot.activeElement.textContent).toContain('Owner');
      await userEvent.keyboard('{End}');
      expect(el.shadowRoot.activeElement).toBe(input(el));
      cleanup();
    }
  });

  it('sends a focus that lands on a token to the text input', async () => {
    const el = await mount();
    el.value = { query: '', filters: [{ key: 'status', operator: 'is', value: 'open' }] };
    await settle();
    HTMLElement.prototype.focus.call(el);
    expect(el.shadowRoot.activeElement).toBe(input(el));
  });

  it('removes a token with its named button', async () => {
    const el = await mount();
    el.value = { query: 'x', filters: [{ key: 'status', operator: 'is', value: 'open' }] };
    await settle();
    const remove = sr(el, '[part="remove"]');
    expect(remove.getAttribute('aria-label')).toBe('Remove Status: Open');
    const changed = once(el, 'punica-change');
    remove.click();
    expect((await changed).detail).toEqual({ value: { query: 'x', filters: [] } });
  });

  it('closes on Escape, then leaves the value step on a second Escape', async () => {
    const el = await mount();
    input(el).focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(el.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(el.open).toBe(false);
    expect(pending(el)).toBe('Status');
    await userEvent.keyboard('{Escape}');
    expect(pending(el)).toBe(null);
  });

  it('submits its value as JSON, resets to the value attribute, and blocks when required and empty', async () => {
    const initial = JSON.stringify({ query: 'bug', filters: [{ key: 'status', operator: 'is', value: 'open' }] });
    const form = await fixture(`<form><punica-power-search label="A" name="a" value='${initial}'></punica-power-search><punica-power-search label="B" name="b" required></punica-power-search></form>`);
    const [a, b] = form.children;
    a.filters = FILTERS;
    b.filters = FILTERS;
    await settle();
    expect(tokens(a)).toEqual(['Status: Open']);
    expect(JSON.parse(new FormData(form).get('a'))).toEqual(JSON.parse(initial));
    expect(form.checkValidity()).toBe(false);
    expect(b.validity.valueMissing).toBe(true);
    b.value = { query: 'x', filters: [] };
    a.value = { query: '', filters: [] };
    await settle();
    expect(form.checkValidity()).toBe(true);
    form.reset();
    await settle();
    expect(a.value).toEqual(JSON.parse(initial));
    expect(b.value).toEqual({ query: '', filters: [] });
  });

  it('takes no input and submits nothing while disabled or in a disabled fieldset', async () => {
    const form = await fixture(`<form><fieldset disabled>${html}</fieldset></form>`);
    const el = form.querySelector('punica-power-search');
    el.filters = FILTERS;
    await settle();
    expect([...new FormData(form)]).toEqual([]);
    expect(input(el).disabled).toBe(true);
    expect(el.matches(':state(disabled)')).toBe(true);
  });

  it('shows labels given as markup as text', async () => {
    const el = await mount();
    el.filters = [{ key: 'x', label: '<img src=x onerror=window.__pwn=1>', type: 'select', options: [{ value: 'y', label: '<img src=y onerror=window.__pwn=2>' }] }];
    el.value = { query: '', filters: [{ key: 'x', operator: 'is', value: 'y' }] };
    el.show();
    await settle();
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(rows(el)).toEqual(['<img src=x onerror=window.__pwn=1>']);
    expect(tokens(el)).toEqual(['<img src=x onerror=window.__pwn=1>: <img src=y onerror=window.__pwn=2>']);
    expect(window.__pwn).toBeUndefined();
  });

  it('has no axe violations with tokens and the suggestions open', async () => {
    const el = await mount();
    el.value = { query: '', filters: [{ key: 'status', operator: 'is', value: 'open' }] };
    el.show();
    await new Promise((r) => setTimeout(r, 300));
    expect(await a11y(el.parentElement)).toEqual([]);
  });
});
