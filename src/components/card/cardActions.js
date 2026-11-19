import { PunicaElement, define } from '../../core/element.js';
import styles from './cardActions.css';

/**
 * The row of buttons at the foot of a card.
 *
 * @element punica-card-actions
 *
 * @attr {'start' | 'end' | 'between'} align - Where the buttons sit on the inline axis, `end` by default.
 *
 * @slot - The buttons.
 *
 * @cssprop --punica-card-actions-padding - Padding.
 * @cssprop --punica-card-actions-gap - Space between buttons.
 */
export class PunicaCardActions extends PunicaElement {
  static properties = {
    align: {}
  };

  static styles = styles;
  static template = `<slot></slot>`;
}

define('punica-card-actions', PunicaCardActions);
