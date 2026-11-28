import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './chip.css';

/**
 * A compact label: a tag, a filter, a choice.
 *
 * A plain chip is text. A `selectable` chip is a toggle button. A `removable`
 * chip carries a second button that removes it.
 *
 * @element punica-chip
 *
 * @attr {boolean} mono - Draws the label in the fixed-width face: an id, a key, a version.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `primary` by default.
 * @attr {'filled' | 'soft' | 'outlined'} variant - Visual weight, `filled` by default; `soft` is a tint of the colour under its shade.
 * @attr {'small' | 'medium'} size - Height, `medium` by default.
 * @attr {boolean} removable - Shows a remove button.
 * @attr {string} label-remove - Accessible name of the remove button, before the chip's own text; `Remove` by default.
 * @attr {boolean} selectable - The chip is a toggle button.
 * @attr {boolean} selected - A selectable chip is on.
 * @attr {boolean} disabled - Takes no clicks and no focus.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon or an avatar.
 *
 * @fires {{ selected: boolean }} punica-change - The user toggled a selectable chip. `detail.selected` is the new state.
 * @fires punica-dismiss - The user pressed the remove button, or Delete or Backspace on the chip. Cancelable: unless prevented, the chip hides itself with `hidden`.
 *
 * @csspart base - The label area; a native button when selectable.
 * @csspart label - The wrapper around the default slot.
 * @csspart remove - The remove button.
 *
 * @cssprop --punica-chip-height - Block size.
 * @cssprop --punica-chip-padding - Inline padding.
 * @cssprop --punica-chip-radius - Corner radius.
 *
 * @cssstate selected - A selectable chip is on.
 */
export class PunicaChip extends PunicaElement {
  static properties = {
    color: {},
    variant: {},
    size: {},
    labelRemove: { default: 'Remove' },
    removable: { type: Boolean },
    selectable: { type: Boolean },
    selected: { type: Boolean },
    disabled: { type: Boolean },
    mono: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <span part="base" class="base"><span class="check">${icons.check}</span><slot name="start"></slot><span part="label" class="label"><slot></slot></span></span>
    <button part="remove" class="remove" type="button" hidden>${icons.close}</button>
  `;

  #base = this.$('.base');
  #remove = this.$('.remove');

  constructor() {
    super();
    const root = this.shadowRoot;
    root.addEventListener('click', (event) => {
      if (this.disabled) return;
      const path = event.composedPath();
      if (path.includes(this.#remove)) this.#dismiss();
      else if (this.selectable && path.includes(this.#base)) this.#toggle();
    });
    root.addEventListener('keydown', (event) => {
      if (this.disabled || !this.removable) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.#dismiss();
      }
    });
    this.$('slot:not([name])').addEventListener('slotchange', () => this.#nameRemove());
  }

  update() {
    const tag = this.selectable ? 'button' : 'span';
    if (this.#base.localName !== tag) {
      const next = document.createElement(tag);
      next.className = 'base';
      next.part.add('base');
      next.append(...this.#base.childNodes);
      this.#base.replaceWith(next);
      this.#base = next;
    }
    if (this.selectable) {
      const button = /** @type {HTMLButtonElement} */ (this.#base);
      button.type = 'button';
      button.disabled = this.disabled;
      button.setAttribute('aria-pressed', String(this.selected));
    }
    this.toggleState('selected', this.selectable && this.selected);
    this.#remove.hidden = !this.removable;
    this.#remove.disabled = this.disabled;
    this.#nameRemove();
  }

  /** Moves focus to the chip's first control, the toggle or the remove button. */
  focus(options) {
    const target = this.selectable ? this.#base : this.removable ? this.#remove : null;
    target?.focus(options);
  }

  #nameRemove() {
    const text = this.textContent.replace(/\s+/g, ' ').trim();
    this.#remove.setAttribute('aria-label', [this.labelRemove, text].filter(Boolean).join(' '));
  }

  #toggle() {
    this.selected = !this.selected;
    this.emit('change', { selected: this.selected });
  }

  #dismiss() {
    if (!this.emit('dismiss', {}, { cancelable: true }).defaultPrevented) this.hidden = true;
  }
}

define('punica-chip', PunicaChip);
