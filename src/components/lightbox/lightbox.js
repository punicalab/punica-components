import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { isRtl } from '../../core/a11y.js';
import { ModalSurface } from '../dialog/modalSurface.js';
import styles from './lightbox.css';

/**
 * A modal viewer for a set of images, one at a time.
 *
 * The images are the `items` property, or the `<img>` elements in the
 * default slot (directly, or inside a button or link). Slotted images stay
 * on the page as thumbnails and a click on one opens the viewer on it; wrap
 * each in a `<button>` so the keyboard reaches it. A slotted image may carry
 * `data-full` (the address of a larger file) and `data-caption`.
 *
 * It is a native `<dialog>` opened with `showModal()`. Arrow keys step
 * through the images (mirrored in right-to-left text), Home and End go to
 * the first and last, Escape closes.
 *
 * @element punica-lightbox
 *
 * @attr {string} label - Accessible name of the viewer.
 * @attr {boolean} open - The viewer is showing.
 * @attr {number} index - Position of the image on show, 0 by default.
 * @attr {boolean} no-light-dismiss - A click beside the image does not close it.
 * @attr {string} label-close - Accessible name of the close button, `Close` by default.
 * @attr {string} label-previous - Accessible name of the previous button, `Previous image` by default.
 * @attr {string} label-next - Accessible name of the next button, `Next image` by default.
 *
 * @prop {{ src: string, alt?: string, caption?: string }[] | null} items - The images; wins over slotted ones.
 * @prop {string} returnValue - The value given to `hide()` or `requestClose()` when it last closed (read-only).
 *
 * @slot - Thumbnails: `<img>` elements, or buttons and links holding one.
 *
 * @fires punica-open - The viewer opened.
 * @fires punica-change - The user moved to another image. `detail` is `{ index }`.
 * @fires punica-request-close - The user asked to close it. `detail` is `{ reason }`. Cancelable: preventing it keeps the viewer open.
 * @fires punica-close - The viewer closed. `detail` is `{ reason, returnValue }`; `reason` is `escape`, `backdrop`, `close-button` or `api`.
 *
 * @csspart dialog - The native dialog, covering the viewport.
 * @csspart figure - The image with its caption.
 * @csspart image - The image.
 * @csspart caption - The caption.
 * @csspart counter - The position, as in "2 / 5".
 * @csspart previous-button - The previous button.
 * @csspart next-button - The next button.
 * @csspart close-button - The close button.
 *
 * @cssprop --punica-lightbox-background - Colour laid over the page.
 * @cssprop --punica-lightbox-color - Colour of caption, counter and buttons.
 * @cssprop --punica-lightbox-control-background - Background of buttons and counter.
 * @cssprop --punica-lightbox-padding - Space around the image.
 * @cssprop --punica-lightbox-radius - Corner radius of the image.
 */
export class PunicaLightbox extends ModalSurface(PunicaElement) {
  static properties = {
    index: { type: Number, default: 0 },
    items: { type: Array, attribute: false },
    labelClose: { default: 'Close' },
    labelPrevious: { default: 'Previous image' },
    labelNext: { default: 'Next image' }
  };

  static styles = styles;
  static template = `
    <slot></slot>
    <dialog part="dialog">
      <figure part="figure" aria-live="polite" aria-atomic="true">
        <img part="image" alt="" hidden>
        <figcaption part="caption"></figcaption>
      </figure>
      <button part="previous-button" class="previous" type="button">${icons.chevronStart}</button>
      <button part="next-button" class="next" type="button">${icons.chevronEnd}</button>
      <span part="counter" class="counter"></span>
      <button part="close-button" class="close" type="button">${icons.close}</button>
    </dialog>
  `;

  #slot = this.$('slot');
  #image = this.$('img');
  #previous = this.$('.previous');
  #next = this.$('.next');

  constructor() {
    super();
    this.$('.close').addEventListener('click', () => this.requestClose('close-button'));
    this.#previous.addEventListener('click', () => this.previous());
    this.#next.addEventListener('click', () => this.next());
    this.dialogElement.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.#slot.addEventListener('slotchange', () => this.requestUpdate());
    this.#slot.addEventListener('click', (event) => {
      const path = event.composedPath();
      const at = this.#thumbnails.findIndex((img) => path.includes(img) || path.some((n) => n instanceof Element && n !== this && n.contains(img) && this.contains(n)));
      if (at < 0) return;
      this.index = at;
      this.show();
    });
  }

  /** @returns {HTMLImageElement[]} */
  get #thumbnails() {
    return this.#slot
      .assignedElements({ flatten: true })
      .flatMap((el) => (el instanceof HTMLImageElement ? [el] : [...el.querySelectorAll('img')]));
  }

  /** @returns {{ src: string, alt: string, caption: string }[]} */
  get #list() {
    const items = /** @type {any} */ (this.items);
    if (Array.isArray(items) && items.length) {
      return items.map((item) => ({ src: String(item.src ?? ''), alt: String(item.alt ?? ''), caption: String(item.caption ?? '') }));
    }
    return this.#thumbnails.map((img) => ({
      src: img.dataset.full || img.currentSrc || img.src,
      alt: img.alt,
      caption: img.dataset.caption ?? ''
    }));
  }

  /** Number of images. */
  get length() {
    return this.#list.length;
  }

  /** Shows the previous image, as its button does. */
  previous() {
    this.#go(this.#current(this.length) - 1);
  }

  /** Shows the next image, as its button does. */
  next() {
    this.#go(this.#current(this.length) + 1);
  }

  /** Every blank part of the dialog counts as its backdrop. */
  isBackdropHit() {
    return true;
  }

  update(changed) {
    super.update(changed);
    const list = this.#list;
    const at = this.#current(list.length);
    const item = list[at];
    const image = this.#image;
    image.hidden = !item;
    if (item) {
      if (image.getAttribute('src') !== item.src) image.setAttribute('src', item.src);
      image.alt = item.alt;
    } else {
      image.removeAttribute('src');
    }
    this.$('figcaption').textContent = item?.caption ?? '';
    const lang = /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || navigator.language;
    const number = new Intl.NumberFormat(lang);
    const counter = this.$('.counter');
    counter.hidden = list.length < 2;
    counter.textContent = list.length ? `${number.format(at + 1)} / ${number.format(list.length)}` : '';
    this.$('.close').setAttribute('aria-label', this.labelClose);
    this.#previous.setAttribute('aria-label', this.labelPrevious);
    this.#next.setAttribute('aria-label', this.labelNext);
    this.#previous.hidden = this.#next.hidden = list.length < 2;
    this.#previous.setAttribute('aria-disabled', String(at <= 0));
    this.#next.setAttribute('aria-disabled', String(at >= list.length - 1));
  }

  /** @param {number} length */
  #current(length) {
    return Math.max(0, Math.min(length - 1, Math.round(this.index ?? 0)));
  }

  /** @param {number} to */
  #go(to) {
    const length = this.length;
    const next = Math.max(0, Math.min(length - 1, to));
    if (!length || next === this.#current(length)) return;
    this.index = next;
    this.emit('change', { index: next });
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    const forward = isRtl(this.dialogElement) ? 'ArrowLeft' : 'ArrowRight';
    const back = forward === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === forward) this.next();
    else if (event.key === back) this.previous();
    else if (event.key === 'Home') this.#go(0);
    else if (event.key === 'End') this.#go(this.length - 1);
    else return;
    event.preventDefault();
  }
}

define('punica-lightbox', PunicaLightbox);
