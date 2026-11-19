import { PunicaElement, define } from '../../core/element.js';
import { slotHasContent } from './slots.js';
import styles from './chatMessageList.css';

/**
 * The list of turns in a conversation, announced as they arrive.
 *
 * @element punica-chat-message-list
 *
 * @attr {string} label - Accessible name of the log, `Conversation` by default.
 *
 * @slot - The messages.
 * @slot empty - Shown while there is no message.
 *
 * @csspart base - The column of messages.
 * @csspart empty - The wrapper around the empty slot.
 *
 * @cssprop --punica-chat-message-list-gap - Space between messages.
 *
 * @cssstate empty - There is no message.
 */
export class PunicaChatMessageList extends PunicaElement {
  static properties = {
    label: { default: 'Conversation' }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base"><slot></slot></div>
    <div part="empty" class="empty"><slot name="empty"></slot></div>
  `;

  #slot = this.$('slot:not([name])');

  constructor() {
    super();
    this.#slot.addEventListener('slotchange', () => this.#count());
  }

  connected() {
    this.internals.role = 'log';
    this.internals.ariaLive = 'polite';
    this.#count();
  }

  update() {
    this.internals.ariaLabel = this.label;
  }

  #count() {
    this.toggleState('empty', !slotHasContent(this.#slot));
  }
}

define('punica-chat-message-list', PunicaChatMessageList);
