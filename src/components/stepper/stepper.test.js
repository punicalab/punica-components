import { describe, it, expect, afterEach } from 'vitest';
import { contract, fixture, cleanup, settle, once } from '../../../test/contract.js';
import './stepper.js';
import './step.js';

const html = (attrs = '') => `<punica-stepper label="Checkout" ${attrs}>
  <punica-step value="cart" label="Cart" state="complete"></punica-step>
  <punica-step value="address" label="Address" description="Where it ships"></punica-step>
  <punica-step value="payment" state="error">Payment</punica-step>
  <punica-step value="review" label="Review" disabled></punica-step>
</punica-stepper>`;

const stepsOf = (el) => [...el.querySelectorAll('punica-step')];
const base = (step) => step.shadowRoot.querySelector('[part=base]');

contract('punica-stepper', { html: html('value="address"') });
contract('punica-stepper', { html: html('value="address" linear orientation="vertical"') });
contract('punica-step', { html: html('value="address"') });

describe('punica-stepper', () => {
  afterEach(cleanup);

  it('creates both tags with createElement', () => {
    expect(document.createElement('punica-stepper').attributes.length).toBe(0);
    expect(document.createElement('punica-step').attributes.length).toBe(0);
  });

  it('is a named list whose active step carries aria-current="step"', async () => {
    const el = await fixture(html('value="address"'));
    const steps = stepsOf(el);
    expect(el.internals.role).toBe('list');
    expect(el.internals.ariaLabel).toBe('Checkout');
    expect(steps[0].internals.role).toBe('listitem');
    expect(steps.map((s) => base(s).getAttribute('aria-current'))).toEqual([null, 'step', null, null]);
    expect(steps.map((s) => s.active)).toEqual([false, true, false, false]);
    expect(el.activeIndex).toBe(1);
  });

  it('starts on the first step with no value', async () => {
    const el = await fixture(html());
    await settle();
    expect(el.value).toBe('cart');
    expect(stepsOf(el)[0].active).toBe(true);
  });

  it('renders buttons when not linear and plain steps when linear', async () => {
    const el = await fixture(html('value="address"'));
    const steps = stepsOf(el);
    expect(steps.map((s) => base(s).localName)).toEqual(['button', 'button', 'button', 'button']);
    expect(base(steps[3]).disabled).toBe(true);
    el.linear = true;
    await settle();
    await settle();
    expect(steps.map((s) => base(s).localName)).toEqual(['div', 'div', 'div', 'div']);
    expect(base(steps[1]).getAttribute('aria-current')).toBe('step');
    expect(base(steps[1]).querySelector('[part=marker]')).toBeTruthy();
  });

  it('numbers the steps and names their state', async () => {
    const el = await fixture(html('value="address"'));
    const steps = stepsOf(el);
    expect(steps[1].shadowRoot.querySelector('.number').textContent).toBe('2');
    expect(steps[1].shadowRoot.querySelector('.label-text').textContent).toBe('Address');
    expect(steps[1].shadowRoot.querySelector('.description-text').textContent).toBe('Where it ships');
    expect(steps[0].shadowRoot.querySelector('.status').textContent).toBe('Completed');
    expect(steps[2].shadowRoot.querySelector('.status').textContent).toBe('Error');
    expect(steps[1].shadowRoot.querySelector('.status').textContent).toBe('');
    steps[0].labelComplete = 'Tamamlandı';
    await settle();
    expect(steps[0].shadowRoot.querySelector('.status').textContent).toBe('Tamamlandı');
  });

  it('formats the number in the element language', async () => {
    const wrap = await fixture(`<div lang="ar-EG">${html()}</div>`);
    expect(stepsOf(wrap)[1].shadowRoot.querySelector('.number').textContent).toBe(new Intl.NumberFormat('ar-EG').format(2));
  });

  it('changes step on a click and fires punica-change with the value', async () => {
    const el = await fixture(html('value="address"'));
    const steps = stepsOf(el);
    steps[2].focus();
    expect(steps[2].shadowRoot.activeElement).toBe(base(steps[2]));
    const event = once(el, 'punica-change');
    base(steps[2]).click();
    expect((await event).detail).toEqual({ value: 'payment' });
    await settle();
    expect(el.value).toBe('payment');
    expect(steps[2].active).toBe(true);
    expect(steps[1].active).toBe(false);
  });

  it('fires nothing for the active step, a disabled step, a linear stepper or the API', async () => {
    const el = await fixture(html('value="address"'));
    const steps = stepsOf(el);
    let fired = 0;
    el.addEventListener('punica-change', () => fired++);
    base(steps[1]).click();
    base(steps[3]).click();
    steps[3].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    el.next();
    await settle();
    expect(el.value).toBe('payment');
    el.previous();
    el.previous();
    el.previous();
    await settle();
    expect(el.value).toBe('cart');
    el.linear = true;
    await settle();
    await settle();
    base(steps[2]).click();
    expect(el.value).toBe('cart');
    expect(fired).toBe(0);
  });

  it('passes the orientation to its steps', async () => {
    const el = await fixture(html('orientation="vertical"'));
    await settle();
    const steps = stepsOf(el);
    expect(steps[0].orientation).toBe('vertical');
    expect(steps[1].getBoundingClientRect().top).toBeGreaterThan(steps[0].getBoundingClientRect().top);
    const display = (s) => getComputedStyle(s.shadowRoot.querySelector('[part=connector]')).display;
    expect(display(steps[0])).toBe('block');
    expect(display(steps[3])).toBe('none');
  });

  it('works when the steps exist before the stepper is connected, and takes later ones', async () => {
    const el = document.createElement('punica-stepper');
    const a = document.createElement('punica-step');
    const b = document.createElement('punica-step');
    a.label = 'One';
    b.label = 'Two';
    el.append(a, b);
    el.value = '1';
    const host = await fixture('<div></div>');
    host.append(el);
    await settle();
    expect(b.active).toBe(true);
    expect(base(b).localName).toBe('button');
    const c = document.createElement('punica-step');
    c.label = 'Three';
    el.append(c);
    await settle();
    await settle();
    expect(c.index).toBe(3);
    base(c).click();
    expect(el.value).toBe('2');
  });

  it('fits a narrow container by showing only the active title, and never overflows it', async () => {
    const wrap = await fixture(`<div style="width:340px">${html('value="shipping"')}</div>`);
    await settle();
    const el = wrap.querySelector('punica-stepper');
    expect(el.scrollWidth).toBeLessThanOrEqual(340);
    for (const step of stepsOf(el)) {
      const text = step.shadowRoot.querySelector('.text').getBoundingClientRect().width;
      if (step.active) expect(text).toBeGreaterThan(20);
      else expect(text).toBeLessThanOrEqual(1);
    }
    wrap.style.width = '900px';
    await new Promise((r) => requestAnimationFrame(r));
    for (const step of stepsOf(el)) expect(step.shadowRoot.querySelector('.text').getBoundingClientRect().width).toBeGreaterThan(20);
  });

  it('is as tall as its steps in a column flex parent, with the marker on the first line of a wrapped title', async () => {
    const wrap = await fixture(`<div style="display:flex;flex-direction:column;width:520px">${html()}</div>`);
    await settle();
    const el = wrap.querySelector('punica-stepper');
    const tallest = Math.max(...stepsOf(el).map((s) => s.getBoundingClientRect().height));
    expect(Math.round(el.getBoundingClientRect().height)).toBe(Math.round(tallest));
    const address = stepsOf(el)[1];
    const marker = address.shadowRoot.querySelector('[part=marker]').getBoundingClientRect();
    const label = address.shadowRoot.querySelector('[part=label]').getBoundingClientRect();
    expect(Math.abs(marker.top + marker.height / 2 - (label.top + label.height / 2))).toBeLessThanOrEqual(3);
  });
});
