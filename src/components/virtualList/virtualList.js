import { PunicaElement, define } from '../../core/element.js';
import styles from './virtualList.css';

/**
 * A list that renders only the rows in view, for arrays of any length.
 *
 * Every item has the same height (`item-height`). `renderItem(item, index)`
 * returns the node of one row; without it a row shows the item as text. The
 * rows live in the shadow root, so a row brings its own styles or is styled
 * through `::part(item)`.
 *
 * The scroller takes focus and scrolls with the keyboard. A row that holds
 * focus stays mounted while it is scrolled out of view, so focus survives a
 * scroll away and back.
 *
 * @element punica-virtual-list
 *
 * @attr {number} item-height - Height of every row in px, 48 by default.
 * @attr {number} overscan - Rows rendered beyond each edge of the view, 6 by default.
 * @attr {string} label - Accessible name of the list.
 *
 * @prop {unknown[]} items - The data, one entry per row.
 * @prop {(item: unknown, index: number) => Node | string} renderItem - Builds the content of one row; a string is shown as text.
 *
 * @fires {{ start: number, end: number }} punica-range-change - The rows in view changed, by scroll, resize or new data. `detail` is `{ start, end }`: the first index in view and the one after the last.
 * @fires {{ end: number }} punica-near-end - The view came within one screen of the last item, once per `items` value. `detail` is `{ end }`.
 *
 * @csspart viewport - The scrolling element, which has the `list` role.
 * @csspart item - The wrapper of one row.
 *
 * @cssprop --punica-virtual-list-max-height - Largest block size of the scroller when the host has no height of its own, one viewport by default.
 */
export class PunicaVirtualList extends PunicaElement {
  static properties = {
    items: { type: Array, attribute: false },
    renderItem: { type: Object, attribute: false },
    itemHeight: { type: Number, default: 48 },
    overscan: { type: Number, default: 6 },
    label: {}
  };

  static styles = styles;
  static template = `
    <div part="viewport" class="viewport" role="list" tabindex="0">
      <div class="content" role="none"></div>
    </div>
  `;

  #viewport = this.$('.viewport');
  #content = this.$('.content');
  /** Mounted rows. @type {Map<number, { el: HTMLElement, item: unknown, render: unknown }>} */
  #rows = new Map();
  /** @type {ResizeObserver | null} */
  #resize = null;
  #start = -1;
  #end = -1;
  #count = -1;
  #nearEnd = false;

  constructor() {
    super();
    this.#viewport.addEventListener('scroll', () => this.#render(), { passive: true });
  }

  connected() {
    this.#resize = new ResizeObserver(() => this.#render());
    this.#resize.observe(this.#viewport);
  }

  disconnected() {
    this.#resize?.disconnect();
    this.#resize = null;
  }

  update(changed) {
    if (this.label) this.#viewport.setAttribute('aria-label', this.label);
    else this.#viewport.removeAttribute('aria-label');
    if (changed.has('items')) this.#nearEnd = false;
    this.#render();
  }

  /**
   * Moves focus to the scroller, which scrolls with the keyboard.
   * @param {FocusOptions} [options]
   */
  focus(options) {
    this.#viewport.focus(options);
  }

  /** The first index in view and the one after the last, without overscan. */
  get range() {
    return { start: Math.max(0, this.#start), end: Math.max(0, this.#end) };
  }

  /**
   * Scrolls a row into view.
   * @param {number} index
   * @param {{ align?: 'start' | 'center' | 'end' | 'nearest' }} [options]
   *   Where the row lands in the view, `start` by default; `nearest` scrolls
   *   only as far as needed and not at all for a row already in view.
   */
  scrollToIndex(index, options = {}) {
    const count = this.#items.length;
    if (!count) return;
    const i = Math.max(0, Math.min(count - 1, Math.trunc(Number(index)) || 0));
    const h = this.#height;
    const view = this.#viewport.clientHeight;
    const top = i * h;
    const current = this.#viewport.scrollTop;
    let target = top;
    const align = options.align || 'start';
    if (align === 'center') target = top - (view - h) / 2;
    else if (align === 'end') target = top - (view - h);
    else if (align === 'nearest') {
      if (top < current) target = top;
      else if (top + h > current + view) target = top - (view - h);
      else target = current;
    }
    this.#viewport.scrollTop = Math.max(0, target);
    this.#render();
  }

  get #items() {
    return Array.isArray(this.items) ? this.items : [];
  }

  get #height() {
    return Math.max(1, this.itemHeight || 48);
  }

  #render() {
    const items = this.#items;
    const count = items.length;
    const h = this.#height;
    const overscan = Math.max(0, Math.trunc(this.overscan ?? 6));
    const viewport = this.#viewport;
    const content = this.#content;
    const total = `${count * h}px`;
    if (content.style.blockSize !== total) content.style.blockSize = total;

    const view = viewport.clientHeight;
    const top = Math.min(viewport.scrollTop, Math.max(0, count * h - view));
    const start = Math.min(count, Math.max(0, Math.floor(top / h)));
    const end = Math.min(count, Math.max(start, Math.ceil((top + view) / h)));
    const from = Math.max(0, start - overscan);
    const to = Math.min(count, end + overscan);

    const render = typeof this.renderItem === 'function' ? this.renderItem : null;
    const active = this.shadowRoot.activeElement;

    for (const [index, row] of this.#rows) {
      const stale = index >= count || row.item !== items[index] || row.render !== render;
      const outside = index < from || index >= to;
      // A row that holds focus stays, so focus survives scrolling away.
      const keep = !stale && outside && active && row.el.contains(active);
      if (stale || (outside && !keep)) {
        row.el.remove();
        this.#rows.delete(index);
      }
    }

    for (let index = from; index < to; index++) {
      if (this.#rows.has(index)) continue;
      const el = document.createElement('div');
      el.className = 'item';
      el.setAttribute('part', 'item');
      el.setAttribute('role', 'listitem');
      el.setAttribute('aria-posinset', String(index + 1));
      el.style.insetBlockStart = `${index * h}px`;
      const node = render ? render(items[index], index) : items[index];
      if (node instanceof Node) el.appendChild(node);
      else el.textContent = node == null ? '' : String(node);
      this.#rows.set(index, { el, item: items[index], render });
      content.insertBefore(el, this.#after(index));
    }

    for (const [index, row] of this.#rows) {
      const { el } = row;
      const offset = `${index * h}px`;
      if (el.style.insetBlockStart !== offset) el.style.insetBlockStart = offset;
      if (el.style.blockSize !== `${h}px`) el.style.blockSize = `${h}px`;
      if (count !== this.#count) el.setAttribute('aria-setsize', String(count));
      else if (!el.hasAttribute('aria-setsize')) el.setAttribute('aria-setsize', String(count));
    }
    this.#count = count;

    if (start !== this.#start || end !== this.#end) {
      this.#start = start;
      this.#end = end;
      this.emit('range-change', { start, end });
    }
    if (count && view && !this.#nearEnd && count - end <= Math.max(overscan, end - start)) {
      this.#nearEnd = true;
      this.emit('near-end', { end });
    }
  }

  /** The mounted row that follows `index` in document order, if any. */
  #after(index) {
    let best = Infinity;
    for (const i of this.#rows.keys()) if (i > index && i < best) best = i;
    return best === Infinity ? null : this.#rows.get(best).el;
  }
}

define('punica-virtual-list', PunicaVirtualList);
