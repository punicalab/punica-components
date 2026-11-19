import { PunicaElement, define } from '../../core/element.js';
import { isRtl } from '../../core/a11y.js';
import styles from './split.css';

/**
 * Two panes with a divider the user drags or moves with the keyboard.
 *
 * `position` is the share of the `start` pane, in percent of the whole.
 * A vertical split needs a block size from the page.
 *
 * @element punica-split
 *
 * @attr {'horizontal' | 'vertical'} orientation - `horizontal` puts the panes side by side (the default), `vertical` stacks them.
 * @attr {number} position - Size of the start pane in percent, 50 by default.
 * @attr {number} min - Smallest position in percent, 0 by default.
 * @attr {number} max - Largest position in percent, 100 by default.
 * @attr {number} step - Percent an arrow key moves the divider, 1 by default; Page Up and Page Down move ten steps.
 * @attr {string} label - Accessible name of the divider, `Resize` by default.
 * @attr {boolean} disabled - The divider cannot be moved.
 *
 * @slot start - The first pane.
 * @slot end - The second pane.
 *
 * @fires punica-input - The position changes while the divider is dragged. `detail.position` (also `detail.value`).
 * @fires punica-change - The user finished a drag or pressed a key. `detail.position` (also `detail.value`).
 *
 * @csspart base - The flex container.
 * @csspart start - The first pane.
 * @csspart end - The second pane.
 * @csspart divider - The focusable separator.
 *
 * @cssprop --punica-split-divider-size - Thickness of the divider's hit area.
 * @cssprop --punica-split-divider-line - Thickness of the visible line.
 * @cssprop --punica-split-divider-color - Color of the line.
 * @cssprop --punica-split-divider-active-color - Color of the line under the pointer, with focus and while dragging.
 *
 * @cssstate dragging - The divider is being dragged.
 */
export class PunicaSplit extends PunicaElement {
  static properties = {
    orientation: { default: 'horizontal' },
    position: { type: Number, default: 50 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    label: { default: 'Resize' },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <div part="start" id="start" class="pane start"><slot name="start"></slot></div>
      <div part="divider" class="divider" role="separator" tabindex="0" aria-controls="start"></div>
      <div part="end" class="pane end"><slot name="end"></slot></div>
    </div>
  `;

  #base = this.$('.base');
  #divider = this.$('.divider');
  /** Position when the drag began, or null while not dragging. */
  #dragFrom = null;

  constructor() {
    super();
    const divider = this.#divider;
    divider.addEventListener('keydown', (event) => this.#onKeydown(event));
    divider.addEventListener('pointerdown', (event) => {
      if (this.disabled || event.button !== 0) return;
      event.preventDefault();
      divider.focus();
      try {
        divider.setPointerCapture(event.pointerId);
      } catch {
        // No such active pointer: the moves still arrive while over the divider.
      }
      this.#dragFrom = this.#clamped();
      this.toggleState('dragging', true);
    });
    divider.addEventListener('pointermove', (event) => {
      if (this.#dragFrom === null) return;
      const rect = this.#base.getBoundingClientRect();
      const vertical = this.orientation === 'vertical';
      const size = vertical ? rect.height : rect.width;
      if (!size) return;
      const offset = vertical
        ? event.clientY - rect.top
        : isRtl(this)
          ? rect.right - event.clientX
          : event.clientX - rect.left;
      const next = this.#clamp(Math.round((offset / size) * 10000) / 100);
      if (next === this.#clamped()) return;
      this.position = next;
      this.emit('input', { position: next, value: next });
    });
    const end = () => {
      if (this.#dragFrom === null) return;
      const from = this.#dragFrom;
      this.#dragFrom = null;
      this.toggleState('dragging', false);
      const now = this.#clamped();
      if (now !== from) this.emit('change', { position: now, value: now });
    };
    divider.addEventListener('pointerup', end);
    divider.addEventListener('pointercancel', end);
    divider.addEventListener('lostpointercapture', end);
  }

  disconnected() {
    this.#dragFrom = null;
    this.toggleState('dragging', false);
  }

  #clamp(value) {
    const min = Math.max(0, this.min ?? 0);
    const max = Math.max(min, Math.min(100, this.max ?? 100));
    return Math.min(max, Math.max(min, value));
  }

  #clamped() {
    return this.#clamp(this.position ?? 50);
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    if (this.disabled) return;
    const vertical = this.orientation === 'vertical';
    const step = this.step > 0 ? this.step : 1;
    const forward = isRtl(this) ? 'ArrowLeft' : 'ArrowRight';
    const back = isRtl(this) ? 'ArrowRight' : 'ArrowLeft';
    const current = this.#clamped();
    let next;
    switch (event.key) {
      case vertical ? 'ArrowDown' : forward:
        next = current + step;
        break;
      case vertical ? 'ArrowUp' : back:
        next = current - step;
        break;
      case 'PageUp':
        next = current - step * 10;
        break;
      case 'PageDown':
        next = current + step * 10;
        break;
      case 'Home':
        next = this.#clamp(0);
        break;
      case 'End':
        next = this.#clamp(100);
        break;
      default:
        return;
    }
    event.preventDefault();
    next = this.#clamp(next);
    if (next === current) return;
    this.position = next;
    this.emit('change', { position: next, value: next });
  }

  update() {
    const divider = this.#divider;
    const position = this.#clamped();
    this.#base.style.setProperty('--_position', `${position}%`);
    divider.setAttribute('aria-valuenow', String(Math.round(position)));
    divider.setAttribute('aria-valuemin', String(Math.round(this.#clamp(0))));
    divider.setAttribute('aria-valuemax', String(Math.round(this.#clamp(100))));
    // The separator runs across the direction the panes are laid out in.
    divider.setAttribute('aria-orientation', this.orientation === 'vertical' ? 'horizontal' : 'vertical');
    divider.setAttribute('aria-label', this.label);
    divider.tabIndex = this.disabled ? -1 : 0;
    if (this.disabled) divider.setAttribute('aria-disabled', 'true');
    else divider.removeAttribute('aria-disabled');
  }
}

define('punica-split', PunicaSplit);
