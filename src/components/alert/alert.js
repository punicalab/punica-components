import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './alert.css';

/**
 * A message about the content beside it: a result, a warning, a tip.
 *
 * An error or a warning is `role=alert` and interrupts a screen reader; any
 * other colour is `role=status` and waits its turn.
 *
 * @element punica-alert
 *
 * @attr {'info' | 'success' | 'warning' | 'error' | 'primary' | 'secondary' | 'neutral'} color - What the message is, `info` by default.
 * @attr {'tinted' | 'outlined' | 'filled'} variant - Visual weight, `tinted` by default.
 * @attr {boolean} dismissible - Shows a close button.
 * @attr {string} label-close - Accessible name of the close button, `Close` by default.
 *
 * @slot - The message.
 * @slot icon - An icon in place of the one the colour gives.
 * @slot actions - Buttons that answer the message.
 *
 * @fires punica-dismiss - The user pressed the close button. Cancelable: unless prevented, the alert hides itself with `hidden`.
 *
 * @csspart icon - The default icon.
 * @csspart content - The wrapper around the message.
 * @csspart actions - The wrapper around the actions.
 * @csspart close - The close button.
 *
 * @cssprop --punica-alert-radius - Corner radius.
 * @cssprop --punica-alert-padding - Padding.
 * @cssprop --punica-alert-gap - Space between icon, message and actions.
 */
export class PunicaAlert extends PunicaElement {
  static properties = {
    color: {},
    variant: {},
    dismissible: { type: Boolean },
    labelClose: { default: 'Close' }
  };

  static styles = styles;
  static template = `
    <span class="icon"><slot name="icon"><span class="default info">${icons.info}</span><span class="default success">${icons.success}</span><span class="default warning">${icons.warning}</span><span class="default error">${icons.error}</span></slot></span>
    <div part="content" class="content"><slot></slot></div>
    <div part="actions" class="actions"><slot name="actions"></slot></div>
    <button part="close" class="close" type="button" hidden>${icons.close}</button>
  `;

  #close = this.$('.close');

  constructor() {
    super();
    this.#close.addEventListener('click', () => this.dismiss());
  }

  update() {
    this.internals.role = this.color === 'error' || this.color === 'warning' ? 'alert' : 'status';
    this.#close.hidden = !this.dismissible;
    this.#close.setAttribute('aria-label', this.labelClose ?? '');
  }

  /**
   * Does what the close button does: fires `punica-dismiss` and, unless a
   * listener prevents it, hides the alert.
   */
  dismiss() {
    if (!this.emit('dismiss', {}, { cancelable: true }).defaultPrevented) this.hidden = true;
  }
}

define('punica-alert', PunicaAlert);
