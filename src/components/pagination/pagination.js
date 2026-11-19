import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './pagination.css';

/**
 * Page navigation: previous, the page numbers around the current one, next.
 *
 * @element punica-pagination
 *
 * @attr {string} label - Accessible name of the navigation, `Pagination` by default.
 * @attr {number} page - The current page, counted from 1.
 * @attr {number} total-count - Number of records.
 * @attr {number} page-size - Records per page, 10 by default.
 * @attr {number} sibling-count - Pages shown on each side of the current one, 1 by default.
 * @attr {boolean} disabled - No button takes a click.
 * @attr {string} label-previous - Name of the previous button, `Previous page` by default.
 * @attr {string} label-next - Name of the next button, `Next page` by default.
 * @attr {string} label-page - Name of a page button; `{page}` is replaced by the number. `Page {page}` by default.
 *
 * @slot previous - Content of the previous button, a chevron by default.
 * @slot next - Content of the next button, a chevron by default.
 *
 * @fires punica-change - The user chose another page. `detail.page` (also `detail.value`) is its number.
 *
 * @csspart base - The `nav` element.
 * @csspart list - The list of buttons.
 * @csspart previous - The previous button.
 * @csspart next - The next button.
 * @csspart page - A page button.
 * @csspart current - The button of the current page, beside `page`.
 * @csspart ellipsis - A gap in the page numbers.
 *
 * @cssprop --punica-pagination-gap - Space between the buttons.
 * @cssprop --punica-pagination-size - Block size and smallest inline size of a button.
 * @cssprop --punica-pagination-radius - Corner radius of a button.
 * @cssprop --punica-pagination-current-background - Background of the current page.
 * @cssprop --punica-pagination-current-color - Text color of the current page.
 */
export class PunicaPagination extends PunicaElement {
  static properties = {
    label: { default: 'Pagination' },
    page: { type: Number, default: 1 },
    totalCount: { type: Number, default: 0 },
    pageSize: { type: Number, default: 10 },
    siblingCount: { type: Number, default: 1 },
    disabled: { type: Boolean },
    labelPrevious: { default: 'Previous page' },
    labelNext: { default: 'Next page' },
    labelPage: { default: 'Page {page}' }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <nav part="base">
      <ul part="list" class="list">
        <li><button part="previous" class="previous" type="button"><slot name="previous">${icons.chevronStart}</slot></button></li>
        <li class="next-item"><button part="next" class="next" type="button"><slot name="next">${icons.chevronEnd}</slot></button></li>
      </ul>
    </nav>
  `;

  #nav = this.$('nav');
  #list = this.$('.list');
  #previous = this.$('.previous');
  #next = this.$('.next');
  #nextItem = this.$('.next-item');

  constructor() {
    super();
    // One listener for every button, whatever is rendered later.
    this.#list.addEventListener('click', (event) => {
      const button = /** @type {Element} */ (event.target).closest('button');
      if (!button || button.disabled || this.disabled) return;
      if (button === this.#previous) this.#go(this.currentPage - 1);
      else if (button === this.#next) this.#go(this.currentPage + 1);
      else this.#go(Number(button.dataset.page));
    });
  }

  /** Number of pages. */
  get pageCount() {
    const size = this.pageSize > 0 ? this.pageSize : 10;
    return Math.max(0, Math.ceil((this.totalCount || 0) / size));
  }

  /** The current page, kept inside 1 and `pageCount`. */
  get currentPage() {
    return Math.min(Math.max(1, Math.round(this.page || 1)), Math.max(1, this.pageCount));
  }

  #go(page) {
    const next = Math.min(Math.max(1, page), Math.max(1, this.pageCount));
    if (next === this.currentPage) return;
    this.page = next;
    this.emit('change', { page: next, value: next });
  }

  update() {
    const count = this.pageCount;
    const page = this.currentPage;
    const format = new Intl.NumberFormat(this.closest('[lang]')?.lang || navigator.language);
    const active = this.shadowRoot.activeElement;

    this.#nav.setAttribute('aria-label', this.label);
    this.#previous.setAttribute('aria-label', this.labelPrevious);
    this.#next.setAttribute('aria-label', this.labelNext);
    this.#previous.disabled = this.disabled || page <= 1;
    this.#next.disabled = this.disabled || page >= count;

    for (const old of this.#list.querySelectorAll('.page-item')) old.remove();
    let current = null;
    for (const entry of pageList(page, count, Math.max(0, this.siblingCount ?? 1))) {
      const li = document.createElement('li');
      li.className = 'page-item';
      if (entry === 0) {
        li.setAttribute('part', 'ellipsis');
        li.setAttribute('aria-hidden', 'true');
        li.classList.add('ellipsis');
        li.textContent = '…';
      } else {
        const button = document.createElement('button');
        const text = format.format(entry);
        button.type = 'button';
        button.className = 'page';
        button.dataset.page = String(entry);
        button.textContent = text;
        button.setAttribute('aria-label', this.labelPage.replace('{page}', text));
        button.setAttribute('part', entry === page ? 'page current' : 'page');
        button.disabled = this.disabled;
        if (entry === page) {
          button.setAttribute('aria-current', 'page');
          current = button;
        }
        li.append(button);
      }
      this.#list.insertBefore(li, this.#nextItem);
    }
    // The buttons were rebuilt, or the focused arrow went disabled.
    if (active && (!active.isConnected || /** @type {any} */ (active).disabled)) current?.focus();
  }
}

/**
 * The page numbers to show; 0 stands for a gap.
 * @param {number} page
 * @param {number} count
 * @param {number} siblings
 * @returns {number[]}
 */
function pageList(page, count, siblings) {
  const range = (from, to) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  if (count <= siblings * 2 + 5) return range(1, count);
  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, count);
  const gapLeft = left > 2;
  const gapRight = right < count - 1;
  if (!gapLeft && gapRight) return [...range(1, 3 + siblings * 2), 0, count];
  if (gapLeft && !gapRight) return [1, 0, ...range(count - (2 + siblings * 2), count)];
  return [1, 0, ...range(left, right), 0, count];
}

define('punica-pagination', PunicaPagination);
