import { PunicaElement, define } from '../../core/element.js';
import styles from './progressBar.css';

/**
 * A bar that fills as a task of known length advances, or sweeps while the
 * length is unknown.
 *
 * @element punica-progress-bar
 *
 * @attr {number} value - How far the task is, from 0 to `max`. Without it the bar is indeterminate.
 * @attr {number} max - The value that means done, `100` by default.
 * @attr {string} label - Accessible name.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Colour of the indicator, `primary` by default.
 * @attr {'small' | 'medium' | 'large'} size - Thickness of the bar, `medium` by default.
 * @attr {boolean} show-value - Shows the percentage beside the bar, in the element's language.
 *
 * @csspart track - The full length of the bar.
 * @csspart indicator - The filled part.
 * @csspart value - The percentage text.
 *
 * @cssprop --punica-progress-bar-height - Thickness of the bar.
 * @cssprop --punica-progress-bar-color - Colour of the indicator.
 * @cssprop --punica-progress-bar-track-color - Colour of the track.
 *
 * @cssstate indeterminate - No `value` is set.
 */
export class PunicaProgressBar extends PunicaElement {
  static properties = {
    label: {},
    color: {},
    size: {},
    value: { type: Number },
    max: { type: Number, default: 100 },
    showValue: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="track" class="track"><div part="indicator" class="indicator"></div></div>
    <span part="value" class="value" aria-hidden="true" hidden></span>
  `;

  #indicator = this.$('.indicator');
  #value = this.$('.value');

  update() {
    const internals = this.internals;
    const max = this.max > 0 ? this.max : 100;
    const determinate = this.value != null;
    const value = determinate ? Math.min(Math.max(this.value, 0), max) : 0;
    const ratio = value / max;

    internals.role = 'progressbar';
    internals.ariaLabel = this.label;
    internals.ariaValueMin = '0';
    internals.ariaValueMax = String(max);
    this.toggleState('indeterminate', !determinate);

    let text = '';
    if (determinate) {
      const language = this.closest('[lang]')?.lang || navigator.language;
      text = new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);
    }
    internals.ariaValueNow = determinate ? String(value) : null;
    internals.ariaValueText = determinate ? text : null;

    this.#indicator.style.setProperty('--_ratio', String(ratio));
    this.#value.textContent = text;
    this.#value.hidden = !(this.showValue && determinate);
  }
}

define('punica-progress-bar', PunicaProgressBar);
