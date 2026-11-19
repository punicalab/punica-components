import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './step.css';

/**
 * One step of a `punica-stepper`.
 *
 * @element punica-step
 *
 * @attr {string} value - Identifies the step in the stepper's `value`; its position when absent.
 * @attr {string} label - The step's title, when the default slot is empty.
 * @attr {string} description - A line under the title, when the `description` slot is empty.
 * @attr {'complete' | 'error'} state - The step is done, or has a problem.
 * @attr {boolean} disabled - The step cannot be chosen.
 * @attr {boolean} active - The step is the current one. Set by `punica-stepper`.
 * @attr {'horizontal' | 'vertical'} orientation - Layout of the step. Set by `punica-stepper`.
 * @attr {string} label-complete - Spoken after the title of a complete step, `Completed` by default.
 * @attr {string} label-error - Spoken after the title of a step in error, `Error` by default.
 *
 * @prop {number} index - The step's number, from 1. Set by `punica-stepper`.
 * @prop {boolean} interactive - The step renders a button. Set by `punica-stepper`, true unless it is `linear`.
 *
 * @slot - The title.
 * @slot description - A line under the title.
 *
 * @csspart base - The step: a `button` when interactive, else a `div`.
 * @csspart marker - The circle holding the number or the state glyph.
 * @csspart label - The title.
 * @csspart description - The line under the title.
 * @csspart connector - The line to the next step.
 *
 * @cssprop --punica-step-marker-size - Diameter of the marker.
 * @cssprop --punica-step-color - Accent of an active or complete step.
 * @cssprop --punica-step-error-color - Accent of a step in error.
 * @cssprop --punica-step-connector-color - Color of the connector.
 * @cssprop --punica-step-gap - Space between the step and its connector.
 * @cssprop --punica-step-connector-display - `display` of the connector; `punica-stepper` hides the last one.
 *
 * @cssstate active - The step is the current one.
 */
export class PunicaStep extends PunicaElement {
  static properties = {
    value: {},
    label: {},
    description: {},
    state: {},
    disabled: { type: Boolean },
    active: { type: Boolean },
    orientation: {},
    labelComplete: { default: 'Completed' },
    labelError: { default: 'Error' },
    index: { type: Number, attribute: false },
    interactive: { type: Boolean, attribute: false }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base">
      <span part="marker" class="marker">
        <span class="number"></span>
        <span class="glyph complete">${icons.check}</span>
        <span class="glyph error">${icons.close}</span>
      </span>
      <span class="text">
        <span part="label" class="label"><slot><span class="label-text"></span></slot></span>
        <span part="description" class="description"><slot name="description"><span class="description-text"></span></slot></span>
        <span class="status"></span>
      </span>
    </div>
    <span part="connector" class="connector" aria-hidden="true"></span>
  `;

  #base = this.$('.base');

  constructor() {
    super();
    this.internals.role = 'listitem';
  }

  /** Moves focus to the step's button, when it has one. */
  focus(options) {
    this.#base.focus(options);
  }

  update(changed) {
    const tag = this.interactive ? 'button' : 'div';
    if (this.#base.localName !== tag) {
      const next = document.createElement(tag);
      next.setAttribute('part', 'base');
      next.className = 'base';
      next.append(...this.#base.childNodes);
      this.#base.replaceWith(next);
      this.#base = next;
    }
    const base = /** @type {any} */ (this.#base);
    if (tag === 'button') {
      base.type = 'button';
      base.disabled = this.disabled;
      base.removeAttribute('aria-disabled');
    } else if (this.disabled) {
      base.setAttribute('aria-disabled', 'true');
    } else {
      base.removeAttribute('aria-disabled');
    }
    if (this.active) base.setAttribute('aria-current', 'step');
    else base.removeAttribute('aria-current');
    this.toggleState('active', this.active);

    const lang = this.closest('[lang]')?.lang || navigator.language;
    this.$('.number').textContent = this.index ? new Intl.NumberFormat(lang).format(this.index) : '';
    this.$('.label-text').textContent = this.label ?? '';
    this.$('.description-text').textContent = this.description ?? '';
    this.$('.status').textContent =
      this.state === 'complete' ? this.labelComplete : this.state === 'error' ? this.labelError : '';

    if (changed.has('value') || changed.has('disabled')) {
      /** @type {any} */ (this.parentElement)?.requestUpdate?.();
    }
  }
}

define('punica-step', PunicaStep);
