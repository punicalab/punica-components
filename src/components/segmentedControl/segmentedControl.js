import { define } from '../../core/element.js';
import { isRtl, onDirectionChange } from '../../core/a11y.js';
import { PunicaRadioGroup } from '../radio/radioGroup.js';
import './segmentedControlItem.js';
import styles from './segmentedControl.css';

/**
 * A single choice shown as one bar of segments, with an indicator that
 * slides to the chosen one. It is a radio group in every other respect:
 * a form control with `value`, one tab stop, arrow keys, Home and End that
 * move and choose, and Space.
 *
 * @element punica-segmented-control
 *
 * @attr {string} value - Default value. The property holds the current value.
 * @attr {string} name - Name the value is submitted under.
 * @attr {string} label - Accessible name of the control.
 * @attr {boolean} disabled - Disables every segment and submits nothing.
 * @attr {boolean} required - A segment has to be chosen before the form submits.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {boolean} full-width - Fills its container; the segments share the space.
 * @attr {'horizontal'} orientation - Always `horizontal`: the bar is one row, and the left and right arrows move along it.
 *
 * @slot - The `<punica-segmented-control-item>` elements.
 *
 * @fires {{ value: string }} punica-change - The user chose another segment; `detail: { value }`.
 *
 * @csspart base - The bar.
 * @csspart indicator - The sliding highlight behind the chosen segment.
 *
 * @cssprop --punica-segmented-control-height - Block size of the bar.
 * @cssprop --punica-segmented-control-radius - Corner radius of the bar.
 * @cssprop --punica-segmented-control-background - Background of the bar.
 * @cssprop --punica-segmented-control-indicator-color - Background of the indicator.
 * @cssprop --punica-segmented-control-wrap - `wrap` lets the segments go onto more lines when the bar is narrower than they are; `nowrap` by default.
 *
 * @cssstate invalid - Required and nothing is chosen.
 * @cssstate valid - Meets its constraint.
 * @cssstate disabled - Disabled by a fieldset around it.
 */
export class PunicaSegmentedControl extends PunicaRadioGroup {
  static properties = {
    orientation: { default: 'horizontal' },
    size: {},
    fullWidth: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <div part="indicator" class="indicator" hidden></div>
      <slot></slot>
    </div>
  `;

  static itemTag = 'punica-segmented-control-item';
  static itemFlag = 'selected';

  /** @type {ResizeObserver | null} */
  #observer = null;
  /** @type {HTMLElement | null} */
  #chosen = null;

  connected() {
    // A segment's box moves when the bar or any label changes size.
    this.#observer = new ResizeObserver(() => this.#place());
    this.#observer.observe(this);
    onDirectionChange(() => this.#place(), this.signal);
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  selectionChanged(item) {
    this.#chosen = item;
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer.observe(this);
      for (const each of this.items) this.#observer.observe(each);
    }
    this.#place();
  }

  /** Puts the indicator behind the chosen segment. */
  #place() {
    const indicator = this.$('.indicator');
    const item = this.#chosen;
    if (!item || !item.isConnected) {
      indicator.hidden = true;
      return;
    }
    const base = this.$('.base').getBoundingClientRect();
    const box = item.getBoundingClientRect();
    const start = isRtl(this) ? base.right - box.right : box.left - base.left;
    indicator.style.setProperty('--_start', `${start}px`);
    indicator.style.setProperty('--_size', `${box.width}px`);
    indicator.style.setProperty('--_top', `${box.top - base.top}px`);
    indicator.style.setProperty('--_block', `${box.height}px`);
    // Shown only once placed, so the first placement does not slide in.
    indicator.hidden = false;
  }
}

define('punica-segmented-control', PunicaSegmentedControl);
