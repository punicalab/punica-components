import { PunicaElement, define } from '../../core/element.js';
import styles from './stepper.css';

/**
 * The steps of a process, with one of them active.
 *
 * The steps are `punica-step` children. Unless `linear` is set each step is a
 * button the user can jump to; a linear stepper is moved by the page, with
 * `value`, `next()` and `previous()`.
 *
 * Horizontal and narrower than 480px, it shows the title of the active step
 * only; the others keep it as their accessible name.
 *
 * @element punica-stepper
 *
 * @attr {string} value - The `value` of the active step; the first step when absent.
 * @attr {'horizontal' | 'vertical'} orientation - Direction of the steps, `horizontal` by default.
 * @attr {boolean} linear - Steps are taken in order: they are not buttons.
 * @attr {string} label - Accessible name of the list.
 *
 * @slot - The `punica-step` elements.
 *
 * @fires punica-change - The user chose another step. `detail.value` is its value.
 *
 * @cssprop --punica-stepper-gap - Space between a step and its connector.
 */
export class PunicaStepper extends PunicaElement {
  static properties = {
    value: {},
    orientation: { default: 'horizontal' },
    linear: { type: Boolean },
    label: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;

  constructor() {
    super();
    this.internals.role = 'list';
    this.$('slot').addEventListener('slotchange', () => this.requestUpdate());
    this.addEventListener('click', (event) => {
      const step = /** @type {Element} */ (event.target).closest?.('punica-step');
      if (!step || step.parentElement !== this || this.linear || step.hasAttribute('disabled')) return;
      const value = this.#key(step, this.steps.indexOf(step));
      if (value === this.#activeKey()) return;
      this.value = value;
      this.emit('change', { value });
    });
  }

  /** The steps, in order. */
  get steps() {
    return /** @type {any[]} */ ([...this.children].filter((el) => el.localName === 'punica-step'));
  }

  /** Index of the active step, -1 with no steps. */
  get activeIndex() {
    const steps = this.steps;
    if (!steps.length) return -1;
    const index = this.value == null ? -1 : steps.findIndex((step, i) => this.#key(step, i) === this.value);
    return index < 0 ? 0 : index;
  }

  /** Makes the following step active. Fires nothing. */
  next() {
    this.#move(1);
  }

  /** Makes the preceding step active. Fires nothing. */
  previous() {
    this.#move(-1);
  }

  connected() {
    this.requestUpdate();
  }

  #key(step, index) {
    return step.value ?? step.getAttribute('value') ?? String(index);
  }

  #activeKey() {
    const index = this.activeIndex;
    return index < 0 ? null : this.#key(this.steps[index], index);
  }

  #move(by) {
    const steps = this.steps;
    const index = Math.min(steps.length - 1, Math.max(0, this.activeIndex + by));
    if (index >= 0) this.value = this.#key(steps[index], index);
  }

  update() {
    this.internals.ariaLabel = this.label || null;
    const steps = this.steps;
    const active = this.activeIndex;
    if (this.value == null && active >= 0) this.value = this.#key(steps[active], active);
    steps.forEach((step, i) => {
      step.index = i + 1;
      step.active = i === active;
      step.interactive = !this.linear;
      step.orientation = this.orientation === 'vertical' ? 'vertical' : 'horizontal';
    });
  }
}

define('punica-stepper', PunicaStepper);
