import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './input.js';

contract('punica-input', {
  html: '<punica-input label="Name" value="Ada" clearable></punica-input>'
});

const entries = (form) => [...new FormData(form)];

describe('punica-input', () => {
  afterEach(cleanup);

  it('is named by an aria-label on the element, label first', async () => {
    const el = await fixture(
      '<punica-input aria-label="Hook token"></punica-input>'
    );
    await settle();
    const inner = el.shadowRoot.querySelector('input');
    expect(inner.getAttribute('aria-label')).toBe('Hook token');
    el.label = 'Token';
    await settle();
    expect(inner.getAttribute('aria-label')).toBe('Token');
  });

  it('types into a native input and fires punica-input, then punica-change on commit', async () => {
    const el = await fixture('<punica-input label="Name"></punica-input>');
    const seen = [];
    el.addEventListener('punica-input', (e) =>
      seen.push(['input', e.detail.value, e.bubbles, e.composed])
    );
    el.addEventListener('punica-change', (e) =>
      seen.push(['change', e.detail.value, e.bubbles, e.composed])
    );
    await userEvent.tab();
    expect(el.shadowRoot.activeElement).toBe(
      el.shadowRoot.querySelector('input')
    );
    await userEvent.keyboard('ab');
    expect(el.value).toBe('ab');
    await userEvent.tab();
    expect(seen).toEqual([
      ['input', 'a', true, true],
      ['input', 'ab', true, true],
      ['change', 'ab', true, true]
    ]);
  });

  it('fires no synthetic event under a native name', async () => {
    const el = await fixture('<punica-input label="Name"></punica-input>');
    const synthetic = [];
    for (const type of ['focus', 'blur', 'input', 'keydown', 'change']) {
      el.addEventListener(
        type,
        (e) => e instanceof CustomEvent && synthetic.push(type)
      );
    }
    el.focus();
    await userEvent.keyboard('a');
    await userEvent.tab();
    expect(synthetic).toEqual([]);
  });

  it('keeps the value attribute as the default while the user types', async () => {
    const el = await fixture(
      '<punica-input label="Name" value="Ada"></punica-input>'
    );
    el.focus();
    el.select();
    await userEvent.keyboard('Grace');
    expect(el.value).toBe('Grace');
    expect(el.getAttribute('value')).toBe('Ada');
  });

  it('fires nothing on a programmatic change, and null empties without writing "null"', async () => {
    const el = await fixture(
      '<punica-input label="Name" value="Ada"></punica-input>'
    );
    let fired = 0;
    el.addEventListener('punica-input', () => fired++);
    el.addEventListener('punica-change', () => fired++);
    el.value = 'Grace';
    await settle();
    expect(el.shadowRoot.querySelector('input').value).toBe('Grace');
    el.value = null;
    el.placeholder = null;
    await settle();
    expect(el.value).toBe('');
    expect(el.shadowRoot.querySelector('input').value).toBe('');
    expect(el.hasAttribute('placeholder')).toBe(false);
    expect(fired).toBe(0);
  });

  it('passes its constraints and hints to the native input', async () => {
    const el = await fixture(
      '<punica-input label="Code" type="email" placeholder="you@example.com" readonly required pattern=".+@.+" minlength="3" maxlength="40" autocomplete="email" inputmode="email"></punica-input>'
    );
    const input = el.shadowRoot.querySelector('input');
    expect(input.type).toBe('email');
    expect(input.placeholder).toBe('you@example.com');
    expect(input.readOnly).toBe(true);
    expect(input.required).toBe(true);
    expect(input.pattern).toBe('.+@.+');
    expect(input.minLength).toBe(3);
    expect(input.maxLength).toBe(40);
    expect(input.autocomplete).toBe('email');
    expect(input.inputMode).toBe('email');
    expect(input.getAttribute('aria-label')).toBe('Code');
  });

  it('mirrors the native validity and message', async () => {
    const el = await fixture(
      '<punica-input label="Mail" type="email" value="nope"></punica-input>'
    );
    expect(el.validity.typeMismatch).toBe(true);
    expect(el.validationMessage).toBe(
      el.shadowRoot.querySelector('input').validationMessage
    );
    expect(el.matches(':state(invalid)')).toBe(true);
    el.value = 'a@b.co';
    await settle();
    expect(el.validity.valid).toBe(true);
    el.setCustomValidity('Taken');
    expect(el.validationMessage).toBe('Taken');
    el.setCustomValidity('');
    expect(el.checkValidity()).toBe(true);
  });

  it('follows a validity that changes while the value stays empty: a half-typed number', async () => {
    const el = await fixture(
      '<punica-input label="Amount" type="number"></punica-input>'
    );
    const inner = el.shadowRoot.querySelector('input');
    await userEvent.type(inner, '1e');
    await settle();
    expect(el.value).toBe('');
    expect(inner.validity.badInput).toBe(true);
    expect(el.validity.badInput).toBe(true);
    expect(el.checkValidity()).toBe(false);
    await userEvent.clear(inner);
    await userEvent.type(inner, '12');
    await settle();
    expect(el.validity.valid).toBe(true);
  });

  it('keeps what is wrong with the value beside a custom error, as a native input does', async () => {
    const el = await fixture(
      '<punica-input label="Amount" type="number"></punica-input>'
    );
    const inner = el.shadowRoot.querySelector('input');
    await userEvent.type(inner, '1e');
    await settle();
    el.setCustomValidity('Not a number');
    expect(el.validity.customError).toBe(true);
    expect(el.validity.badInput).toBe(true);
    expect(el.validationMessage).toBe('Not a number');
    el.setCustomValidity('');
    expect(el.validity.customError).toBe(false);
    expect(el.validity.badInput).toBe(true);
  });

  it('marks user-invalid only after the user leaves the field', async () => {
    const el = await fixture(
      '<punica-input label="Name" required></punica-input>'
    );
    expect(el.matches(':state(user-invalid)')).toBe(false);
    el.focus();
    await userEvent.tab();
    expect(el.matches(':state(user-invalid)')).toBe(true);
  });

  it('clears from the clear button and says so', async () => {
    const el = await fixture(
      '<punica-input label="Name" value="Ada" clearable></punica-input>'
    );
    const clear = el.shadowRoot.querySelector('[part=clear]');
    expect(clear.hidden).toBe(false);
    expect(clear.getAttribute('aria-label')).toBe('Clear');
    const seen = [];
    el.addEventListener('punica-input', (e) =>
      seen.push(['input', e.detail.value])
    );
    el.addEventListener('punica-change', (e) =>
      seen.push(['change', e.detail.value])
    );
    clear.click();
    await settle();
    expect(el.value).toBe('');
    expect(clear.hidden).toBe(true);
    expect(seen).toEqual([
      ['input', ''],
      ['change', '']
    ]);
  });

  it('selects text through select() and setSelectionRange()', async () => {
    const el = await fixture(
      '<punica-input label="Name" value="Ada Lovelace"></punica-input>'
    );
    const input = el.shadowRoot.querySelector('input');
    el.focus();
    el.select();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 12]);
    el.setSelectionRange(4, 12);
    expect([input.selectionStart, input.selectionEnd]).toEqual([4, 12]);
  });

  it('submits with its form, and Enter requests the submit', async () => {
    const form = await fixture(
      '<form><punica-input name="who" label="Who" value="Ada"></punica-input></form>'
    );
    const el = form.querySelector('punica-input');
    expect(entries(form)).toEqual([['who', 'Ada']]);
    let submitted = null;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted = entries(form);
    });
    el.focus();
    await userEvent.keyboard('!{Enter}');
    expect(submitted).toEqual([['who', 'Ada!']]);
  });

  it('is left out of the form data when disabled', async () => {
    const form = await fixture(
      '<form><punica-input name="who" label="Who" value="Ada" disabled></punica-input></form>'
    );
    expect(entries(form)).toEqual([]);
    form.firstElementChild.disabled = false;
    await settle();
    expect(entries(form)).toEqual([['who', 'Ada']]);
  });

  it('goes back to the value attribute on form.reset()', async () => {
    const form = await fixture(
      '<form><punica-input name="who" label="Who" value="Ada"></punica-input></form>'
    );
    const el = form.firstElementChild;
    el.focus();
    await userEvent.keyboard(' Lovelace');
    expect(el.value).toBe('Ada Lovelace');
    form.reset();
    await settle();
    expect(el.value).toBe('Ada');
    expect(el.shadowRoot.querySelector('input').value).toBe('Ada');
    expect(entries(form)).toEqual([['who', 'Ada']]);
  });

  it('blocks checkValidity() when required and empty', async () => {
    const form = await fixture(
      '<form><punica-input name="who" label="Who" required></punica-input></form>'
    );
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage).not.toBe('');
    el.value = 'Ada';
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture(
      '<form><fieldset disabled><punica-input name="who" label="Who" value="Ada"></punica-input></fieldset></form>'
    );
    await settle();
    const el = form.querySelector('punica-input');
    expect(el.shadowRoot.querySelector('input').disabled).toBe(true);
    expect(el.matches(':state(disabled)')).toBe(true);
    expect(entries(form)).toEqual([]);
  });

  it('is named by a <label for>', async () => {
    const wrap = await fixture(
      '<div><label for="i1">Email</label><punica-input id="i1"></punica-input></div>'
    );
    const el = wrap.querySelector('punica-input');
    expect(
      el.shadowRoot.querySelector('input').getAttribute('aria-label')
    ).toBe('Email');
    wrap.querySelector('label').click();
    expect(el.matches(':focus')).toBe(true);
  });
});
