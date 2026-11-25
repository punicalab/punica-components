import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { slotHasContent } from './slots.js';
import styles from './chatToolCall.css';

/**
 * One tool invocation: its name and outcome on a line that unfolds to what
 * went in and what came out.
 *
 * @element punica-chat-tool-call
 *
 * @attr {string} name - The tool's name.
 * @attr {'pending' | 'running' | 'success' | 'error'} status - Where the call stands, `pending` by default.
 * @attr {number} duration - How long the call took, in milliseconds.
 * @attr {boolean} open - The input and output are showing.
 * @attr {string} label-pending - Text for `pending`, `Pending` by default.
 * @attr {string} label-running - Text for `running`, `Running` by default.
 * @attr {string} label-success - Text for `success`, `Done` by default.
 * @attr {string} label-error - Text for `error`, `Failed` by default.
 * @attr {string} label-input - Heading of the input, `Input` by default.
 * @attr {string} label-output - Heading of the output, `Output` by default.
 *
 * @slot - Anything else shown when open.
 * @slot input - What the tool was called with; a `punica-code-block` or a `<pre>`.
 * @slot output - What the tool returned.
 *
 * @fires {{ open: boolean }} punica-toggle - The person expanded or collapsed the call. `detail.open`.
 *
 * @csspart base - The bordered box.
 * @csspart header - The native button that unfolds the call.
 * @csspart name - The tool's name.
 * @csspart status - The status icon and text.
 * @csspart status-text - The status text.
 * @csspart duration - The duration.
 * @csspart panel - The unfolded area.
 * @csspart section - The input or the output block.
 * @csspart section-label - The heading of a block.
 *
 * @cssprop --punica-chat-tool-call-background - Background.
 * @cssprop --punica-chat-tool-call-border-color - Border colour.
 * @cssprop --punica-chat-tool-call-radius - Corner radius.
 */
export class PunicaChatToolCall extends PunicaElement {
  static properties = {
    name: {},
    status: { default: 'pending' },
    duration: { type: Number },
    open: { type: Boolean },
    labelPending: { default: 'Pending' },
    labelRunning: { default: 'Running' },
    labelSuccess: { default: 'Done' },
    labelError: { default: 'Failed' },
    labelInput: { default: 'Input' },
    labelOutput: { default: 'Output' }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="base" class="base">
      <button part="header" class="header" type="button" aria-expanded="false" aria-controls="panel">
        <span class="chevron">${icons.chevronEnd}</span>
        <span part="name" class="name"></span>
        <span part="status" class="status">
          <span class="glyph glyph-pending">${icons.clock}</span>
          <span class="glyph glyph-running"><span class="spinner" aria-hidden="true"></span></span>
          <span class="glyph glyph-success">${icons.success}</span>
          <span class="glyph glyph-error">${icons.error}</span>
          <span part="status-text" class="status-text"></span>
        </span>
        <span part="duration" class="duration"></span>
      </button>
      <div part="panel" class="panel" id="panel" role="group" hidden>
        <div part="section" class="section" data-slot="input" hidden>
          <div part="section-label" class="section-label"></div>
          <slot name="input"></slot>
        </div>
        <div part="section" class="section" data-slot="output" hidden>
          <div part="section-label" class="section-label"></div>
          <slot name="output"></slot>
        </div>
        <slot></slot>
      </div>
    </div>
  `;

  constructor() {
    super();
    this.$('.header').addEventListener('click', () => {
      this.open = !this.open;
      this.emit('toggle', { open: this.open });
    });
    for (const section of this.shadowRoot.querySelectorAll('.section')) {
      const slot = section.querySelector('slot');
      slot.addEventListener('slotchange', () => {
        section.hidden = !slotHasContent(slot);
      });
    }
  }

  update() {
    const labels = {
      pending: this.labelPending,
      running: this.labelRunning,
      success: this.labelSuccess,
      error: this.labelError
    };
    const status = Object.hasOwn(labels, this.status) ? this.status : 'pending';
    this.$('.status').dataset.status = status;
    this.$('.status-text').textContent = labels[status];
    this.$('.name').textContent = this.name || '';
    this.$('.duration').textContent = this.#formatDuration();

    this.$('.header').setAttribute('aria-expanded', String(this.open));
    const panel = this.$('.panel');
    panel.hidden = !this.open;
    if (this.name) panel.setAttribute('aria-label', this.name);
    else panel.removeAttribute('aria-label');
    this.$('[data-slot="input"] .section-label').textContent = this.labelInput;
    this.$('[data-slot="output"] .section-label').textContent = this.labelOutput;
  }

  #formatDuration() {
    const ms = this.duration;
    if (ms == null || ms < 0) return '';
    const seconds = ms >= 1000;
    const lang = this.closest('[lang]')?.lang || navigator.language;
    const options = {
      style: 'unit',
      unit: seconds ? 'second' : 'millisecond',
      unitDisplay: 'narrow',
      maximumFractionDigits: seconds ? 1 : 0
    };
    const amount = seconds ? ms / 1000 : ms;
    try {
      return new Intl.NumberFormat(lang, options).format(amount);
    } catch {
      return new Intl.NumberFormat(undefined, options).format(amount);
    }
  }
}

define('punica-chat-tool-call', PunicaChatToolCall);
