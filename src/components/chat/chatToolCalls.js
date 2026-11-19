import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './chatToolCalls.css';

/**
 * The tools a turn called, folded under one line.
 *
 * @element punica-chat-tool-calls
 *
 * @attr {boolean} open - The list is showing.
 * @attr {string} label - Text of the header, `Tool calls` by default.
 *
 * @slot - The `punica-chat-tool-call` items.
 *
 * @fires punica-toggle - The person expanded or collapsed the list. `detail.open`.
 *
 * @csspart header - The native button that folds the list.
 * @csspart label - The header's text.
 * @csspart count - The number of calls.
 * @csspart panel - The list.
 *
 * @cssprop --punica-chat-tool-calls-gap - Space between calls.
 * @cssprop --punica-chat-tool-calls-color - Colour of the header.
 */
export class PunicaChatToolCalls extends PunicaElement {
  static properties = {
    open: { type: Boolean },
    label: { default: 'Tool calls' }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <button part="header" class="header" type="button" aria-expanded="false" aria-controls="panel">
      <span class="chevron">${icons.chevronEnd}</span>
      <span part="label" class="label"></span>
      <span part="count" class="count"></span>
    </button>
    <div part="panel" class="panel" id="panel" role="group" hidden><slot></slot></div>
  `;

  #slot = this.$('slot');

  constructor() {
    super();
    this.$('.header').addEventListener('click', () => {
      this.open = !this.open;
      this.emit('toggle', { open: this.open });
    });
    this.#slot.addEventListener('slotchange', () => this.#count());
  }

  update() {
    this.$('.header').setAttribute('aria-expanded', String(this.open));
    this.$('.label').textContent = this.label;
    const panel = this.$('.panel');
    panel.hidden = !this.open;
    panel.setAttribute('aria-label', this.label);
    this.#count();
  }

  #count() {
    const count = this.#slot.assignedElements({ flatten: true }).length;
    const lang = this.closest('[lang]')?.lang || navigator.language;
    let text = String(count);
    try {
      text = new Intl.NumberFormat(lang).format(count);
    } catch {
      // An unknown language tag keeps the plain number.
    }
    this.$('.count').textContent = count ? text : '';
  }
}

define('punica-chat-tool-calls', PunicaChatToolCalls);
