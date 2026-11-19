import { PunicaElement, define } from '../../core/element.js';
import styles from './spinner.css';

/**
 * A ring that turns while something of unknown length is under way.
 *
 * @element punica-spinner
 *
 * @attr {'small' | 'medium' | 'large'} size - Diameter, `medium` by default.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Colour of the ring, `primary` by default.
 * @attr {string} label - Accessible name of the progress, `Loading` by default.
 * @attr {boolean} decorative - Hidden from assistive technology, for a spinner beside text that already says it.
 *
 * @csspart base - The ring.
 *
 * @cssprop --punica-spinner-size - Diameter.
 * @cssprop --punica-spinner-color - Colour of the ring.
 * @cssprop --punica-spinner-track-color - Colour of the part of the ring that stays still.
 * @cssprop --punica-spinner-width - Thickness of the ring.
 */
export class PunicaSpinner extends PunicaElement {
  static properties = {
    size: {},
    color: {},
    label: { default: 'Loading' },
    decorative: { type: Boolean }
  };

  static styles = styles;
  static template = `<span part="base" class="ring"></span>`;

  update() {
    const internals = this.internals;
    if (this.decorative) {
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaHidden = 'true';
    } else {
      internals.role = 'progressbar';
      internals.ariaLabel = this.label;
      internals.ariaHidden = null;
    }
  }
}

define('punica-spinner', PunicaSpinner);
