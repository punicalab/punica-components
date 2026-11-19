import { PunicaElement, define } from '../../core/element.js';
import styles from './listItem.css';

/**
 * One row of a `punica-list`.
 *
 * A plain row is text with leading and trailing content. With `interactive`
 * the row holds a native button, or a link when `href` is set.
 *
 * @element punica-list-item
 *
 * @attr {boolean} interactive - The row can be activated: it renders a button, or a link with `href`.
 * @attr {string} href - Address the interactive row links to.
 * @attr {string} target - Where the link opens.
 * @attr {string} rel - Relationship of the link.
 * @attr {boolean} selected - The row is the current one of its list.
 * @attr {boolean} disabled - An interactive row that takes no clicks and no focus.
 * @attr {string} value - Carried in `punica-select`.
 *
 * @slot - The row's content.
 * @slot start - Leading content, an icon or avatar.
 * @slot end - Trailing content, outside the button or link.
 *
 * @fires punica-select - The user activated an interactive row. `detail` is `{ value, item }`.
 *
 * @csspart row - The whole row.
 * @csspart base - The row's main area: a `div`, or the native `button` or `a` when interactive.
 * @csspart content - The wrapper around the default slot.
 *
 * @cssprop --punica-list-item-padding - Padding of the row.
 * @cssprop --punica-list-item-min-height - Smallest block size of the row.
 * @cssprop --punica-list-item-gap - Space between the slots.
 * @cssprop --punica-list-item-hover-background - Background of an interactive row under the pointer.
 * @cssprop --punica-list-item-selected-background - Background of the selected row.
 *
 * @cssstate selected - The row is the current one.
 */
export class PunicaListItem extends PunicaElement {
  static properties = {
    interactive: { type: Boolean },
    href: {},
    target: {},
    rel: {},
    selected: { type: Boolean },
    disabled: { type: Boolean },
    value: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div part="row" class="row">
      <div part="base" class="base">
        <slot name="start"></slot>
        <span part="content" class="content"><slot></slot></span>
      </div>
      <slot name="end"></slot>
    </div>
  `;

  #base = this.$('.base');

  constructor() {
    super();
    this.internals.role = 'listitem';
    this.shadowRoot.addEventListener('click', (event) => {
      const target = /** @type {Element} */ (event.target);
      if (!this.interactive || !target.closest('.base')) return;
      if (this.disabled) {
        event.preventDefault();
        return;
      }
      this.emit('select', { value: this.value, item: this });
    });
  }

  /** Moves focus to the button or link of an interactive row. */
  focus(options) {
    this.#base.focus(options);
  }

  update() {
    const tag = !this.interactive ? 'div' : this.href != null ? 'a' : 'button';
    if (this.#base.localName !== tag) {
      // The main area is the native element for the job.
      const next = document.createElement(tag);
      next.setAttribute('part', 'base');
      next.className = 'base';
      next.append(...this.#base.childNodes);
      this.#base.replaceWith(next);
      this.#base = next;
    }
    const base = /** @type {any} */ (this.#base);
    if (tag === 'button') {
      base.type = 'button';
      base.disabled = this.disabled;
    } else if (tag === 'a') {
      if (this.disabled) {
        base.removeAttribute('href');
        base.setAttribute('aria-disabled', 'true');
      } else {
        base.setAttribute('href', this.href);
        base.removeAttribute('aria-disabled');
      }
      for (const name of ['target', 'rel']) {
        if (this[name]) base.setAttribute(name, this[name]);
        else base.removeAttribute(name);
      }
    }
    if (this.selected && tag !== 'div') base.setAttribute('aria-current', 'true');
    else base.removeAttribute('aria-current');
    this.toggleState('selected', this.selected);
  }
}

define('punica-list-item', PunicaListItem);
