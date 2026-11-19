import { PunicaElement, define } from '../../core/element.js';
import styles from './chatSystemMessage.css';

/**
 * A centred notice between turns: the conversation was renamed, the model
 * changed, the context was trimmed.
 *
 * @element punica-chat-system-message
 *
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `neutral` by default.
 *
 * @slot - The notice.
 * @slot icon - A glyph before the notice.
 *
 * @csspart base - The row with its two rules.
 * @csspart label - The pill around icon and text.
 *
 * @cssprop --punica-chat-system-message-color - Text colour.
 * @cssprop --punica-chat-system-message-background - Background of the pill.
 * @cssprop --punica-chat-system-message-line-color - Colour of the rule on each side.
 */
export class PunicaChatSystemMessage extends PunicaElement {
  static properties = {
    color: {}
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <span part="label" class="label"><slot name="icon"></slot><slot></slot></span>
    </div>
  `;

  connected() {
    this.internals.role = 'note';
  }
}

define('punica-chat-system-message', PunicaChatSystemMessage);
