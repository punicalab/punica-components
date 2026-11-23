import { describe, it, expect, afterEach } from 'vitest';
import {
  contract,
  fixture,
  cleanup,
  settle,
  once,
  a11y
} from '../../../test/contract.js';
import './select.js';

const html = `<punica-select label="Country" name="country" placeholder="Pick one">
  <punica-option value="tr">Türkiye</punica-option>
  <punica-option value="me">Montenegro</punica-option>
  <punica-option value="de" disabled>Germany</punica-option>
  <punica-option value="fr">France</punica-option>
</punica-select>`;

const key = (el, k, init = {}) => {
  const event = new KeyboardEvent('keydown', {
    key: k,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...init
  });
  el.dispatchEvent(event);
  return event;
};
const trigger = (el) => el.shadowRoot.querySelector('[part="trigger"]');
const listbox = (el) => el.shadowRoot.querySelector('[part="listbox"]');
const active = (el) => el.options.find((o) => o.active) || null;

contract('punica-select', { html, open: (el) => el.show() });
contract('punica-option', {
  html: '<div role="listbox" aria-label="Fruit"><punica-option value="a">Apple</punica-option></div>'
});

describe('punica-option', () => {
  afterEach(cleanup);

  it('is named by an aria-label on the element, label first', async () => {
    const el = await fixture(
      '<punica-select aria-label="Hook token"></punica-select>'
    );
    await settle();
    const inner = el.shadowRoot.querySelector(
      '[part="combobox"], [role="combobox"]'
    );
    expect(inner.getAttribute('aria-label')).toBe('Hook token');
    el.label = 'Token';
    await settle();
    expect(inner.getAttribute('aria-label')).toBe('Token');
  });

  it('is a dumb option row: role, selected and label through internals', async () => {
    const wrap = await fixture(
      '<div role="listbox" aria-label="Fruit"><punica-option value="a" selected>Apple</punica-option><punica-option label="Pear"></punica-option></div>'
    );
    const [a, b] = wrap.children;
    expect(a.internals.role).toBe('option');
    expect(a.internals.ariaSelected).toBe('true');
    expect(a.text).toBe('Apple');
    expect(a.optionValue).toBe('a');
    expect(b.text).toBe('Pear');
    expect(b.optionValue).toBe('Pear');
    b.active = true;
    await settle();
    expect(b.matches(':state(active)')).toBe(true);
    expect(b.hasAttribute('active')).toBe(false);
  });
});

describe('punica-select', () => {
  afterEach(cleanup);

  it('is touched when reported invalid, as the text controls are: aria-invalid for any error, and its description', async () => {
    const el = await fixture(html);
    el.required = true;
    el.description = 'Where you live';
    await settle();
    expect(trigger(el).hasAttribute('aria-invalid')).toBe(false);
    expect(trigger(el).getAttribute('aria-description')).toBe('Where you live');
    el.checkValidity();
    await settle();
    expect(el.matches(':state(user-invalid)')).toBe(true);
    expect(trigger(el).getAttribute('aria-invalid')).toBe('true');
    el.required = false;
    el.setCustomValidity('Pick the country you bill in');
    await settle();
    expect(trigger(el).getAttribute('aria-invalid')).toBe('true');
    el.setCustomValidity('');
    await settle();
    expect(trigger(el).hasAttribute('aria-invalid')).toBe(false);
  });

  it('shows and submits an option whose value is the empty string, as a native select does ("Any client")', async () => {
    const form = await fixture(
      '<form><punica-select name="client" value=""><punica-option value="">Any client</punica-option><punica-option value="c1">Acme</punica-option></punica-select></form>'
    );
    const el = form.querySelector('punica-select');
    await settle();
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'Any client'
    );
    expect(el.matches(':state(placeholder)')).toBe(false);
    expect(el.selectedOptions.map((o) => o.textContent)).toEqual([
      'Any client'
    ]);
    expect(new FormData(form).get('client')).toBe('');
    // As a native required select, the empty-valued option is no answer.
    el.required = true;
    await settle();
    expect(el.validity.valueMissing).toBe(true);
    el.value = 'c1';
    await settle();
    expect(el.validity.valueMissing).toBe(false);
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'Acme'
    );
  });

  it('is as wide as its widest option, as a native select is: picking another does not resize it', async () => {
    const el = await fixture(
      '<punica-select style="--punica-select-min-width: 0"><punica-option value="a">A</punica-option><punica-option value="long">A much longer option than the others</punica-option></punica-select>'
    );
    await settle();
    const first = el.getBoundingClientRect().width;
    el.value = 'long';
    await settle();
    expect(el.getBoundingClientRect().width).toBe(first);
    const value = el.shadowRoot.querySelector('[part="value"]');
    expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth);
    // In a narrower container it narrows, and the value ends in an ellipsis.
    el.style.inlineSize = '80px';
    await settle();
    expect(el.getBoundingClientRect().width).toBe(80);
  });

  it('takes its first enabled option when nothing is marked and it has no placeholder, as a native select does', async () => {
    const form = await fixture(
      '<form><punica-select name="metric"><punica-option value="a" disabled>A</punica-option><punica-option value="b">B</punica-option><punica-option value="c">C</punica-option></punica-select></form>'
    );
    const el = form.querySelector('punica-select');
    await settle();
    expect(el.value).toBe('b');
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe('B');
    expect(el.matches(':state(placeholder)')).toBe(false);
    expect(new FormData(form).get('metric')).toBe('b');
    // The empty-valued first option is a choice too ("Whole firm").
    const any = await fixture(
      '<punica-select><punica-option value="">Whole firm</punica-option><punica-option value="x">X</punica-option></punica-select>'
    );
    await settle();
    expect(any.value).toBe('');
    expect(any.shadowRoot.querySelector('[part="value"]').textContent).toBe('Whole firm');
  });

  it('takes the first option of options added after it, until a value is set', async () => {
    const el = await fixture('<punica-select></punica-select>');
    await settle();
    expect(el.value).toBe(null);
    const option = (value) => Object.assign(document.createElement('punica-option'), { value, textContent: value.toUpperCase() });
    el.append(option('x'), option('y'));
    await settle();
    expect(el.value).toBe('x');
    el.value = 'y';
    el.replaceChildren(option('p'), option('y'));
    await settle();
    expect(el.value).toBe('y');
  });

  it('stays empty with a placeholder, multiple or not', async () => {
    const one = await fixture(
      '<punica-select placeholder="Pick one"><punica-option value="a">A</punica-option></punica-select>'
    );
    const many = await fixture(
      '<punica-select multiple><punica-option value="a">A</punica-option></punica-select>'
    );
    await settle();
    expect(one.value).toBe(null);
    expect(one.matches(':state(placeholder)')).toBe(true);
    expect(many.value).toEqual([]);
  });

  it('with no empty-valued option, the empty string is nothing picked', async () => {
    const el = await fixture(
      '<punica-select value="" placeholder="Pick one"><punica-option value="a">A</punica-option></punica-select>'
    );
    await settle();
    expect(el.matches(':state(placeholder)')).toBe(true);
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'Pick one'
    );
  });

  it('is a combobox button over a listbox in its own shadow root', async () => {
    const el = await fixture(html);
    const button = trigger(el);
    expect(button.localName).toBe('button');
    expect(button.getAttribute('role')).toBe('combobox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Country');
    expect(
      el.shadowRoot.getElementById(button.getAttribute('aria-controls'))
    ).toBe(listbox(el));
    expect(listbox(el).getAttribute('role')).toBe('listbox');
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'Pick one'
    );
    // Nothing of the 1.x global surface is left.
    expect(document.getElementById('select')).toBe(null);
    expect(document.body.querySelector(':scope > style')).toBe(null);
    expect(Object.hasOwn(HTMLElement.prototype, 'click')).toBe(true);
    expect(HTMLElement.prototype.click.toString()).toContain('[native code]');
  });

  it('opens with Enter, Space, ArrowDown and ArrowUp, in the top layer', async () => {
    for (const k of ['Enter', ' ', 'ArrowDown', 'ArrowUp']) {
      const el = await fixture(html);
      const opened = once(el, 'punica-open');
      const event = key(trigger(el), k);
      await opened;
      expect(event.defaultPrevented).toBe(true);
      expect(el.open).toBe(true);
      expect(listbox(el).matches(':popover-open')).toBe(true);
      expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
      expect(active(el).value).toBe('tr');
      cleanup();
    }
  });

  it('moves with arrows, Home and End, skipping disabled rows, and names the active row', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    const button = trigger(el);
    expect(button.ariaActiveDescendantElement).toBe(el.options[0]);
    key(button, 'ArrowDown');
    expect(active(el).value).toBe('me');
    key(button, 'ArrowDown');
    expect(active(el).value).toBe('fr');
    key(button, 'ArrowDown');
    expect(active(el).value).toBe('fr');
    key(button, 'Home');
    expect(active(el).value).toBe('tr');
    key(button, 'End');
    expect(active(el).value).toBe('fr');
    key(button, 'ArrowUp');
    expect(active(el).value).toBe('me');
    expect(button.ariaActiveDescendantElement).toBe(el.options[1]);
    expect(el.options.filter((o) => o.active).length).toBe(1);
  });

  it('selects with Enter, fires punica-change and punica-close, and shows the label', async () => {
    const el = await fixture(html);
    const button = trigger(el);
    button.focus();
    key(button, 'ArrowDown');
    await settle();
    key(button, 'ArrowDown');
    const changed = once(el, 'punica-change');
    const closed = once(el, 'punica-close');
    key(button, 'Enter');
    expect((await changed).detail).toEqual({ value: 'me' });
    expect((await closed).detail).toEqual({ reason: 'select' });
    await settle();
    expect(el.value).toBe('me');
    expect(el.open).toBe(false);
    expect(listbox(el).matches(':popover-open')).toBe(false);
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'Montenegro'
    );
    expect(el.options[1].selected).toBe(true);
    expect(el.options[1].internals.ariaSelected).toBe('true');
    expect(el.options[0].selected).toBe(false);
    expect(el.shadowRoot.activeElement).toBe(button);
  });

  it('closes on Escape without changing the value', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.show();
    await settle();
    key(trigger(el), 'ArrowDown');
    const closed = once(el, 'punica-close');
    key(trigger(el), 'Escape');
    expect((await closed).detail.reason).toBe('escape');
    expect(el.value).toBe(null);
    expect(changes).toBe(0);
  });

  it('Tab selects the highlighted option and lets focus move on', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    key(trigger(el), 'End');
    const event = key(trigger(el), 'Tab');
    await settle();
    expect(event.defaultPrevented).toBe(false);
    expect(el.value).toBe('fr');
    expect(el.open).toBe(false);
  });

  it('moves by type-ahead, open and closed', async () => {
    const el = await fixture(html);
    key(trigger(el), 'f');
    await settle();
    expect(el.open).toBe(true);
    expect(active(el).value).toBe('fr');
    key(trigger(el), 'Escape');
    await settle();
    el.show();
    await settle();
    await new Promise((r) => setTimeout(r, 550));
    key(trigger(el), 'm');
    expect(active(el).value).toBe('me');
  });

  it('selects on click and ignores a disabled option', async () => {
    const el = await fixture(html);
    trigger(el).click();
    await settle();
    expect(el.open).toBe(true);
    el.options[2].click();
    await settle();
    expect(el.value).toBe(null);
    expect(el.open).toBe(true);
    const changed = once(el, 'punica-change');
    el.options[3].click();
    expect((await changed).detail.value).toBe('fr');
  });

  it('fires nothing for a programmatic value', async () => {
    const el = await fixture(html);
    let changes = 0;
    el.addEventListener('punica-change', () => changes++);
    el.value = 'fr';
    await settle();
    expect(changes).toBe(0);
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'France'
    );
  });

  it('takes several values with multiple and stays open', async () => {
    const el = await fixture(
      html.replace('<punica-select', '<punica-select multiple')
    );
    expect(el.value).toEqual([]);
    el.show();
    await settle();
    expect(listbox(el).getAttribute('aria-multiselectable')).toBe('true');
    key(trigger(el), 'End');
    key(trigger(el), 'Enter');
    key(trigger(el), 'Home');
    const changed = once(el, 'punica-change');
    key(trigger(el), ' ');
    expect((await changed).detail.value).toEqual(['tr', 'fr']);
    await settle();
    expect(el.open).toBe(true);
    expect(el.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'Türkiye, France'
    );
    key(trigger(el), ' ');
    await settle();
    expect(el.value).toEqual(['fr']);
  });

  it('clears with the clear button', async () => {
    const el = await fixture(
      html.replace('<punica-select', '<punica-select clearable value="tr"')
    );
    const clear = el.shadowRoot.querySelector('[part="clear"]');
    expect(clear.hidden).toBe(false);
    expect(clear.getAttribute('aria-label')).toBe('Clear');
    const changed = once(el, 'punica-change');
    clear.click();
    expect((await changed).detail.value).toBe(null);
    await settle();
    expect(clear.hidden).toBe(true);
  });

  it('takes its default from the value attribute or a selected option', async () => {
    const a = await fixture(
      html.replace('<punica-select', '<punica-select value="me"')
    );
    expect(a.value).toBe('me');
    const b = await fixture(html.replace('value="fr"', 'value="fr" selected'));
    await settle();
    expect(b.value).toBe('fr');
    expect(b.shadowRoot.querySelector('[part="value"]').textContent).toBe(
      'France'
    );
  });

  it('keeps two open selects apart', async () => {
    const wrap = await fixture(
      `<div>${html}${html.replace('Country', 'Second')}</div>`
    );
    const [a, b] = wrap.querySelectorAll('punica-select');
    a.show();
    b.show();
    await settle();
    expect(listbox(a).matches(':popover-open')).toBe(true);
    expect(listbox(b).matches(':popover-open')).toBe(true);
    key(trigger(b), 'ArrowDown');
    key(trigger(b), 'Enter');
    await settle();
    expect(b.value).toBe('me');
    expect(a.value).toBe(null);
    expect(a.open).toBe(true);
    expect(active(a).value).toBe('tr');
    const ra = listbox(a).getBoundingClientRect();
    const ta = a.getBoundingClientRect();
    expect(Math.abs(ra.left - ta.left)).toBeLessThan(2);
    expect(ra.width).toBeGreaterThanOrEqual(ta.width - 1);
    expect(ra.top).toBeGreaterThanOrEqual(ta.bottom);
  });

  it('closes on a pointer press outside', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    el.options[0].dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, composed: true })
    );
    await settle();
    expect(el.open).toBe(true);
    const closed = once(el, 'punica-close');
    document.body.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, composed: true })
    );
    expect((await closed).detail.reason).toBe('outside');
  });

  it('renders an option label holding markup as text', async () => {
    const el = await fixture('<punica-select label="Risky"></punica-select>');
    window.__xss = 0;
    const option = document.createElement('punica-option');
    option.value = 'x';
    option.label = '<img src=x onerror="window.__xss=1">';
    const second = document.createElement('punica-option');
    second.value = 'y';
    second.textContent = '<img src=x onerror="window.__xss=1">';
    el.append(option, second);
    await settle();
    el.value = 'x';
    await settle();
    const shown = el.shadowRoot.querySelector('[part="value"]');
    expect(shown.textContent).toBe('<img src=x onerror="window.__xss=1">');
    el.value = 'y';
    await settle();
    expect(shown.textContent).toBe('<img src=x onerror="window.__xss=1">');
    expect(el.shadowRoot.querySelector('img')).toBe(null);
    expect(option.shadowRoot.querySelector('img')).toBe(null);
    await new Promise((r) => setTimeout(r, 50));
    expect(window.__xss).toBe(0);
  });

  it('has no axe violations while open', async () => {
    const el = await fixture(html);
    el.show();
    await settle();
    key(trigger(el), 'ArrowDown');
    await new Promise((r) => setTimeout(r, 250));
    expect(await a11y(el.parentElement)).toEqual([]);
  });

  describe('in a form', () => {
    const form = (
      attrs = ''
    ) => `<form><punica-select label="Country" name="country" ${attrs}>
      <punica-option value="tr">Türkiye</punica-option>
      <punica-option value="me">Montenegro</punica-option>
    </punica-select></form>`;

    it('appears in FormData, one entry per value', async () => {
      const f = await fixture(form('value="me"'));
      expect(new FormData(f).get('country')).toBe('me');
      const m = await fixture(form('multiple value="tr me"'));
      expect(new FormData(m).getAll('country')).toEqual(['tr', 'me']);
    });

    it('is left out when disabled', async () => {
      const f = await fixture(form('value="me" disabled'));
      expect(new FormData(f).has('country')).toBe(false);
    });

    it('is restored by form.reset()', async () => {
      const f = await fixture(form('value="me"'));
      const el = f.querySelector('punica-select');
      el.show();
      await settle();
      key(trigger(el), 'Home');
      key(trigger(el), 'Enter');
      await settle();
      expect(new FormData(f).get('country')).toBe('tr');
      f.reset();
      await settle();
      expect(el.value).toBe('me');
      expect(new FormData(f).get('country')).toBe('me');
    });

    it('blocks checkValidity when required and empty', async () => {
      // Empty means a placeholder: without one it takes its first option, as a native select does.
      const f = await fixture(form('required placeholder="Pick a country"'));
      const el = f.querySelector('punica-select');
      expect(f.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      // The browser's own words for an empty required select, not a blank.
      const native = document.createElement('select');
      native.required = true;
      native.append(document.createElement('option'));
      expect(el.validationMessage).toBe(native.validationMessage);
      expect(el.validationMessage.trim()).not.toBe('');
      el.value = 'tr';
      await settle();
      expect(f.checkValidity()).toBe(true);
    });

    it('is disabled by a disabled fieldset', async () => {
      const f = await fixture(
        `<form><fieldset disabled>${form('value="me"').replace(
          /<\/?form>/g,
          ''
        )}</fieldset></form>`
      );
      await settle();
      const el = f.querySelector('punica-select');
      expect(trigger(el).disabled).toBe(true);
      expect(new FormData(f).has('country')).toBe(false);
      key(trigger(el), 'ArrowDown');
      await settle();
      expect(el.open).toBe(false);
    });
  });
});
