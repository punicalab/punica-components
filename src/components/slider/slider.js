import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import { isRtl } from '../../core/a11y.js';
import styles from './slider.css';

const decimals = (n) => {
  const text = String(n);
  if (text.includes('e-')) return Number(text.split('e-')[1]);
  return text.includes('.') ? text.split('.')[1].length : 0;
};

/**
 * A slider: one value on a track between `min` and `max`.
 *
 * The host is the `role="slider"` element and the tab stop. Arrow keys move
 * by one step (mirrored in RTL), PageUp and PageDown by a tenth of the
 * range, Home and End go to the ends; a press or a drag on the track moves
 * the thumb under the pointer.
 *
 * @element punica-slider
 *
 * @attr {number} value - Default value. The property holds the current value, always a number inside the range.
 * @attr {number} min - Lowest value, 0 by default.
 * @attr {number} max - Highest value, 100 by default.
 * @attr {number} step - Granularity, 1 by default.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name, when no `<label>` points at the slider.
 * @attr {'horizontal' | 'vertical'} orientation - `horizontal` by default; a vertical slider grows upwards.
 * @attr {boolean} disabled - Takes no input and submits nothing.
 * @attr {boolean} required - Part of the form control contract; this control always has a value, so it never blocks a form.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `primary` by default.
 *
 * @fires punica-input - The value changed during a drag or a key press; `detail: { value }`.
 * @fires punica-change - The user committed a value: a key press, or the end of a drag; `detail: { value }`.
 *
 * @csspart base - The area that takes the pointer.
 * @csspart track - The full track.
 * @csspart fill - The part of the track up to the value.
 * @csspart thumb - The handle.
 *
 * @cssprop --punica-slider-length - Block size of a vertical slider.
 * @cssprop --punica-slider-track-size - Thickness of the track.
 * @cssprop --punica-slider-thumb-size - Diameter of the thumb.
 * @cssprop --punica-slider-track-color - Track beyond the value.
 * @cssprop --punica-slider-color - Fill and thumb.
 *
 * @cssstate dragging - A pointer holds the thumb.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaSlider extends FormControl(PunicaElement) {
  static properties = {
    value: { type: Number, reflect: false },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    label: {},
    orientation: { default: 'horizontal' },
    color: {}
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <div part="track" class="track"><div part="fill" class="fill"></div></div>
      <div part="thumb" class="thumb"></div>
    </div>
  `;

  #base = this.$('.base');
  /** Value at the start of a drag, to tell whether the drag changed it. */
  #dragFrom = null;

  constructor() {
    super();
    const base = this.#base;
    base.addEventListener('pointerdown', (event) => this.#onPointerDown(event));
    base.addEventListener('pointermove', (event) => {
      if (this.#dragFrom !== null) this.#drag(event);
    });
    base.addEventListener('pointerup', (event) => this.#endDrag(event));
    base.addEventListener('pointercancel', (event) => this.#endDrag(event));
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
  }

  update() {
    const { min, max } = this.#range();
    const value = this.#snap(this.value ?? min);
    // The property always answers a number inside the range.
    if (this.value !== value) this.value = value;

    const internals = this.internals;
    internals.role = 'slider';
    internals.ariaValueNow = String(value);
    internals.ariaValueMin = String(min);
    internals.ariaValueMax = String(max);
    internals.ariaOrientation = this.orientation === 'vertical' ? 'vertical' : 'horizontal';
    internals.ariaLabel = this.label || null;
    internals.ariaDisabled = this.isDisabled ? 'true' : null;

    // The host is the tab stop; a tabindex the page wrote is left alone.
    if (this.isDisabled) this.removeAttribute('tabindex');
    else if (!this.hasAttribute('tabindex')) this.tabIndex = 0;

    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
    this.#base.style.setProperty('--_percent', String(percent));

    this.setFormValue(String(value));
    this.setValidity({});
  }

  formReset() {
    const attr = this.getAttribute('value');
    this.value = attr === null || attr.trim() === '' ? null : Number(attr);
  }

  formRestore(state) {
    if (typeof state === 'string' && state !== '') this.value = Number(state);
  }

  /** Raises the value by `n` steps, 1 by default. Fires nothing. */
  stepUp(n = 1) {
    this.value = this.#snap(this.#current() + n * this.#step());
  }

  /** Lowers the value by `n` steps, 1 by default. Fires nothing. */
  stepDown(n = 1) {
    this.stepUp(-n);
  }

  #range() {
    const min = this.min ?? 0;
    const max = this.max ?? 100;
    return { min, max: Math.max(min, max) };
  }

  #step() {
    const step = this.step ?? 1;
    return step > 0 ? step : 1;
  }

  #current() {
    return this.#snap(this.value ?? this.#range().min);
  }

  /** The nearest step inside the range. */
  #snap(raw) {
    const { min, max } = this.#range();
    const step = this.#step();
    let value = Math.round((raw - min) / step) * step + min;
    value = Number(value.toFixed(Math.max(decimals(step), decimals(min))));
    if (value > max) value = Number((value - step).toFixed(Math.max(decimals(step), decimals(min))));
    return Math.min(max, Math.max(min, value));
  }

  /** Takes a value from the user: sets it and says so. */
  #commit(value, events) {
    value = this.#snap(value);
    if (value === this.#current()) return false;
    this.value = value;
    this.update(new Map());
    for (const name of events) this.emit(name, { value });
    return true;
  }

  #onKeydown(event) {
    if (this.isDisabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const { min, max } = this.#range();
    const step = this.#step();
    const page = Math.max(step, Math.round((max - min) / 10 / step) * step);
    const forward = isRtl(this) ? -1 : 1;
    const current = this.#current();
    let next;
    switch (event.key) {
      case 'ArrowUp':
        next = current + step;
        break;
      case 'ArrowDown':
        next = current - step;
        break;
      case 'ArrowRight':
        next = current + step * forward;
        break;
      case 'ArrowLeft':
        next = current - step * forward;
        break;
      case 'PageUp':
        next = current + page;
        break;
      case 'PageDown':
        next = current - page;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.#commit(next, ['input', 'change']);
  }

  #onPointerDown(event) {
    if (this.isDisabled || event.button !== 0) return;
    event.preventDefault();
    this.focus();
    this.#dragFrom = this.#current();
    try {
      // Capture keeps the drag alive when the pointer leaves the track.
      this.#base.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser does not know (a scripted event) cannot be captured.
    }
    this.toggleState('dragging', true);
    this.#drag(event);
  }

  #drag(event) {
    const { min, max } = this.#range();
    const box = this.$('.track').getBoundingClientRect();
    let ratio;
    if (this.orientation === 'vertical') {
      ratio = box.height ? (box.bottom - event.clientY) / box.height : 0;
    } else {
      ratio = box.width ? (event.clientX - box.left) / box.width : 0;
      if (isRtl(this)) ratio = 1 - ratio;
    }
    ratio = Math.min(1, Math.max(0, ratio));
    this.#commit(min + ratio * (max - min), ['input']);
  }

  #endDrag(event) {
    if (this.#dragFrom === null) return;
    const from = this.#dragFrom;
    this.#dragFrom = null;
    if (this.#base.hasPointerCapture(event.pointerId)) this.#base.releasePointerCapture(event.pointerId);
    this.toggleState('dragging', false);
    const value = this.#current();
    if (value !== from) this.emit('change', { value });
  }
}

define('punica-slider', PunicaSlider);
