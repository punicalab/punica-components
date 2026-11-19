import { PunicaElement, define } from '../../core/element.js';
import { deepActiveElement, composedContains } from '../../core/a11y.js';
import './inputGroupText.js';
import styles from './inputGroup.css';

/**
 * Joins a control and its addons into one box: a `punica-input`,
 * `punica-select`, `punica-number-input` or another field, with
 * `punica-input-group-text`, `punica-button` and `punica-icon-button` on
 * either side. The parts share one border; only the outer corners are
 * rounded, mirrored right-to-left. One focus ring goes around the whole
 * group while any part has keyboard focus, and a focused button also marks
 * itself inside it.
 *
 * The group is layout only: it submits nothing and never writes an attribute
 * on a child. `size` reaches the children through their custom properties.
 *
 * @element punica-input-group
 *
 * @attr {'small' | 'medium' | 'large'} size - Height of every part, given to the children through their custom properties. Without it each child keeps its own.
 * @attr {string} label - Accessible name; the group is then a `group` named by it.
 * @attr {boolean} disabled - Dims the group and takes no input or focus. The controls inside keep their values; disable them, or a fieldset around the group, to keep them out of a form.
 * @attr {boolean} full-width - Fills its container's inline size.
 *
 * @slot - The control and its addons, in reading order.
 *
 * @csspart base - The row around the parts; the focus ring is drawn on it.
 *
 * @cssprop --punica-input-group-radius - Radius of the outer corners.
 *
 * @cssstate focus-visible - A part has keyboard focus.
 * @cssstate focus-within - A part has focus.
 */
export class PunicaInputGroup extends PunicaElement {
  static properties = {
    size: {},
    label: {},
    disabled: { type: Boolean },
    fullWidth: { type: Boolean }
  };

  static styles = styles;
  static template = `<div part="base" class="base"><slot></slot></div>`;

  #base = this.$('.base');

  constructor() {
    super();
    const refresh = () => queueMicrotask(() => this.#focusChanged());
    this.addEventListener('focusin', refresh);
    this.addEventListener('focusout', refresh);
  }

  update() {
    const internals = this.internals;
    internals.role = this.label ? 'group' : null;
    internals.ariaLabel = this.label || null;
    internals.ariaDisabled = this.disabled ? 'true' : null;
    this.#base.inert = this.disabled;
  }

  #focusChanged() {
    const active = deepActiveElement();
    const within = !!active && active !== document.body && composedContains(this, active);
    let visible = false;
    try {
      visible = within && active.matches(':focus-visible');
    } catch {
      visible = within;
    }
    this.toggleState('focus-within', within);
    this.toggleState('focus-visible', visible);
  }
}

define('punica-input-group', PunicaInputGroup);
