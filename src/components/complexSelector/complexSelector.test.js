import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './complexSelector.js';

const people = (attrs = '') => `<punica-complex-selector label="Assignee" name="who" ${attrs}>
  <punica-option-group label="Design">
    <punica-complex-option value="ana" description="Product designer">Ana Lopes</punica-complex-option>
    <punica-complex-option value="bo" description="Illustrator">Bo Chen</punica-complex-option>
  </punica-option-group>
  <punica-option-group label="Engineering">
    <punica-complex-option value="cy" description="Frontend">Cy Park</punica-complex-option>
    <punica-complex-option value="di" description="Backend" disabled>Di Rossi</punica-complex-option>
    <punica-option value="ed">Ed Novak</punica-option>
  </punica-option-group>
</punica-complex-selector>`;

contract('punica-complex-selector', { html: people('value="bo"'), open: (el) => el.show() });
contract('punica-complex-option', { html: '<div role="listbox" aria-label="People"><punica-complex-option value="a" description="Designer">Ana</punica-complex-option></div>' });
contract('punica-option-group', { html: '<div role="listbox" aria-label="People"><punica-option-group label="Design"><punica-option value="a">Ana</punica-option></punica-option-group></div>' });

const sr = (el, sel) => el.shadowRoot.querySelector(sel);
const search = (el) => sr(el, '[part="search"]');
const trigger = (el) => sr(el, '[part="trigger"]');
const rows = (el) => el.options;
const active = (el) => search(el).ariaActiveDescendantElement;
const activeName = (el) => {
  const a = active(el);
  return a ? a.text ?? a.textContent : null;
};
const typeIn = async (el, text) => {
  search(el).value = text;
  search(el).dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  await settle();
};
const entries = (form) => [...new FormData(form)];

describe('punica-complex-selector', () => {
  afterEach(cleanup);

  it('shows the picked row in a combobox trigger that opens a dialog', async () => {
    const el = await fixture(people('value="bo"'));
    expect(el.value).toBe('bo');
    expect(sr(el, '[part="value"]').textContent).toBe('Bo Chen');
    const t = trigger(el);
    expect(t.getAttribute('role')).toBe('combobox');
    expect(t.getAttribute('aria-haspopup')).toBe('dialog');
    expect(t.getAttribute('aria-label')).toBe('Assignee');
    expect(sr(el, '[part="panel"]').getAttribute('role')).toBe('dialog');
    expect(rows(el).find((o) => o.value === 'bo').selected).toBe(true);
  });

  it('draws a description and filters on label and description', async () => {
    const el = await fixture(people());
    const ana = rows(el)[0];
    expect(ana.text).toBe('Ana Lopes');
    expect(ana.shadowRoot.querySelector('[part="description"]').textContent.trim()).toBe('Product designer');
    el.show();
    await settle();
    await typeIn(el, 'front');
    expect(rows(el).filter((o) => !o.hidden).map((o) => o.text)).toEqual(['Cy Park']);
    expect(el.querySelector('punica-option-group').hidden).toBe(true);
    await typeIn(el, 'zzz');
    expect(sr(el, '[part="empty"]').hidden).toBe(false);
    expect(sr(el, '[part="empty"]').textContent).toBe('No results');
  });

  it('opens on ArrowDown with focus in the search combobox, picks on Enter and gives focus back', async () => {
    const wrap = await fixture(`<div>${people()}</div>`);
    const el = wrap.firstElementChild;
    const seen = [];
    wrap.addEventListener('punica-change', (e) => seen.push([e.target.localName, e.detail]));
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await settle();
    expect(el.open).toBe(true);
    expect(el.shadowRoot.activeElement).toBe(search(el));
    expect(search(el).getAttribute('role')).toBe('combobox');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    expect(activeName(el)).toBe('Ana Lopes');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    // Di Rossi is disabled and skipped.
    expect(activeName(el)).toBe('Ed Novak');
    await userEvent.keyboard('{ArrowUp}');
    expect(activeName(el)).toBe('Cy Park');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(el.value).toBe('cy');
    expect(el.open).toBe(false);
    expect(el.shadowRoot.activeElement).toBe(trigger(el));
    expect(seen).toEqual([['punica-complex-selector', { value: 'cy' }]]);
  });

  it('types to filter and keeps the first match active', async () => {
    const el = await fixture(people());
    el.show();
    await settle();
    await userEvent.keyboard('bo');
    await settle();
    expect(activeName(el)).toBe('Bo Chen');
    await userEvent.keyboard('{Enter}');
    expect(el.value).toBe('bo');
  });

  it('closes on Escape without picking and on a press outside', async () => {
    const el = await fixture(people('value="ana"'));
    el.show();
    await settle();
    const closed = once(el, 'punica-close');
    await userEvent.keyboard('{ArrowDown}{Escape}');
    expect((await closed).detail).toEqual({ reason: 'escape' });
    expect(el.value).toBe('ana');
    el.show();
    await settle();
    const outside = once(el, 'punica-close');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect((await outside).detail).toEqual({ reason: 'outside' });
  });

  it('picks on click', async () => {
    const el = await fixture(people());
    el.show();
    await settle();
    rows(el)[4].click();
    await settle();
    expect(el.value).toBe('ed');
    expect(el.open).toBe(false);
  });

  it('toggles rows with multiple, shows chips, and keeps the list order', async () => {
    const el = await fixture(people('multiple'));
    el.show();
    await settle();
    // With multiple, each group starts with its select-all row.
    expect(activeName(el)).toBe('DesignSelect all');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}{ArrowUp}{Enter}');
    expect(el.value).toEqual(['ana', 'bo']);
    expect(el.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await settle();
    const chips = [...el.shadowRoot.querySelectorAll('[part="chip"]')].map((c) => c.textContent);
    expect(chips).toEqual(['Ana Lopes', 'Bo Chen']);
  });

  it('selects every enabled row the search leaves in a group, and clears them again', async () => {
    const el = await fixture(people('multiple'));
    el.show();
    await settle();
    const header = () => [...el.shadowRoot.querySelectorAll('[part="group-header"]')][1];
    expect(header().getAttribute('role')).toBe('option');
    expect(header().getAttribute('aria-selected')).toBe('false');
    header().click();
    await settle();
    expect(el.value).toEqual(['cy', 'ed']);
    expect(header().getAttribute('aria-selected')).toBe('true');
    header().click();
    await settle();
    expect(el.value).toEqual([]);
    await typeIn(el, 'cy');
    header().click();
    await settle();
    expect(el.value).toEqual(['cy']);
  });

  it('has no axe violations while open, single or multiple', async () => {
    for (const attrs of ['', 'multiple value="ana"']) {
      const el = await fixture(people(attrs));
      el.show();
      // The panel fades in; axe reads colours once it is opaque.
      await new Promise((r) => setTimeout(r, 300));
      expect(await a11y(el.parentElement)).toEqual([]);
      cleanup();
    }
  });

  it('names a single-choice group by its label and hides the drawn heading', async () => {
    const el = await fixture(people());
    const group = el.querySelector('punica-option-group');
    expect(group.internals.role).toBe('group');
    expect(group.internals.ariaLabel).toBe('Design');
    const header = sr(el, '[part="group-header"]');
    expect(header.getAttribute('aria-hidden')).toBe('true');
    expect(header.textContent).toBe('Design');
  });

  it('submits one entry per value, resets, and blocks when required', async () => {
    const form = await fixture(`<form>${people('multiple value="ana cy"')}${people('required').replace('name="who"', 'name="lead"')}</form>`);
    const [a, b] = form.children;
    expect(entries(form)).toEqual([['who', 'ana'], ['who', 'cy']]);
    expect(form.checkValidity()).toBe(false);
    expect(b.validity.valueMissing).toBe(true);
    expect(b.validationMessage.trim()).not.toBe('');
    b.show();
    await settle();
    rows(b)[1].click();
    a.value = ['ed'];
    await settle();
    expect(entries(form)).toEqual([['who', 'ed'], ['lead', 'bo']]);
    expect(form.checkValidity()).toBe(true);
    form.reset();
    await settle();
    expect(entries(form)).toEqual([['who', 'ana'], ['who', 'cy']]);
  });

  it('takes its default from rows selected in the markup', async () => {
    const el = await fixture(people().replace('value="cy"', 'value="cy" selected'));
    expect(el.value).toBe('cy');
  });

  it('takes no input and submits nothing while disabled or in a disabled fieldset', async () => {
    const form = await fixture(`<form><fieldset disabled>${people('value="ana"')}</fieldset>${people('value="bo" disabled')}</form>`);
    await settle();
    const [a, b] = form.querySelectorAll('punica-complex-selector');
    expect(entries(form)).toEqual([]);
    expect(trigger(a).disabled).toBe(true);
    trigger(b).click();
    await settle();
    expect(b.open).toBe(false);
    expect(a.matches(':state(disabled)')).toBe(true);
  });

  it('empties the value with the clear button', async () => {
    const el = await fixture(people('value="ana" clearable'));
    const seen = [];
    el.addEventListener('punica-change', (e) => seen.push(e.detail));
    sr(el, '[part="clear"]').click();
    await settle();
    expect(el.value).toBe(null);
    expect(seen).toEqual([{ value: null }]);
    expect(sr(el, '[part="clear"]').hidden).toBe(true);
  });

  it('takes rows added later, without a group too', async () => {
    const el = await fixture(people());
    const extra = document.createElement('punica-option');
    extra.value = 'fay';
    extra.textContent = 'Fay';
    el.append(extra);
    await settle();
    el.show();
    await settle();
    extra.click();
    await settle();
    expect(el.value).toBe('fay');
  });

  it('shows labels given as markup as text', async () => {
    const el = await fixture(people('multiple'));
    const row = rows(el)[0];
    row.textContent = '<img src=x onerror=window.__pwn=1>';
    row.description = '<img src=x onerror=window.__pwn=2>';
    el.querySelector('punica-option-group').label = '<img src=x onerror=window.__pwn=3>';
    el.value = ['ana'];
    await settle();
    expect(el.querySelector('img')).toBe(null);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(row.shadowRoot.querySelector('img')).toBe(null);
    expect(sr(el, '[part="chip"]').textContent).toBe('<img src=x onerror=window.__pwn=1>');
    expect(sr(el, '.group-label').textContent).toBe('<img src=x onerror=window.__pwn=3>');
    expect(window.__pwn).toBeUndefined();
  });

  it('places the panel under the trigger, right-to-left too', async () => {
    const wrap = await fixture(`<div dir="rtl" style="padding: 40px">${people()}</div>`);
    const el = wrap.firstElementChild;
    el.show();
    await settle();
    const panel = sr(el, '[part="panel"]').getBoundingClientRect();
    const field = sr(el, '[part="field"]').getBoundingClientRect();
    expect(panel.top).toBeGreaterThanOrEqual(field.bottom);
    expect(Math.round(panel.right)).toBe(Math.round(field.right));
  });
});
