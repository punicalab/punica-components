import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once, a11y } from '../../../test/contract.js';
import './autocomplete.js';

const html = `<punica-autocomplete label="City" name="city" placeholder="Search">
  <punica-option value="pod">Podgorica</punica-option>
  <punica-option value="ist">Istanbul</punica-option>
  <punica-option value="izm">Izmir</punica-option>
  <punica-option value="bud" disabled>Budva</punica-option>
</punica-autocomplete>`;

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
const input = (el) => el.shadowRoot.querySelector('input');
const listbox = (el) => el.shadowRoot.querySelector('[part="listbox"]');
const rows = (el) => [...listbox(el).querySelectorAll('punica-option'), ...el.querySelectorAll('punica-option')];
const shown = (el) => rows(el).filter((o) => !o.hidden).map((o) => o.text);
const active = (el) => rows(el).find((o) => o.active) || null;
const type = (el, text) => {
  input(el).focus();
  input(el).value = text;
  input(el).dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
};

contract('punica-autocomplete', { html, open: (el) => el.show() });

describe('punica-autocomplete', () => {
  afterEach(cleanup);

  it('is a native input with the combobox role over a listbox', async () => {
    const el = await fixture(html);
    const field = input(el);
    expect(field.localName).toBe('input');
    expect(field.getAttribute('role')).toBe('combobox');
    expect(field.getAttribute('aria-autocomplete')).toBe('list');
    expect(field.getAttribute('aria-expanded')).toBe('false');
    expect(field.getAttribute('aria-label')).toBe('City');
    expect(el.shadowRoot.getElementById(field.getAttribute('aria-controls'))).toBe(listbox(el));
    expect(listbox(el).getAttribute('role')).toBe('listbox');
  });

  it('filters the options by the typed text and fires punica-input', async () => {
    const el = await fixture(html);
    const typed = once(el, 'punica-input');
    const opened = once(el, 'punica-open');
    type(el, 'i');
    expect((await typed).detail).toEqual({ value: 'i' });
    await opened;
    expect(listbox(el).matches(':popover-open')).toBe(true);
    expect(input(el).getAttribute('aria-expanded')).toBe('true');
    expect(shown(el)).toEqual(['Podgorica', 'Istanbul', 'Izmir']);
    type(el, 'IZ');
    expect(shown(el)).toEqual(['Izmir']);
    const closed = once(el, 'punica-close');
    type(el, 'zzz');
    expect((await closed).detail.reason).toBe('empty');
    expect(listbox(el).matches(':popover-open')).toBe(false);
    expect(input(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('moves with the arrows through aria-activedescendant and selects with Enter', async () => {
    const el = await fixture(html);
    type(el, 'i');
    expect(active(el)).toBe(null);
    expect(key(input(el), 'ArrowDown').defaultPrevented).toBe(true);
    expect(active(el).value).toBe('pod');
    expect(input(el).ariaActiveDescendantElement).toBe(active(el));
    key(input(el), 'ArrowDown');
    key(input(el), 'ArrowDown');
    expect(active(el).value).toBe('izm');
    key(input(el), 'ArrowDown');
    expect(active(el).value).toBe('izm');
    key(input(el), 'ArrowUp');
    expect(active(el).value).toBe('ist');
    const changed = once(el, 'punica-change');
    const closed = once(el, 'punica-close');
    expect(key(input(el), 'Enter').defaultPrevented).toBe(true);
    expect((await changed).detail).toEqual({ value: 'ist' });
    expect((await closed).detail).toEqual({ reason: 'select' });
    await settle();
    expect(el.value).toBe('ist');
    expect(input(el).value).toBe('Istanbul');
    expect(el.shadowRoot.activeElement).toBe(input(el));
    expect(rows(el).find((o) => o.selected).value).toBe('ist');
  });

  it('opens with ArrowDown on the first option and closes on Escape', async () => {
    const el = await fixture(html);
    input(el).focus();
    key(input(el), 'ArrowDown');
    await settle();
    expect(el.open).toBe(true);
    expect(shown(el).length).toBe(4);
    expect(active(el).value).toBe('pod');
    const closed = once(el, 'punica-close');
    key(input(el), 'Escape');
    expect((await closed).detail.reason).toBe('escape');
    expect(el.value).toBe(null);
  });

  it('selects on click and skips a disabled option', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    el.querySelector('[value="bud"]').click();
    await settle();
    expect(el.value).toBe(null);
    const changed = once(el, 'punica-change');
    el.querySelector('[value="izm"]').click();
    expect((await changed).detail.value).toBe('izm');
    expect(input(el).value).toBe('Izmir');
  });

  it('show-value: finds a row by its value or its label, shows the value, and takes free text, as an input with a datalist', async () => {
    const el = await fixture('<punica-autocomplete label="Account" show-value free-text></punica-autocomplete>');
    el.options = [
      { value: '1200', label: 'Bank account' },
      { value: '2410', label: 'Suppliers' }
    ];
    await settle();
    type(el, 'supp');
    await settle();
    expect(shown(el)).toHaveLength(1);
    const row = rows(el).find((o) => !o.hidden);
    expect(row.value).toBe('2410');
    expect(row.querySelector('[part="option-label"]').textContent).toBe('Suppliers');
    row.click();
    await settle();
    expect(el.value).toBe('2410');
    expect(input(el).value).toBe('2410');
    type(el, '12');
    await settle();
    expect(rows(el).filter((o) => !o.hidden).map((o) => o.value)).toEqual(['1200']);
    type(el, '1200');
    input(el).blur();
    await settle();
    expect(el.value).toBe('1200');
    expect(input(el).value).toBe('1200');
    type(el, '9999');
    input(el).blur();
    await settle();
    expect(el.value).toBe('9999');
  });

  it('takes typed text that names an option, and puts back text that names none', async () => {
    const el = await fixture(html);
    type(el, 'podgorica');
    const changed = once(el, 'punica-change');
    input(el).blur();
    expect((await changed).detail.value).toBe('pod');
    await settle();
    expect(input(el).value).toBe('Podgorica');
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    type(el, 'Atlantis');
    input(el).blur();
    await settle();
    expect(el.value).toBe('pod');
    expect(input(el).value).toBe('Podgorica');
    expect(changes).toBe(0);
    type(el, '');
    input(el).blur();
    await settle();
    expect(el.value).toBe(null);
    expect(changes).toBe(1);
  });

  it('takes any text with free-text', async () => {
    const el = await fixture(html.replace('<punica-autocomplete', '<punica-autocomplete free-text'));
    type(el, 'Atlantis');
    const changed = once(el, 'punica-change');
    key(input(el), 'Enter');
    expect((await changed).detail).toEqual({ value: 'Atlantis' });
    await settle();
    expect(el.value).toBe('Atlantis');
    expect(input(el).value).toBe('Atlantis');
  });

  it('shows rows from an options array that arrives later', async () => {
    const el = await fixture('<punica-autocomplete label="User" no-filter></punica-autocomplete>');
    el.addEventListener('punica-input', (event) => {
      const text = event.detail.value;
      Promise.resolve().then(() => {
        el.options = [{ value: 'u1', label: `${text} One` }, { value: 'u2', label: `${text} Two`, disabled: true }, 'plain'];
      });
    });
    type(el, 'ada');
    expect(listbox(el).matches(':popover-open')).toBe(false);
    await settle();
    expect(listbox(el).matches(':popover-open')).toBe(true);
    expect(shown(el)).toEqual(['ada One', 'ada Two', 'plain']);
    expect(rows(el)[1].disabled).toBe(true);
    key(input(el), 'ArrowDown');
    key(input(el), 'Enter');
    await settle();
    expect(el.value).toBe('u1');
    expect(input(el).value).toBe('ada One');
  });

  it('clears with the clear button', async () => {
    const el = await fixture(html.replace('<punica-autocomplete', '<punica-autocomplete clearable value="ist"'));
    await settle();
    expect(input(el).value).toBe('Istanbul');
    const clear = el.shadowRoot.querySelector('[part="clear"]');
    expect(clear.hidden).toBe(false);
    expect(clear.getAttribute('aria-label')).toBe('Clear');
    const changed = once(el, 'punica-change');
    clear.click();
    expect((await changed).detail.value).toBe(null);
    expect(input(el).value).toBe('');
  });

  it('keeps two open instances apart', async () => {
    const wrap = await fixture(`<div>${html}${html.replace('City', 'Second')}</div>`);
    const [a, b] = wrap.children;
    a.show();
    b.show();
    await settle();
    expect(listbox(a).matches(':popover-open')).toBe(true);
    expect(listbox(b).matches(':popover-open')).toBe(true);
    b.querySelector('[value="izm"]').click();
    await settle();
    expect(b.value).toBe('izm');
    expect(a.value).toBe(null);
    expect(a.open).toBe(true);
    expect(shown(a).length).toBe(4);
  });

  it('renders a label holding markup as text', async () => {
    window.__xss = 0;
    const evil = '<img src=x onerror="window.__xss=1">';
    const el = await fixture('<punica-autocomplete label="Risky"></punica-autocomplete>');
    el.options = [{ value: 'x', label: evil }];
    el.show();
    await settle();
    const row = rows(el)[0];
    expect(row.textContent).toBe(evil);
    expect(row.querySelector('img')).toBe(null);
    row.click();
    await settle();
    expect(input(el).value).toBe(evil);
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    await new Promise((r) => setTimeout(r, 50));
    expect(window.__xss).toBe(0);
  });

  it('fires nothing for a programmatic value', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.value = 'izm';
    await settle();
    expect(input(el).value).toBe('Izmir');
    expect(changes).toBe(0);
  });

  it('has no axe violations while open', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    key(input(el), 'ArrowDown');
    await new Promise((r) => setTimeout(r, 250));
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  describe('in a form', () => {
    const form = (attrs = '') => `<form><punica-autocomplete label="City" name="city" ${attrs}>
      <punica-option value="pod">Podgorica</punica-option>
      <punica-option value="ist">Istanbul</punica-option>
    </punica-autocomplete></form>`;

    it('appears in FormData with the option value', async () => {
      const f = await fixture(form('value="ist"'));
      expect(new FormData(f).get('city')).toBe('ist');
      await settle();
      expect(input(f.firstElementChild).value).toBe('Istanbul');
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form('value="ist" disabled'));
      expect(new FormData(f).has('city')).toBe(false);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form('value="ist"'));
      const el = f.firstElementChild;
      await settle();
      type(el, 'pod');
      key(input(el), 'ArrowDown');
      key(input(el), 'Enter');
      await settle();
      expect(new FormData(f).get('city')).toBe('pod');
      f.reset();
      await settle();
      expect(el.value).toBe('ist');
      expect(input(el).value).toBe('Istanbul');
      expect(new FormData(f).get('city')).toBe('ist');
    });

    it('blocks checkValidity when required and empty', async () => {
      const f = await fixture(form('required'));
      const el = f.firstElementChild;
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      el.value = 'pod';
      await settle();
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(`<form><fieldset disabled>${form('value="ist"').replace(/<\/?form>/g, '')}</fieldset></form>`);
      await settle();
      const el = f.querySelector('punica-autocomplete');
      expect(input(el).disabled).toBe(true);
      expect(new FormData(f).has('city')).toBe(false);
    });

    it('submits the form on Enter with the typed value', async () => {
      const f = await fixture(form('free-text'));
      let data = null;
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        data = new FormData(f).get('city');
      });
      const el = f.firstElementChild;
      type(el, 'Bar');
      key(input(el), 'Enter');
      expect(data).toBe('Bar');
    });
  });
});
