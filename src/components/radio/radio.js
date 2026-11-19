import { PunicaElement, define } from '../../core/element.js';
import styles from './radio.css';

/**
 * One choice of a `<punica-radio-group>`. The group owns the value, the
 * keyboard and the tab order; a radio outside a group does nothing.
 *
 * @element punica-radio
 *
 * @attr {string} value - What the radio stands for; the group's value while it is checked.
 * @attr {boolean} checked - Chosen. Set by the group; set it yourself only to mark the initial choice.
 * @attr {boolean} disabled - Cannot be chosen and is skipped by the arrow keys.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `primary` by default.
 *
 * @slot - The label.
 *
 * @csspart control - The drawn circle.
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop --punica-radio-size - Size of the circle.
 * @cssprop --punica-radio-border-color - Border of the empty circle.
 * @cssprop --punica-radio-color - Colour of the chosen circle.
 * @cssprop --punica-radio-gap - Space between the circle and the label.
 *
 * @cssstate checked - Chosen.
 * @cssstate disabled - Disabled, by itself or by its group.
 */
export class PunicaRadio extends PunicaElement {
  static properties = {
    value: {},
    checked: { type: Boolean },
    disabled: { type: Boolean },
    color: {}
  };

  static styles = styles;
  static template = `
    <span part="control" class="control"></span>
    <span part="label" class="label"><slot></slot></span>
  `;

  update() {
    const group = /** @type {any} */ (this.closest('punica-radio-group'));
    const off = this.disabled || !!group?.isDisabled;
    const internals = this.internals;
    internals.role = 'radio';
    internals.ariaChecked = String(this.checked);
    internals.ariaDisabled = off ? 'true' : null;
    this.toggleState('checked', this.checked);
    this.toggleState('disabled', off);
  }
}

define('punica-radio', PunicaRadio);
