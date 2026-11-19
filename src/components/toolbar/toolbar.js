import { PunicaElement, define } from '../../core/element.js';
import { nextIndex, setRovingTabindex, isRtl } from '../../core/a11y.js';
import styles from './toolbar.css';

const CONTROL = 'a[href],button,input:not([type="hidden"]),select,textarea,[tabindex],[contenteditable="true"]';
/** Controls that use the arrow keys themselves. */
const TEXT_ENTRY =
  'input:not([type="button"],[type="checkbox"],[type="radio"],[type="submit"],[type="reset"],[type="image"],[type="file"],[type="color"]),textarea,select,[contenteditable="true"]';

/**
 * A row of controls that is one stop in the tab order: Tab enters and leaves
 * it, the arrow keys, Home and End move inside it.
 *
 * @element punica-toolbar
 *
 * @attr {string} label - Accessible name of the toolbar.
 * @attr {'horizontal' | 'vertical'} orientation - Direction of the row and of the arrow keys, `horizontal` by default.
 * @attr {'small' | 'medium' | 'large'} size - Minimum thickness: 48, 64 or 80 px; `medium` by default.
 *
 * @slot - The controls.
 * @slot start - Controls at the leading edge.
 * @slot end - Controls at the trailing edge.
 *
 * @csspart content - The wrapper around the default slot.
 *
 * @cssprop --punica-toolbar-size - Minimum thickness.
 * @cssprop --punica-toolbar-padding - Padding along the row.
 * @cssprop --punica-toolbar-gap - Space between controls.
 */
export class PunicaToolbar extends PunicaElement {
  static properties = {
    label: {},
    orientation: {},
    size: {}
  };

  static styles = styles;
  static template = `<slot name="start"></slot><div part="content" class="content"><slot></slot></div><slot name="end"></slot>`;

  /** @type {HTMLElement | null} */
  #active = null;

  constructor() {
    super();
    this.shadowRoot.addEventListener('slotchange', () => this.#rove());
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('focusin', (event) => {
      const items = this.#items();
      const item = items.find((i) => i === event.target || i.contains(/** @type {Node} */ (event.target)));
      if (item) {
        this.#active = item;
        setRovingTabindex(items, item);
      }
    });
  }

  update() {
    const internals = this.internals;
    internals.role = 'toolbar';
    internals.ariaLabel = this.label;
    internals.ariaOrientation = this.orientation === 'vertical' ? 'vertical' : 'horizontal';
    this.#rove();
  }

  /** The enabled controls of the toolbar, in visual order. */
  #items() {
    /** @type {HTMLElement[]} */
    const items = [];
    const visit = (el) => {
      if (!(el instanceof HTMLElement) || el.hidden || el.hasAttribute('disabled') || el.inert) return;
      if (el.matches(CONTROL) || el.shadowRoot?.delegatesFocus) items.push(el);
      else for (const child of el.children) visit(child);
    };
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      for (const el of slot.assignedElements({ flatten: true })) visit(el);
    }
    return items;
  }

  #rove() {
    const items = this.#items();
    if (!items.includes(this.#active)) this.#active = null;
    setRovingTabindex(items, this.#active);
  }

  #onKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const origin = event.composedPath()[0];
    if (origin instanceof Element && origin.matches(TEXT_ENTRY)) return;
    const items = this.#items();
    const current = items.findIndex((i) => i === event.target || i.contains(/** @type {Node} */ (event.target)));
    if (current < 0) return;
    const next = nextIndex(event, items.length, current, {
      orientation: this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      rtl: isRtl(this)
    });
    if (next < 0) return;
    event.preventDefault();
    this.#active = items[next];
    setRovingTabindex(items, items[next]);
    items[next].focus();
  }
}

define('punica-toolbar', PunicaToolbar);
