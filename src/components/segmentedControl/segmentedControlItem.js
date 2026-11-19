import { PunicaElement, define } from '../../core/element.js';
import styles from './segmentedControlItem.css';

/**
 * One segment of a `<punica-segmented-control>`. The control owns the
 * value, the keyboard and the tab order.
 *
 * @element punica-segmented-control-item
 *
 * @attr {string} value - What the segment stands for; the control's value while it is selected.
 * @attr {boolean} selected - Chosen. Set by the control; set it yourself only to mark the initial choice.
 * @attr {boolean} disabled - Cannot be chosen and is skipped by the arrow keys.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 *
 * @csspart base - The wrapper around the slots.
 *
 * @cssprop --punica-segmented-control-item-padding - Inline padding.
 *
 * @cssstate selected - Chosen.
 * @cssstate disabled - Disabled, by itself or by its control.
 */
export class PunicaSegmentedControlItem extends PunicaElement {
  static properties = {
    value: {},
    selected: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `<span part="base" class="base"><slot name="start"></slot><slot></slot></span>`;

  update() {
    const control = /** @type {any} */ (this.closest('punica-segmented-control'));
    const off = this.disabled || !!control?.isDisabled;
    const internals = this.internals;
    internals.role = 'radio';
    internals.ariaChecked = String(this.selected);
    internals.ariaDisabled = off ? 'true' : null;
    this.toggleState('selected', this.selected);
    this.toggleState('disabled', off);
  }
}

define('punica-segmented-control-item', PunicaSegmentedControlItem);
