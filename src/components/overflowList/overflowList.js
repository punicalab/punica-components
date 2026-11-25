import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import '../popover/popover.js';
import styles from './overflowList.css';

/**
 * One row of children; those that do not fit move into a "more" popover.
 *
 * The children stay where they are in the document: only the slot they are
 * shown in changes, so their listeners and state are kept.
 *
 * @element punica-overflow-list
 *
 * @attr {string} label-more - Name of the button that opens the overflowing children, `More` by default.
 *
 * @slot - The children to lay out.
 *
 * @fires {{ count: number }} punica-overflow - The number of overflowing children changed. `detail.count` is the new number.
 *
 * @csspart base - The row.
 * @csspart items - The wrapper around the children that fit.
 * @csspart more - The "more" button.
 * @csspart menu - The column of overflowing children inside the popover.
 *
 * @cssprop --punica-overflow-list-gap - Space between the children.
 * @cssprop --punica-overflow-list-menu-gap - Space between the children in the popover.
 */
export class PunicaOverflowList extends PunicaElement {
  static properties = {
    labelMore: { default: 'More' }
  };

  static styles = styles;
  static shadowOptions = { slotAssignment: 'manual' };
  static template = `
    <div part="base" class="base">
      <div part="items" class="items"><slot id="visible"></slot></div>
      <punica-popover align="end" hidden>
        <button slot="trigger" part="more" class="more" type="button">${icons.more}</button>
        <div part="menu" class="menu"><slot id="overflow"></slot></div>
      </punica-popover>
    </div>
  `;

  #base = this.$('.base');
  #items = this.$('.items');
  #visible = this.$('#visible');
  #overflow = this.$('#overflow');
  #popover = this.$('punica-popover');
  #more = this.$('.more');
  #count = 0;
  /** @type {ResizeObserver | null} */
  #resize = null;
  /** @type {MutationObserver | null} */
  #mutation = null;

  constructor() {
    super();
    // Using an overflowing child closes the popover it sat in.
    this.#overflow.addEventListener('click', () => this.#popover.hide?.());
  }

  /** Number of children in the "more" popover. */
  get overflowCount() {
    return this.#count;
  }

  /** Measures again; call after a child changed size by itself. */
  layout() {
    if (!this.isConnected) return;
    const children = [...this.children];
    const visible = this.#visible;
    const overflow = this.#overflow;
    const popover = this.#popover;

    // Measure with everything in the row and no button.
    visible.assign(...children);
    overflow.assign();
    popover.hidden = true;
    const available = this.#base.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(this.#items).columnGap) || 0;
    const widths = children.map((child) => child.getBoundingClientRect().width);
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, children.length - 1);

    let fit = children.length;
    if (total > available + 0.5) {
      popover.hidden = false;
      const reserved = this.#more.getBoundingClientRect().width + gap;
      let used = 0;
      fit = 0;
      for (const width of widths) {
        const next = used + width + (fit ? gap : 0);
        if (next + reserved > available + 0.5) break;
        used = next;
        fit++;
      }
      visible.assign(...children.slice(0, fit));
      overflow.assign(...children.slice(fit));
    } else if (popover.open) {
      popover.open = false;
    }

    const count = children.length - fit;
    if (count !== this.#count) {
      this.#count = count;
      this.emit('overflow', { count });
    }
  }

  connected() {
    this.#resize = new ResizeObserver(() => this.layout());
    this.#resize.observe(this);
    this.#mutation = new MutationObserver(() => this.layout());
    this.#mutation.observe(this, { childList: true });
  }

  disconnected() {
    this.#resize?.disconnect();
    this.#resize = null;
    this.#mutation?.disconnect();
    this.#mutation = null;
  }

  update() {
    this.#more.setAttribute('aria-label', this.labelMore);
    this.#popover.setAttribute('label', this.labelMore);
    this.layout();
  }
}

define('punica-overflow-list', PunicaOverflowList);
