import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './numberInput.js';

contract('punica-number-input', { html: '<punica-number-input lang="en-US" label="Quantity" name="qty" value="3" min="0" max="10"></punica-number-input>' });

const entries = (form) => [...new FormData(form)];
const inner = (el) => el.shadowRoot.querySelector('input');
const one = (html) => fixture(`<div lang="en-US">${html}</div>`).then((wrap) => wrap.firstElementChild);

describe('punica-number-input', () => {
  afterEach(cleanup);

  it('is a native decimal input with a spinbutton role and its value in ARIA', async () => {
    const el = await one('<punica-number-input label="Quantity" value="3" min="0" max="10"></punica-number-input>');
    const input = inner(el);
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect([input.getAttribute('role'), input.getAttribute('aria-valuenow'), input.getAttribute('aria-valuemin'), input.getAttribute('aria-valuemax'), input.getAttribute('aria-label')]).toEqual([
      'spinbutton', '3', '0', '10', 'Quantity'
    ]);
    expect(el.value).toBe(3);
    const [down, up] = el.shadowRoot.querySelectorAll('button');
    expect([down.getAttribute('aria-label'), up.getAttribute('aria-label')]).toEqual(['Decrease', 'Increase']);
    await userEvent.tab();
    expect(el.shadowRoot.activeElement).toBe(input);
    await userEvent.tab();
    expect(el.matches(':focus-within')).toBe(false);
  });

  it('shows an Intl-formatted number at rest and the plain number while focused', async () => {
    const el = await one('<punica-number-input label="Amount" value="1234567.5"></punica-number-input>');
    expect(inner(el).value).toBe('1,234,567.5');
    el.focus();
    expect(inner(el).value).toBe('1234567.5');
    await userEvent.tab();
    expect(inner(el).value).toBe('1,234,567.5');
    el.formatOptions = { style: 'currency', currency: 'EUR' };
    await settle();
    expect(inner(el).value).toBe('€1,234,567.50');
    el.focus();
    expect(inner(el).value).toBe('1234567.5');
  });

  it('formats and reads numbers in the language of the element', async () => {
    const wrap = await fixture('<div lang="de"><punica-number-input label="Betrag" value="1234.5"></punica-number-input></div>');
    const el = wrap.firstElementChild;
    expect(inner(el).value).toBe('1.234,5');
    el.focus();
    expect(inner(el).value).toBe('1234,5');
    el.select();
    await userEvent.keyboard('2,75');
    expect(el.value).toBe(2.75);
  });

  it('reads what is typed, fires punica-input per number and punica-change on commit', async () => {
    const el = await one('<punica-number-input label="Quantity"></punica-number-input>');
    const seen = [];
    el.addEventListener('punica-input', (e) => seen.push(['input', e.detail.value, e.bubbles, e.composed]));
    el.addEventListener('punica-change', (e) => seen.push(['change', e.detail.value, e.bubbles, e.composed]));
    el.focus();
    await userEvent.keyboard('1.5');
    expect(el.value).toBe(1.5);
    expect(inner(el).value).toBe('1.5');
    await userEvent.tab();
    expect(seen).toEqual([
      ['input', 1, true, true],
      ['input', 1.5, true, true],
      ['change', 1.5, true, true]
    ]);
  });

  it('drops text that is not a number when the user leaves', async () => {
    const el = await one('<punica-number-input label="Quantity" value="4"></punica-number-input>');
    const changes = [];
    el.addEventListener('punica-change', (e) => changes.push(e.detail.value));
    el.focus();
    el.select();
    await userEvent.keyboard('abc');
    expect(el.value).toBe(null);
    await userEvent.tab();
    expect(inner(el).value).toBe('');
    expect(changes).toEqual([null]);
  });

  it('clamps a typed number to min and max on commit', async () => {
    const el = await one('<punica-number-input label="Quantity" min="0" max="10"></punica-number-input>');
    const seen = [];
    el.addEventListener('punica-input', (e) => seen.push(['input', e.detail.value]));
    el.addEventListener('punica-change', (e) => seen.push(['change', e.detail.value]));
    el.focus();
    await userEvent.keyboard('99');
    expect(el.value).toBe(99);
    await userEvent.tab();
    expect(el.value).toBe(10);
    expect(inner(el).value).toBe('10');
    expect(seen).toEqual([['input', 9], ['input', 99], ['input', 10], ['change', 10]]);
  });

  it('steps with ArrowUp/ArrowDown, PageUp/PageDown, Home and End inside the range', async () => {
    const el = await one('<punica-number-input label="Quantity" value="5" min="0" max="20" step="0.5"></punica-number-input>');
    const seen = [];
    el.addEventListener('punica-input', (e) => seen.push(['input', e.detail.value]));
    el.addEventListener('punica-change', (e) => seen.push(['change', e.detail.value]));
    el.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(el.value).toBe(5.5);
    expect(inner(el).value).toBe('5.5');
    expect(seen).toEqual([['input', 5.5], ['change', 5.5]]);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(el.value).toBe(4.5);
    await userEvent.keyboard('{PageUp}');
    expect(el.value).toBe(9.5);
    await userEvent.keyboard('{PageDown}{PageDown}');
    expect(el.value).toBe(0);
    await userEvent.keyboard('{End}');
    expect(el.value).toBe(20);
    const count = seen.length;
    await userEvent.keyboard('{ArrowUp}');
    expect(el.value).toBe(20);
    expect(seen.length).toBe(count);
    await userEvent.keyboard('{Home}');
    expect(el.value).toBe(0);
    expect(inner(el).getAttribute('aria-valuenow')).toBe('0');
  });

  it('steps from its buttons, which keep focus in the field and stop at the ends', async () => {
    const el = await one('<punica-number-input label="Quantity" value="9" max="10"></punica-number-input>');
    const [down, up] = el.shadowRoot.querySelectorAll('button');
    const changes = [];
    el.addEventListener('punica-change', (e) => changes.push(e.detail.value));
    up.click();
    await settle();
    expect(el.value).toBe(10);
    expect(el.shadowRoot.activeElement).toBe(inner(el));
    expect(up.disabled).toBe(true);
    down.click();
    down.click();
    await settle();
    expect(el.value).toBe(8);
    expect(changes).toEqual([10, 9, 8]);
    expect(down.tabIndex).toBe(-1);
  });

  it('steps an empty field from zero and an off-grid value to the next grid line', async () => {
    const el = await one('<punica-number-input label="Quantity" step="5"></punica-number-input>');
    el.stepUp();
    expect(el.value).toBe(5);
    el.value = 7;
    el.stepUp();
    expect(el.value).toBe(10);
    el.value = 7;
    el.stepDown();
    expect(el.value).toBe(5);
    el.step = 0.1;
    el.value = 0.2;
    el.stepUp();
    expect(el.value).toBe(0.3);
  });

  it('fires nothing on a programmatic change, takes no steps while readonly, and null empties it', async () => {
    const el = await one('<punica-number-input label="Quantity" value="5" readonly></punica-number-input>');
    let fired = 0;
    el.addEventListener('punica-input', () => fired++);
    el.addEventListener('punica-change', () => fired++);
    el.focus();
    await userEvent.keyboard('{ArrowUp}');
    el.shadowRoot.querySelector('.increment').click();
    expect(el.value).toBe(5);
    el.value = 12;
    await settle();
    expect(inner(el).value).toBe('12');
    el.value = null;
    await settle();
    expect(el.value).toBe(null);
    expect(inner(el).value).toBe('');
    expect(fired).toBe(0);
  });

  it('appears in the form data as a plain number, and Enter commits and requests the submit', async () => {
    const form = await fixture('<form lang="en-US"><punica-number-input name="qty" label="Quantity" value="1234.5" max="2000"></punica-number-input></form>');
    const el = form.firstElementChild;
    expect(entries(form)).toEqual([['qty', '1234.5']]);
    let submitted = null;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted = entries(form);
    });
    el.focus();
    el.select();
    await userEvent.keyboard('5000{Enter}');
    expect(submitted).toEqual([['qty', '2000']]);
  });

  it('is left out of the form data when disabled', async () => {
    const form = await fixture('<form><punica-number-input name="qty" label="Quantity" value="3" disabled></punica-number-input></form>');
    expect(entries(form)).toEqual([]);
    expect(form.firstElementChild.shadowRoot.querySelector('.increment').disabled).toBe(true);
  });

  it('goes back to the value attribute on form.reset()', async () => {
    const form = await fixture('<form><punica-number-input name="a" label="A" value="3"></punica-number-input><punica-number-input name="b" label="B"></punica-number-input></form>');
    const [a, b] = form.children;
    a.focus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    b.value = 9;
    await settle();
    expect(entries(form)).toEqual([['a', '5'], ['b', '9']]);
    expect(a.getAttribute('value')).toBe('3');
    form.reset();
    await settle();
    expect([a.value, b.value]).toEqual([3, null]);
    expect(entries(form)).toEqual([['a', '3'], ['b', '']]);
  });

  it('blocks checkValidity() when required and empty', async () => {
    const form = await fixture('<form><punica-number-input name="qty" label="Quantity" required></punica-number-input></form>');
    const el = form.firstElementChild;
    expect(form.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage).toBe(inner(el).validationMessage);
    expect(el.matches(':state(user-invalid)')).toBe(true);
    el.value = 0;
    await settle();
    expect(form.checkValidity()).toBe(true);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-number-input name="qty" label="Quantity" value="3"></punica-number-input></fieldset></form>');
    await settle();
    expect(inner(form.querySelector('punica-number-input')).disabled).toBe(true);
    expect(entries(form)).toEqual([]);
  });
});
