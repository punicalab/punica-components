import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import '../popover/popover.js';
import styles from './breadcrumbs.css';

/**
 * The path to the current page, as a list of links.
 *
 * With `max-items`, a longer path keeps its first item and its last ones and
 * folds the middle into a "more" button that opens them in a popover.
 *
 * @element punica-breadcrumbs
 *
 * @attr {string} label - Accessible name of the navigation, `Breadcrumb` by default.
 * @attr {number} max-items - Most items shown before the middle is collapsed; no limit when absent.
 * @attr {string} label-more - Name of the button that shows the collapsed items, `Show more` by default.
 *
 * @slot - The `punica-breadcrumb-item` elements.
 *
 * @csspart base - The `nav` element.
 * @csspart list - The ordered list.
 * @csspart more-item - The list item holding the "more" button.
 * @csspart more - The "more" button.
 * @csspart separator - The separator after the "more" button.
 * @csspart menu - The list of collapsed items inside the popover.
 *
 * @cssprop --punica-breadcrumbs-gap - Space between items and separators.
 */
export class PunicaBreadcrumbs extends PunicaElement {
  static properties = {
    label: { default: 'Breadcrumb' },
    maxItems: { type: Number },
    labelMore: { default: 'Show more' }
  };

  static styles = styles;
  static shadowOptions = { slotAssignment: 'manual' };
  static template = `
    <nav part="base">
      <ol part="list" class="list">
        <slot id="first"></slot>
        <li part="more-item" class="more-item" hidden>
          <punica-popover>
            <button slot="trigger" part="more" class="more" type="button">${icons.more}</button>
            <div part="menu" class="menu" role="list"><slot id="collapsed"></slot></div>
          </punica-popover>
          <span part="separator" class="separator" aria-hidden="true">${icons.chevronEnd}</span>
        </li>
        <slot id="rest"></slot>
      </ol>
    </nav>
  `;

  #nav = this.$('nav');
  #first = this.$('#first');
  #collapsed = this.$('#collapsed');
  #rest = this.$('#rest');
  #moreItem = this.$('.more-item');
  #more = this.$('.more');
  #popover = this.$('punica-popover');
  /** @type {MutationObserver | null} */
  #observer = null;

  constructor() {
    super();
    // Following a collapsed link closes the popover it sat in.
    this.#collapsed.addEventListener('click', () => this.#popover.hide?.());
  }

  /** The items, in order. */
  get items() {
    return [...this.children].filter((el) => el.localName === 'punica-breadcrumb-item');
  }

  connected() {
    this.#observer = new MutationObserver(() => this.requestUpdate());
    this.#observer.observe(this, { childList: true });
    this.requestUpdate();
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  update() {
    this.#nav.setAttribute('aria-label', this.label);
    this.#more.setAttribute('aria-label', this.labelMore);
    this.#popover.setAttribute('label', this.labelMore);

    const items = this.items;
    const max = this.maxItems;
    if (max >= 1 && items.length > max) {
      const head = max > 1 ? 1 : 0;
      const tail = Math.max(1, Math.floor(max) - head);
      this.#first.assign(...items.slice(0, head));
      this.#collapsed.assign(...items.slice(head, items.length - tail));
      this.#rest.assign(...items.slice(items.length - tail));
      this.#moreItem.hidden = false;
    } else {
      this.#first.assign();
      this.#collapsed.assign();
      this.#rest.assign(...items);
      this.#moreItem.hidden = true;
      if (this.#popover.open) this.#popover.open = false;
    }
  }
}

define('punica-breadcrumbs', PunicaBreadcrumbs);
