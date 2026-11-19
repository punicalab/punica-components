import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './textarea.js';

contract('punica-textarea', { html: '<punica-textarea label="Notes" value="Hello"></punica-textarea>' });

const entries = (form) => [...new FormData(form)];

describe('punica-textarea', () => {
  afterEach(cleanup);

  it('types into a native textarea and fires punica-input, then punica-change on commit', async () => {
    const el = await fixture('<punica-textarea label="Notes"></punica-textarea>');
    const seen = [];
    el.addEventListener('punica-input', (e) => seen.push(['input', e.detail.value]));
    el.addEventListener('punica-change', (e) => seen.push(['change', e.detail.value]));
    await userEvent.tab();
    expect(el.shadowRoot.activeElement).toBe(el.shadowRoot.querySelector('textarea'));
    await userEvent.keyboard('a{Enter}b');
    expect(el.value).toBe('a\nb');
    await userEvent.tab();
    expect(seen).toEqual([['input', 'a'], ['input', 'a\n'], ['input', 'a\nb'], ['change', 'a\nb']]);
  });

  it('does not submit the form on Enter', async () => {
    const form = await fixture('<form><punica-textarea name="n" label="Notes"></punica-textarea></form>');
    let submits = 0;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submits++;
    });
    form.firstElementChild.focus();
    await userEvent.keyboard('a{Enter}');
    expect(submits).toBe(0);
  });

  it('keeps the value attribute as the default and fires nothing on a programmatic change', async () => {
    const el = await fixture('<punica-textarea label="Notes" value="Hello"></punica-textarea>');
    let fired = 0;
    el.addEventListener('punica-input', () => fired++);
    el.addEventListener('punica-change', () => fired++);
    el.value = 'Changed';
    await settle();
    expect(el.shadowRoot.querySelector('textarea').value).toBe('Changed');
    expect(el.getAttribute('value')).toBe('Hello');
    el.value = null;
    await settle();
    expect(el.value).toBe('');
    expect(fired).toBe(0);
  });

  it('passes rows, constraints and the name to the native textarea', async () => {
    const el = await fixture('<punica-textarea label="Notes" rows="5" placeholder="Write" readonly minlength="2" maxlength="9"></punica-textarea>');
    const inner = el.shadowRoot.querySelector('textarea');
    expect(inner.rows).toBe(5);
    expect(inner.placeholder).toBe('Write');
    expect(inner.readOnly).toBe(true);
    expect(inner.minLength).toBe(2);
    expect(inner.maxLength).toBe(9);
    expect(inner.getAttribute('aria-label')).toBe('Notes');
  });

  it('grows with its content when resize is auto, and not otherwise', async () => {
    const auto = await fixture('<punica-textarea label="Notes" resize="auto" rows="2"></punica-textarea>');
    const fixed = await fixture('<punica-textarea label="Notes" rows="2"></punica-textarea>');
    const height = (el) => el.shadowRoot.querySelector('textarea').getBoundingClientRect().height;
    const before = [height(auto), height(fixed)];
    const long = Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n');
    auto.value = long;
    fixed.value = long;
    await settle();
    expect(height(auto)).toBeGreaterThan(before[0] * 2);
    expect(height(fixed)).toBe(before[1]);
    auto.value = '';
    await settle();
    expect(height(auto)).toBe(before[0]);
  });

  it('mirrors the native validity and marks user-invalid after blur', async () => {
    const el = await fixture('<punica-textarea label="Notes" required></punica-textarea>');
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage).toBe(el.shadowRoot.querySelector('textarea').validationMessage);
    expect(el.matches(':state(user-invalid)')).toBe(false);
    el.focus();
    await userEvent.tab();
    expect(el.matches(':state(user-invalid)')).toBe(true);
  });

  it('selects text through select() and setSelectionRange()', async () => {
    const el = await fixture('<punica-textarea label="Notes" value="Hello there"></punica-textarea>');
    const inner = el.shadowRoot.querySelector('textarea');
    el.focus();
    el.select();
    expect([inner.selectionStart, inner.selectionEnd]).toEqual([0, 11]);
    el.setSelectionRange(6, 11);
    expect([inner.selectionStart, inner.selectionEnd]).toEqual([6, 11]);
  });

  it('appears in the form data, and is left out when disabled', async () => {
    const form = await fixture('<form><punica-textarea name="n" label="Notes" value="Hello"></punica-textarea></form>');
    const el = form.firstElementChild;
    expect(entries(form)).toEqual([['n', 'Hello']]);
    el.disabled = true;
    await settle();
    expect(entries(form)).toEqual([]);
  });

  it('goes back to the value attribute on form.reset()', async () => {
    const form = await fixture('<form><punica-textarea name="n" label="Notes" value="Hello"></punica-textarea></form>');
    const el = form.firstElementChild;
    el.focus();
    await userEvent.keyboard('!');
    expect(el.value).not.toBe('Hello');
    form.reset();
    await settle();
    expect(el.value).toBe('Hello');
    expect(entries(form)).toEqual([['n', 'Hello']]);
  });

  it('blocks checkValidity() when required and empty', async () => {
    const form = await fixture('<form><punica-textarea name="n" label="Notes" required></punica-textarea></form>');
    expect(form.checkValidity()).toBe(false);
    form.firstElementChild.value = 'x';
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-textarea name="n" label="Notes" value="Hello"></punica-textarea></fieldset></form>');
    await settle();
    expect(form.querySelector('punica-textarea').shadowRoot.querySelector('textarea').disabled).toBe(true);
    expect(entries(form)).toEqual([]);
  });
});
