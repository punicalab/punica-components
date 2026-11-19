import { PunicaElement, define } from '../../core/element.js';
import styles from './tab.css';

/**
 * One tab of a `punica-tabs`.
 *
 * @element punica-tab
 *
 * @attr {string} value - Pairs the tab with the `punica-tab-panel` of the same value; its position when absent.
 * @attr {boolean} disabled - The tab cannot be focused or selected.
 * @attr {boolean} selected - The tab is the selected one. Set by `punica-tabs`.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 * @slot end - Content after the label.
 *
 * @csspart base - The wrapper around the slots.
 *
 * @cssprop --punica-tab-padding - Padding of the tab.
 * @cssprop --punica-tab-color - Text color of an unselected tab.
 * @cssprop --punica-tab-selected-color - Text color of the selected tab.
 * @cssprop --punica-tab-hover-background - Background under the pointer.
 *
 * @cssstate selected - The tab is the selected one.
 */
export class PunicaTab extends PunicaElement {
  static properties = {
    value: {},
    disabled: { type: Boolean },
    selected: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <span part="base" class="base">
      <slot name="start"></slot>
      <slot></slot>
      <slot name="end"></slot>
    </span>
  `;

  constructor() {
    super();
    this.internals.role = 'tab';
  }

  connected() {
    // The container shows tabs in its tab list slot.
    if (!this.hasAttribute('slot')) this.slot = 'tab';
  }

  update(changed) {
    this.internals.ariaSelected = String(this.selected);
    // A disabled set disables every tab in it.
    const off = this.disabled || !!(/** @type {any} */ (this.parentElement)?.disabled);
    this.internals.ariaDisabled = off ? 'true' : null;
    this.toggleState('selected', this.selected);
    if (changed.has('value') || changed.has('disabled')) {
      /** @type {any} */ (this.parentElement)?.requestUpdate?.();
    }
  }
}

define('punica-tab', PunicaTab);
