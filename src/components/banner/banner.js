import { define } from '../../core/element.js';
import { PunicaAlert } from '../alert/alert.js';
import alertStyles from '../alert/alert.css';
import styles from './banner.css';

/**
 * A message about the whole page, across its full width: an outage, a trial
 * that ends, a new version.
 *
 * It is `punica-alert` laid out as a bar: the same attributes, slots, close
 * button and event, with `role=alert` for an error or a warning and
 * `role=status` otherwise.
 *
 * @element punica-banner
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
 * @fires punica-dismiss - The user pressed the close button. Cancelable: unless prevented, the banner hides itself with `hidden`.
 *
 * @csspart icon - The default icon.
 * @csspart content - The wrapper around the message.
 * @csspart actions - The wrapper around the actions.
 * @csspart close - The close button.
 *
 * @cssprop --punica-banner-padding - Padding.
 * @cssprop --punica-banner-max-width - Largest inline size of the message, for a centred bar.
 */
export class PunicaBanner extends PunicaAlert {
  static styles = [alertStyles, styles];
}

define('punica-banner', PunicaBanner);
