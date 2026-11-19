import { PunicaElement, define } from '../../core/element.js';
import styles from './statusDot.css';

/**
 * A small disc that says a state: running, failed, waiting.
 *
 * @element punica-status-dot
 *
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - The state's colour, `neutral` by default.
 * @attr {boolean} pulse - A ring pulses around the disc, for something in progress.
 * @attr {string} label - Accessible name; the dot is then an image. Without it the dot is hidden from assistive technology.
 *
 * @csspart base - The disc.
 *
 * @cssprop --punica-status-dot-size - Diameter, 6px by default.
 * @cssprop --punica-status-dot-color - Colour of the disc.
 */
export class PunicaStatusDot extends PunicaElement {
  static properties = {
    color: {},
    label: {},
    pulse: { type: Boolean }
  };

  static styles = styles;
  static template = `<span part="base" class="dot"></span>`;

  update() {
    const internals = this.internals;
    if (this.label) {
      internals.role = 'img';
      internals.ariaLabel = this.label;
      internals.ariaHidden = null;
    } else {
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaHidden = 'true';
    }
  }
}

define('punica-status-dot', PunicaStatusDot);
