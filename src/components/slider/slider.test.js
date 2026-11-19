import { describe, it, expect, afterEach } from 'vitest';
import { userEvent, cdp } from 'vitest/browser';
import { contract, fixture, cleanup, settle } from '../../../test/contract.js';
import './slider.js';

contract('punica-slider', { html: '<punica-slider label="Volume" name="vol" value="30"></punica-slider>' });

const entries = (form) => [...new FormData(form)];
const pointer = (el, type, x, y, id = 1) =>
  el.shadowRoot.querySelector('.base').dispatchEvent(
    new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, button: 0, bubbles: true, composed: true, cancelable: true })
  );
const center = (el) => {
  const thumb = el.shadowRoot.querySelector('.thumb').getBoundingClientRect();
  return [thumb.left + thumb.width / 2, thumb.top + thumb.height / 2];
};

describe('punica-slider', () => {
  afterEach(cleanup);

  it('is one role=slider tab stop with its value in ARIA', async () => {
    const el = await fixture('<punica-slider label="Volume" min="10" max="50" value="30"></punica-slider>');
    const i = el.internals;
    expect([i.role, i.ariaValueNow, i.ariaValueMin, i.ariaValueMax, i.ariaOrientation, i.ariaLabel]).toEqual([
      'slider', '30', '10', '50', 'horizontal', 'Volume'
    ]);
    expect(el.tabIndex).toBe(0);
    expect(el.hasAttribute('role')).toBe(false);
    await userEvent.tab();
    expect(document.activeElement).toBe(el);
  });

  it('defaults to min, clamps to the range and snaps to the step', async () => {
    const el = await fixture('<punica-slider label="Volume" min="10" max="50" step="5"></punica-slider>');
    expect(el.value).toBe(10);
    el.value = 33;
    await settle();
    expect(el.value).toBe(35);
    el.value = 500;
    await settle();
    expect(el.value).toBe(50);
    el.step = 0.1;
    el.value = 20.30000001;
    await settle();
    expect(el.value).toBe(20.3);
    el.value = null;
    await settle();
    expect(el.value).toBe(10);
  });

  it('moves with arrows, PageUp/PageDown, Home and End, and fires input then change', async () => {
    const el = await fixture('<punica-slider label="Volume" value="50"></punica-slider>');
    const seen = [];
    el.addEventListener('punica-input', (e) => seen.push(['input', e.detail.value, e.bubbles, e.composed]));
    el.addEventListener('punica-change', (e) => seen.push(['change', e.detail.value, e.bubbles, e.composed]));
    el.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(el.value).toBe(51);
    expect(seen).toEqual([['input', 51, true, true], ['change', 51, true, true]]);
    await userEvent.keyboard('{ArrowUp}');
    expect(el.value).toBe(52);
    await userEvent.keyboard('{ArrowLeft}{ArrowDown}');
    expect(el.value).toBe(50);
    await userEvent.keyboard('{PageUp}');
    expect(el.value).toBe(60);
    await userEvent.keyboard('{PageDown}{PageDown}');
    expect(el.value).toBe(40);
    await userEvent.keyboard('{End}');
    expect(el.value).toBe(100);
    expect(el.internals.ariaValueNow).toBe('100');
    const count = seen.length;
    await userEvent.keyboard('{End}{ArrowRight}');
    expect(seen.length).toBe(count);
    await userEvent.keyboard('{Home}');
    expect(el.value).toBe(0);
  });

  it('mirrors the horizontal arrows in RTL', async () => {
    const wrap = await fixture('<div dir="rtl"><punica-slider label="Volume" value="50"></punica-slider></div>');
    const el = wrap.firstElementChild;
    el.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(el.value).toBe(51);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(el.value).toBe(49);
    await userEvent.keyboard('{ArrowUp}');
    expect(el.value).toBe(50);
  });

  it('follows a pointer drag with capture: input while moving, one change at the end', async () => {
    const wrap = await fixture('<div style="width:240px"><punica-slider label="Volume" style="width:218px"></punica-slider></div>');
    const el = wrap.firstElementChild;
    const track = el.shadowRoot.querySelector('.track').getBoundingClientRect();
    expect(track.width).toBe(200);
    const seen = [];
    el.addEventListener('punica-input', (e) => seen.push(['input', e.detail.value]));
    el.addEventListener('punica-change', (e) => seen.push(['change', e.detail.value]));
    const y = track.top;
    pointer(el, 'pointerdown', track.left + 50, y);
    expect(el.matches(':state(dragging)')).toBe(true);
    expect(el.value).toBe(25);
    pointer(el, 'pointermove', track.left + 100, y);
    pointer(el, 'pointermove', track.left + 900, y);
    expect(el.value).toBe(100);
    pointer(el, 'pointerup', track.left + 900, y);
    expect(el.matches(':state(dragging)')).toBe(false);
    expect(seen).toEqual([['input', 25], ['input', 50], ['input', 100], ['change', 100]]);
    pointer(el, 'pointermove', track.left, y);
    expect(el.value).toBe(100);
    await settle();
    expect(Math.round(center(el)[0])).toBe(Math.round(track.right));
  });

  it('captures a real pointer, so the drag goes on outside the slider', async () => {
    const el = await fixture('<punica-slider label="Volume" style="width:218px;margin:40px"></punica-slider>');
    const base = el.shadowRoot.querySelector('.base');
    const track = el.shadowRoot.querySelector('.track').getBoundingClientRect();
    const frame = window.frameElement?.getBoundingClientRect() || { left: 0, top: 0 };
    const mouse = (type, x, y) =>
      cdp().send('Input.dispatchMouseEvent', {
        type,
        x: frame.left + x,
        y: frame.top + y,
        button: 'left',
        buttons: type === 'mouseReleased' ? 0 : 1,
        clickCount: 1
      });
    const y = track.top + track.height / 2;
    const changes = [];
    el.addEventListener('punica-change', (e) => changes.push(e.detail.value));
    let captured = false;
    base.addEventListener('gotpointercapture', () => (captured = true));
    await mouse('mousePressed', track.left + 100, y);
    expect(el.value).toBe(50);
    expect(document.activeElement).toBe(el);
    await mouse('mouseMoved', track.left + 150, y + 200);
    expect(captured).toBe(true);
    expect(el.value).toBe(75);
    await mouse('mouseReleased', track.left + 150, y + 200);
    expect(changes).toEqual([75]);
  });

  it('measures a drag from the inline end in RTL and from the bottom when vertical', async () => {
    const wrap = await fixture('<div dir="rtl"><punica-slider label="A" style="width:218px"></punica-slider></div>');
    const rtl = wrap.firstElementChild;
    let track = rtl.shadowRoot.querySelector('.track').getBoundingClientRect();
    pointer(rtl, 'pointerdown', track.left + 50, track.top);
    pointer(rtl, 'pointerup', track.left + 50, track.top);
    expect(rtl.value).toBe(75);
    await settle();
    expect(Math.round(center(rtl)[0])).toBe(Math.round(track.left + 50));

    const vertical = await fixture('<punica-slider label="B" orientation="vertical" style="height:218px"></punica-slider>');
    track = vertical.shadowRoot.querySelector('.track').getBoundingClientRect();
    expect(track.height).toBe(200);
    expect(vertical.internals.ariaOrientation).toBe('vertical');
    pointer(vertical, 'pointerdown', track.left, track.top + 50);
    pointer(vertical, 'pointerup', track.left, track.top + 50);
    expect(vertical.value).toBe(75);
    await settle();
    expect(Math.round(center(vertical)[1])).toBe(Math.round(track.top + 50));
  });

  it('takes no keys and no pointer while disabled, and leaves the tab order', async () => {
    const el = await fixture('<punica-slider label="Volume" value="50" disabled></punica-slider>');
    expect(el.hasAttribute('tabindex')).toBe(false);
    const track = el.shadowRoot.querySelector('.track').getBoundingClientRect();
    pointer(el, 'pointerdown', track.left, track.top);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(el.value).toBe(50);
    el.disabled = false;
    await settle();
    expect(el.tabIndex).toBe(0);
  });

  it('fires nothing on a programmatic change', async () => {
    const el = await fixture('<punica-slider label="Volume"></punica-slider>');
    let fired = 0;
    el.addEventListener('punica-input', () => fired++);
    el.addEventListener('punica-change', () => fired++);
    el.value = 40;
    el.stepUp();
    el.stepDown(3);
    await settle();
    expect(el.value).toBe(38);
    expect(fired).toBe(0);
  });

  it('appears in the form data, and is left out when disabled', async () => {
    const form = await fixture('<form><punica-slider name="vol" label="Volume" value="30"></punica-slider></form>');
    const el = form.firstElementChild;
    expect(entries(form)).toEqual([['vol', '30']]);
    el.disabled = true;
    await settle();
    expect(entries(form)).toEqual([]);
  });

  it('goes back to the value attribute on form.reset() and keeps that attribute while it moves', async () => {
    const form = await fixture('<form><punica-slider name="vol" label="Volume" value="30"></punica-slider></form>');
    const el = form.firstElementChild;
    el.focus();
    await userEvent.keyboard('{End}');
    expect(entries(form)).toEqual([['vol', '100']]);
    expect(el.getAttribute('value')).toBe('30');
    form.reset();
    await settle();
    expect(el.value).toBe(30);
    expect(entries(form)).toEqual([['vol', '30']]);
  });

  it('always has a value, so required never blocks checkValidity()', async () => {
    const form = await fixture('<form><punica-slider name="vol" label="Volume" required></punica-slider></form>');
    expect(form.checkValidity()).toBe(true);
    expect(entries(form)).toEqual([['vol', '0']]);
    form.firstElementChild.setCustomValidity('Too quiet');
    expect(form.checkValidity()).toBe(false);
  });

  it('is disabled by a disabled fieldset', async () => {
    const form = await fixture('<form><fieldset disabled><punica-slider name="vol" label="Volume" value="30"></punica-slider></fieldset></form>');
    await settle();
    const el = form.querySelector('punica-slider');
    expect(el.internals.ariaDisabled).toBe('true');
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(entries(form)).toEqual([]);
  });
});
