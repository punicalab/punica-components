import { PunicaElement, define } from '../../core/element.js';
import styles from './chatMessageBubble.css';

/**
 * The surface a message's content sits on.
 *
 * Inside a `punica-chat-message` the bubble takes its colours from the
 * message's sender: the message declares `--punica-chat-message-surface`,
 * `--punica-chat-message-on-surface` and `--punica-chat-message-border`, and
 * the bubble's own custom properties default to them. Outside a message, or to
 * override one bubble, set `variant` or the bubble's custom properties.
 *
 * @element punica-chat-message-bubble
 *
 * @attr {'filled' | 'outlined' | 'plain'} variant - `filled` (the default) takes the sender's surface, `outlined` is a border on no fill, `plain` is bare content with no surface.
 *
 * @slot - The content.
 *
 * @csspart base - The surface.
 *
 * @cssprop --punica-chat-message-bubble-background - Background; the message's surface by default.
 * @cssprop --punica-chat-message-bubble-color - Text colour; the message's on-surface colour by default.
 * @cssprop --punica-chat-message-bubble-border-color - Border colour; the message's border by default.
 * @cssprop --punica-chat-message-bubble-radius - Corner radius.
 * @cssprop --punica-chat-message-bubble-padding - Padding.
 */
export class PunicaChatMessageBubble extends PunicaElement {
  static properties = {
    variant: {}
  };

  static styles = styles;
  static template = `<div part="base" class="base"><slot></slot></div>`;
}

define('punica-chat-message-bubble', PunicaChatMessageBubble);
