import { PunicaElement, define } from '../../core/element.js';
import styles from './chatMessageMetadata.css';

/**
 * A small muted row under a message: when it was sent, which model wrote it,
 * what it cost.
 *
 * @element punica-chat-message-metadata
 *
 * @slot - Anything else.
 * @slot time - When the turn was sent; a `<time>`.
 * @slot model - The model's name.
 * @slot tokens - Token counts.
 *
 * @csspart base - The row.
 *
 * @cssprop --punica-chat-message-metadata-color - Text colour.
 * @cssprop --punica-chat-message-metadata-gap - Space between entries.
 */
export class PunicaChatMessageMetadata extends PunicaElement {
  static styles = styles;
  static template = `
    <div part="base" class="base">
      <slot name="time"></slot>
      <slot name="model"></slot>
      <slot name="tokens"></slot>
      <slot></slot>
    </div>
  `;
}

define('punica-chat-message-metadata', PunicaChatMessageMetadata);
