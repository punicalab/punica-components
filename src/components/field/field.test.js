import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import '../input/input.js';
import '../checkbox/checkbox.js';
import './field.js';

const html =
  '<punica-field label="Email" help="We never share it."><punica-input type="email" name="email"></punica-input></punica-field>';

contract('punica-field', { html });
contract('punica-field', {
  html: '<punica-field label="Email" error="Already taken" required><punica-input name="email" value="a@b.co"></punica-input></punica-field>'
});

const part = (el, name) => el.shadowRoot.querySelector(`[part=${name}]`);
const text = (el, name) =>
  part(el, name).hidden ? null : part(el, name).textContent.trim();

describe('punica-field', () => {
  afterEach(cleanup);

  it('report="inline": a submit shows the fields\' messages alone, with no bubble, and focuses the first invalid control', async () => {
    const form = await fixture(
      '<form><punica-field label="Name" report="inline"><punica-input name="name" required></punica-input></punica-field><punica-field label="E-mail" report="inline"><punica-input name="email" required></punica-input></punica-field><button>Send</button></form>'
    );
    let submitted = false;
    form.addEventListener(
      'submit',
      (e) => ((submitted = true), e.preventDefault())
    );
    const canceled = [];
    for (const c of form.querySelectorAll('punica-input'))
      c.addEventListener('invalid', (e) =>
        queueMicrotask(() => canceled.push(e.defaultPrevented))
      );
    const [name, email] = form.querySelectorAll('punica-field');
    await settle();
    form.querySelector('button').click();
    await settle();
    expect(submitted).toBe(false);
    expect(name.matches(':state(invalid)')).toBe(true);
    expect(email.matches(':state(invalid)')).toBe(true);
    expect(document.activeElement).toBe(name.control);
    expect(canceled).toEqual([true, true]);
    // checkValidity() reports too, but it is not a submit: focus stays where it is.
    email.control.focus();
    form.checkValidity();
    await settle();
    expect(document.activeElement).toBe(email.control);
  });

  it('report="browser" (the default) leaves the browser\'s bubble: the invalid event is not canceled', async () => {
    const form = await fixture(
      '<form><punica-field label="Name"><punica-input name="name" required></punica-input></punica-field></form>'
    );
    const field = form.querySelector('punica-field');
    await settle();
    let prevented = null;
    field.control.addEventListener('invalid', (e) =>
      queueMicrotask(() => (prevented = e.defaultPrevented))
    );
    form.checkValidity();
    await settle();
    expect(prevented).toBe(false);
    expect(field.matches(':state(invalid)')).toBe(true);
  });

  it('shows its label and help, and hides what it was not given', async () => {
    const el = await fixture(html);
    expect(part(el, 'label').hidden).toBe(false);
    expect(el.shadowRoot.querySelector('.label-text').textContent).toBe(
      'Email'
    );
    expect(text(el, 'help')).toBe('We never share it.');
    expect(text(el, 'error')).toBe(null);
    expect(part(el, 'required').hidden).toBe(true);
    el.label = null;
    el.help = null;
    await settle();
    expect(part(el, 'label').hidden).toBe(true);
    expect(part(el, 'help').hidden).toBe(true);
  });

  it('names the control from label, and follows a later label', async () => {
    const el = await fixture(html);
    const input = el.querySelector('punica-input');
    await settle();
    expect(input.label).toBe('Email');
    expect(
      input.shadowRoot.querySelector('input').getAttribute('aria-label')
    ).toBe('Email');
    el.label = 'Work email';
    await settle();
    expect(input.label).toBe('Work email');
  });

  it('leaves a control that has its own label alone', async () => {
    const el = await fixture(
      '<punica-field label="Email"><punica-input label="Your email address"></punica-input></punica-field>'
    );
    await settle();
    el.label = 'Mail';
    await settle();
    expect(el.querySelector('punica-input').label).toBe('Your email address');
  });

  it('names a native control with aria-label unless something already names it', async () => {
    const a = await fixture(
      '<punica-field label="City"><input></punica-field>'
    );
    const b = await fixture(
      '<punica-field label="City"><input aria-label="Town"></punica-field>'
    );
    await settle();
    expect(a.querySelector('input').getAttribute('aria-label')).toBe('City');
    expect(b.querySelector('input').getAttribute('aria-label')).toBe('Town');
  });

  it('focuses the control on a click on the label', async () => {
    const el = await fixture(html);
    part(el, 'label').click();
    expect(el.querySelector('punica-input').matches(':focus')).toBe(true);
  });

  it('shows the required mark from its own attribute or from the control', async () => {
    const own = await fixture(
      '<punica-field label="Email" required><punica-input></punica-input></punica-field>'
    );
    const fromControl = await fixture(
      '<punica-field label="Email"><punica-input required></punica-input></punica-field>'
    );
    await settle();
    for (const el of [own, fromControl]) {
      expect(part(el, 'required').hidden).toBe(false);
      expect(part(el, 'required').getAttribute('aria-hidden')).toBe('true');
      expect(el.matches(':state(required)')).toBe(true);
    }
  });

  it('shows the validation message only after invalid fired, and clears it once valid', async () => {
    const form = await fixture(
      '<form><punica-field label="Email"><punica-input type="email" name="email" required></punica-input></punica-field></form>'
    );
    const el = form.firstElementChild;
    const input = el.querySelector('punica-input');
    await settle();
    expect(text(el, 'error')).toBe(null);
    expect(form.checkValidity()).toBe(false);
    expect(text(el, 'error')).toBe(input.validationMessage);
    expect(text(el, 'error')).not.toBe('');
    expect(el.matches(':state(invalid)')).toBe(true);
    input.focus();
    await userEvent.keyboard('nope');
    await settle();
    expect(input.validity.typeMismatch).toBe(true);
    expect(text(el, 'error')).toBe(input.validationMessage);
    await userEvent.keyboard('@example.com');
    await settle();
    expect(text(el, 'error')).toBe(null);
    expect(el.matches(':state(invalid)')).toBe(false);
  });

  it('shows the validation message on blur when the control is invalid', async () => {
    const el = await fixture(
      '<punica-field label="Terms"><punica-checkbox required>I agree</punica-checkbox></punica-field>'
    );
    const box = el.querySelector('punica-checkbox');
    await settle();
    box.focus();
    expect(text(el, 'error')).toBe(null);
    await userEvent.tab();
    await settle();
    expect(text(el, 'error')).toBe(box.validationMessage);
    box.click();
    await settle();
    expect(text(el, 'error')).toBe(null);
  });

  it("shows error at once, over the control's own message", async () => {
    const el = await fixture(
      '<punica-field label="Email" error="Already taken"><punica-input required></punica-input></punica-field>'
    );
    expect(text(el, 'error')).toBe('Already taken');
    expect(part(el, 'error').getAttribute('aria-live')).toBe('polite');
    el.error = null;
    await settle();
    expect(text(el, 'error')).toBe(null);
  });

  it('forgets the message when its form is reset', async () => {
    const form = await fixture(
      '<form><punica-field label="Email"><punica-input name="email" required></punica-input></punica-field></form>'
    );
    const el = form.firstElementChild;
    await settle();
    form.checkValidity();
    expect(text(el, 'error')).not.toBe(null);
    form.reset();
    await settle();
    expect(text(el, 'error')).toBe(null);
  });

  it('describes the control with its help and the error it shows, and follows them', async () => {
    const el = await fixture(html);
    const input = el.querySelector('punica-input');
    const inner = input.shadowRoot.querySelector('input');
    await settle();
    expect(input.description).toBe('We never share it.');
    expect(inner.getAttribute('aria-description')).toBe('We never share it.');
    el.error = 'Already taken';
    await settle();
    expect(inner.getAttribute('aria-description')).toBe(
      'We never share it. Already taken'
    );
    el.help = null;
    el.error = null;
    await settle();
    expect(input.description).toBe(null);
    expect(inner.hasAttribute('aria-description')).toBe(false);
  });

  it('leaves a control that has its own description alone, and describes a native one by attribute', async () => {
    const own = await fixture(
      '<punica-field label="Email" help="Hint"><punica-input description="Our own words"></punica-input></punica-field>'
    );
    const native = await fixture(
      '<punica-field label="City" help="Where you live"><input></punica-field>'
    );
    await settle();
    expect(own.querySelector('punica-input').description).toBe('Our own words');
    expect(native.querySelector('input').getAttribute('aria-description')).toBe(
      'Where you live'
    );
  });

  it('a control reported invalid says so to assistive technology, and stops once valid', async () => {
    const el = await fixture(
      '<punica-field label="Email"><punica-input name="email"></punica-input></punica-field>'
    );
    const input = el.querySelector('punica-input');
    const inner = input.shadowRoot.querySelector('input');
    await settle();
    input.setCustomValidity('Already taken');
    expect(inner.hasAttribute('aria-invalid')).toBe(false);
    input.checkValidity();
    await settle();
    expect(inner.getAttribute('aria-invalid')).toBe('true');
    expect(text(el, 'error')).toBe('Already taken');
    expect(inner.getAttribute('aria-description')).toBe('Already taken');
    input.setCustomValidity('');
    await settle();
    expect(inner.hasAttribute('aria-invalid')).toBe(false);
  });

  it('takes rich content through the label and help slots', async () => {
    const el = await fixture(
      '<punica-field><span slot="label">Email <em>(work)</em></span><punica-input></punica-input><span slot="help">Read the <a href="#p">policy</a></span></punica-field>'
    );
    await settle();
    expect(part(el, 'label').hidden).toBe(false);
    expect(part(el, 'help').hidden).toBe(false);
    expect(el.querySelector('punica-input').label).toBe('Email (work)');
  });
});
