import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { slotHasContent } from './slots.js';
import styles from './chatMessage.css';

/**
 * One turn of a conversation.
 *
 * The message tells the bubbles inside it how to look through three inherited
 * custom properties, so a `punica-chat-message-bubble` needs no attribute of
 * its own to match its sender.
 *
 * @element punica-chat-message
 *
 * @attr {'user' | 'assistant' | 'system' | 'tool'} sender - Who wrote the turn, `assistant` by default.
 * @attr {string} name - The sender's display name; shown above the content and used as the accessible name.
 * @attr {'streaming' | 'complete' | 'error'} status - Where the turn stands, `complete` by default.
 * @attr {string} label - Accessible name of the turn, when `name` is not enough.
 * @attr {string} label-streaming - Text announced while the turn is streaming, `Writing` by default.
 * @attr {string} label-error - Text shown beside the error icon, `Error` by default.
 *
 * @slot - The content: bubbles, tool calls, markdown.
 * @slot avatar - The sender's picture.
 * @slot metadata - Time, model, token counts; a `punica-chat-message-metadata`.
 * @slot actions - Buttons that act on the turn; shown on hover and on focus.
 *
 * @csspart avatar - The wrapper around the avatar slot.
 * @csspart body - The column beside the avatar.
 * @csspart name - The sender's name.
 * @csspart content - The wrapper around the default slot.
 * @csspart status - The streaming or error line.
 * @csspart footer - The row holding metadata and actions.
 * @csspart metadata - The wrapper around the metadata slot.
 * @csspart actions - The wrapper around the actions slot.
 *
 * @cssprop --punica-chat-message-surface - Background its bubbles take.
 * @cssprop --punica-chat-message-on-surface - Text colour its bubbles take.
 * @cssprop --punica-chat-message-border - Border colour its bubbles take.
 * @cssprop --punica-chat-message-gap - Space between avatar and body.
 * @cssprop --punica-chat-message-max-width - Largest inline size of the body.
 *
 * @cssstate has-avatar - Something is in the avatar slot.
 */
export class PunicaChatMessage extends PunicaElement {
  static properties = {
    sender: { default: 'assistant' },
    name: {},
    status: { default: 'complete' },
    label: {},
    labelStreaming: { default: 'Writing' },
    labelError: { default: 'Error' }
  };

  static styles = styles;
  static template = `
    <div part="avatar" class="avatar"><slot name="avatar"></slot></div>
    <div part="body" class="body">
      <div part="name" class="name" hidden></div>
      <div part="content" class="content"><slot></slot></div>
      <div part="status" class="status" hidden>
        <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="error-icon">${icons.error}</span>
        <span class="status-text"></span>
      </div>
      <div part="footer" class="footer">
        <div part="metadata" class="metadata"><slot name="metadata"></slot></div>
        <div part="actions" class="actions"><slot name="actions"></slot></div>
      </div>
    </div>
  `;

  constructor() {
    super();
    const avatar = this.$('slot[name="avatar"]');
    avatar.addEventListener('slotchange', () => this.toggleState('has-avatar', slotHasContent(avatar)));
  }

  connected() {
    this.internals.role = 'article';
  }

  update() {
    const streaming = this.status === 'streaming';
    const error = this.status === 'error';
    this.internals.ariaLabel = this.label || this.name || null;
    this.internals.ariaBusy = streaming ? 'true' : null;

    const name = this.$('.name');
    name.textContent = this.name || '';
    name.hidden = !this.name;

    const status = this.$('.status');
    status.hidden = !streaming && !error;
    this.$('.status-text').textContent = streaming ? this.labelStreaming : error ? this.labelError : '';
  }
}

define('punica-chat-message', PunicaChatMessage);
