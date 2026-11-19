import { PunicaElement, define } from '../../core/element.js';
import styles from './cardMedia.css';

/**
 * A picture or a video that runs to the edges of its card.
 *
 * @element punica-card-media
 *
 * @slot - An `<img>`, `<video>` or `<picture>`; it fills the card's inline size.
 *
 * @cssprop --punica-card-media-height - Block size of the media, `auto` by default.
 * @cssprop --punica-card-media-fit - `object-fit` of the media, `cover` by default.
 */
export class PunicaCardMedia extends PunicaElement {
  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-card-media', PunicaCardMedia);
