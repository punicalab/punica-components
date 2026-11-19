import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './metadataListItem.css';

/**
 * One label and its value in a `punica-metadata-list`.
 *
 * The label is the `label` attribute, or the `label` slot for a label with
 * an icon or markup; the value is the default slot. They are exposed as a
 * term and its definition. With `copyable` a button beside the value copies
 * it, and a polite live region says so.
 *
 * @element punica-metadata-list-item
 *
 * @attr {string} label - The label, the key.
 * @attr {boolean} copyable - Shows a button that copies the value.
 * @attr {string} copy-value - The text copied, in place of the value's text.
 * @attr {string} label-copy - Accessible name of the copy button, `Copy` by default; the label describes it.
 * @attr {string} label-copied - Announced after a copy, `Copied` by default.
 *
 * @slot - The value.
 * @slot label - The label, in place of the `label` attribute.
 *
 * @csspart label - The term.
 * @csspart value - The definition.
 * @csspart copy-button - The copy button.
 * @csspart status - The live region that announces a copy.
 *
 * @cssprop --punica-metadata-list-item-label-color - Colour of the label.
 *
 * @cssstate copied - For two seconds after a copy.
 */
export class PunicaMetadataListItem extends PunicaElement {
  static properties = {
    label: {},
    copyable: { type: Boolean },
    copyValue: {},
    labelCopy: { default: 'Copy' },
    labelCopied: { default: 'Copied' }
  };

  static styles = styles;
  static template = `
    <span part="label" class="label" role="term" id="term"><slot name="label"><span class="label-text"></span></slot></span>
    <span part="value" class="value" role="definition">
      <span class="content"><slot></slot></span>
      <button part="copy-button" class="copy" type="button" aria-describedby="term" hidden>
        <span class="when-idle">${icons.copy}</span>
        <span class="when-copied">${icons.check}</span>
      </button>
    </span>
    <span part="status" class="status" role="status" hidden></span>
  `;

  #labelText = this.$('.label-text');
  #copy = this.$('.copy');
  #status = this.$('.status');
  #content = this.$('slot:not([name])');
  #timer = 0;

  constructor() {
    super();
    this.#copy.addEventListener('click', () => this.copy());
  }

  /** The text the copy button copies. */
  get text() {
    if (this.copyValue != null) return this.copyValue;
    return this.#content
      .assignedNodes({ flatten: true })
      .map((n) => n.textContent)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  disconnected() {
    this.#clear();
  }

  update() {
    this.internals.role = 'listitem';
    this.#labelText.textContent = this.label ?? '';
    this.#copy.hidden = !this.copyable;
    // The live region exists only where something can be copied.
    this.#status.hidden = !this.copyable;
    this.#copy.setAttribute('aria-label', this.labelCopy ?? '');
    this.#copy.title = this.labelCopy ?? '';
  }

  /**
   * Copies the value to the clipboard and announces it.
   * @returns {Promise<boolean>} whether the clipboard took it
   */
  async copy() {
    try {
      await navigator.clipboard.writeText(this.text);
    } catch {
      return false;
    }
    if (!this.isConnected) return true;
    clearTimeout(this.#timer);
    this.toggleState('copied', true);
    this.#status.textContent = this.labelCopied ?? '';
    this.#timer = setTimeout(() => this.#clear(), 2000);
    return true;
  }

  #clear() {
    clearTimeout(this.#timer);
    this.#timer = 0;
    this.toggleState('copied', false);
    this.#status.textContent = '';
  }
}

define('punica-metadata-list-item', PunicaMetadataListItem);
