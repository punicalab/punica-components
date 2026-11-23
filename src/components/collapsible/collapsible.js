import { PunicaElement, define, uid } from '../../core/element.js';
import styles from './collapsible.css';

/**
 * A disclosure: a trigger that shows and hides a region of content.
 *
 * The element in the `trigger` slot is a native `<button>` or a
 * `punica-button`; it is given `aria-expanded` and `aria-controls` and
 * toggles the region on click. A `punica-button` passes `aria-expanded` to
 * the native button inside it; `aria-controls` stays on its host, because an
 * id reference cannot cross into a shadow root.
 *
 * @element punica-collapsible
 *
 * @attr {boolean} open - The content is showing.
 * @attr {boolean} disabled - The trigger does not toggle the content.
 *
 * @slot - The content that is shown and hidden.
 * @slot trigger - The element that toggles the content: a `<button>` or a `punica-button`.
 *
 * @fires punica-toggle - The user expanded or collapsed the content. `detail.open` is the new state.
 *
 * @csspart content - The animated region around the default slot.
 *
 * @cssprop --punica-collapsible-duration - Duration of the height animation.
 *
 * @cssstate open - The content is showing.
 */
export class PunicaCollapsible extends PunicaElement {
  static properties = {
    open: { type: Boolean },
    disabled: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <slot name="trigger"></slot>
    <div part="content" class="content"><div class="clip"><slot></slot></div></div>
  `;

  #triggerSlot = this.$('slot[name="trigger"]');

  constructor() {
    super();
    this.#triggerSlot.addEventListener('click', (event) => {
      const trigger = this.#trigger;
      // A click something in the trigger cancelled (a copy button in a heading
      // row) leaves it as it is, as <summary> does.
      if (event.defaultPrevented) return;
      if (this.disabled || !trigger || trigger.hasAttribute('disabled')) return;
      this.open = !this.open;
      this.emit('toggle', { open: this.open });
    });
    this.#triggerSlot.addEventListener('slotchange', () => this.requestUpdate());
  }

  get #trigger() {
    return this.#triggerSlot.assignedElements({ flatten: true })[0] || null;
  }

  /** Expands the content. Fires nothing. */
  show() {
    this.open = true;
  }

  /** Collapses the content. Fires nothing. */
  hide() {
    this.open = false;
  }

  /** Expands when collapsed and collapses when expanded. Fires nothing. */
  toggle() {
    this.open = !this.open;
  }

  update() {
    this.toggleState('open', this.open);
    const trigger = this.#trigger;
    if (trigger) {
      // The region lives in this shadow root, out of reach of an id
      // reference from the light tree, so the trigger points at the host.
      if (!this.id) this.id = uid('punica-collapsible');
      trigger.setAttribute('aria-expanded', String(this.open));
      trigger.setAttribute('aria-controls', this.id);
    }
  }
}

define('punica-collapsible', PunicaCollapsible);
