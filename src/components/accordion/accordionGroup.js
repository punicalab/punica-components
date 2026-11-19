import { PunicaElement, define } from '../../core/element.js';
import styles from './accordionGroup.css';

/**
 * A set of `punica-accordion` sections where opening one closes the others.
 *
 * It does so however a section opens: by a click, by `show()` or by writing
 * `open` from script. The section that opened last stays open.
 *
 * @element punica-accordion-group
 *
 * @attr {boolean} multiple - Several sections may be open at once.
 *
 * @slot - The `punica-accordion` sections.
 *
 * @cssprop --punica-accordion-group-gap - Space between the sections.
 * @cssprop --punica-accordion-group-divider - Line between the sections.
 */
export class PunicaAccordionGroup extends PunicaElement {
  static properties = {
    multiple: { type: Boolean }
  };

  static styles = styles;
  static template = `<slot></slot>`;

  /** @type {MutationObserver | null} */
  #observer = null;

  constructor() {
    super();
    this.addEventListener('punica-toggle', (event) => {
      const target = /** @type {any} */ (event.target);
      const detail = /** @type {CustomEvent} */ (event).detail;
      if (this.multiple || !detail?.open || target.parentElement !== this) return;
      this.#closeOthers(target);
    });
    this.$('slot').addEventListener('slotchange', () => this.requestUpdate());
  }

  /** The sections of this group, in order. */
  get items() {
    return [...this.children].filter((el) => el.localName === 'punica-accordion');
  }

  connected() {
    // A section opened from script fires no event; its `open` attribute
    // does change, and that is what closes the others.
    this.#observer = new MutationObserver((records) => {
      if (this.multiple) return;
      let opened = null;
      for (const record of records) {
        const target = /** @type {Element} */ (record.target);
        if (
          target.parentElement === this &&
          target.localName === 'punica-accordion' &&
          record.oldValue === null &&
          target.hasAttribute('open')
        ) {
          opened = target;
        }
      }
      if (opened) this.#closeOthers(opened);
    });
    this.#observer.observe(this, {
      attributes: true,
      attributeFilter: ['open'],
      attributeOldValue: true,
      subtree: true
    });
    this.requestUpdate();
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  #closeOthers(keep) {
    for (const item of this.items) {
      if (item !== keep) /** @type {any} */ (item).open = false;
    }
  }

  update() {
    if (this.multiple) return;
    // With one section allowed, the first open one stays.
    const open = this.items.filter((item) => item.hasAttribute('open'));
    if (open.length > 1) this.#closeOthers(open[0]);
  }
}

define('punica-accordion-group', PunicaAccordionGroup);
