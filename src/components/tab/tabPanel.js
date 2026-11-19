import { PunicaElement, define } from '../../core/element.js';
import styles from './tabPanel.css';

/**
 * The content one tab of a `punica-tabs` shows.
 *
 * @element punica-tab-panel
 *
 * @attr {string} value - Pairs the panel with the `punica-tab` of the same value; its position when absent.
 * @attr {boolean} active - The panel is the one showing. Set by `punica-tabs`.
 *
 * @slot - The panel's content.
 *
 * @csspart base - The wrapper around the content.
 *
 * @cssprop --punica-tab-panel-padding - Padding of the panel.
 *
 * @cssstate active - The panel is the one showing.
 */
export class PunicaTabPanel extends PunicaElement {
  static properties = {
    value: {},
    active: { type: Boolean }
  };

  static styles = styles;
  static template = `<div part="base" class="base"><slot></slot></div>`;

  constructor() {
    super();
    this.internals.role = 'tabpanel';
  }

  connected() {
    // A panel is a tab stop of its own, so its text is reachable.
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }

  update(changed) {
    this.toggleState('active', this.active);
    if (changed.has('value')) /** @type {any} */ (this.parentElement)?.requestUpdate?.();
  }
}

define('punica-tab-panel', PunicaTabPanel);
