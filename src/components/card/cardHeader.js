import { PunicaElement, define } from '../../core/element.js';
import styles from './cardHeader.css';

/**
 * The top of a card: a title, a line under it, and something at either end.
 *
 * @element punica-card-header
 *
 * @slot - The title.
 * @slot subtitle - A line under the title.
 * @slot start - Leading content, an avatar or an icon.
 * @slot end - Trailing content, a menu button.
 *
 * @csspart title - The wrapper around the title.
 * @csspart subtitle - The wrapper around the subtitle.
 *
 * @cssprop --punica-card-header-padding - Padding.
 * @cssprop --punica-card-header-gap - Space between the leading content, the text and the trailing content.
 */
export class PunicaCardHeader extends PunicaElement {
  static styles = styles;
  static template = `
    <slot name="start"></slot>
    <div class="text">
      <div part="title" class="title"><slot></slot></div>
      <div part="subtitle" class="subtitle"><slot name="subtitle"></slot></div>
    </div>
    <slot name="end"></slot>
  `;
}

define('punica-card-header', PunicaCardHeader);
