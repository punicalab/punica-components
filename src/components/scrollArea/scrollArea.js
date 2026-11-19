import { PunicaElement, define } from '../../core/element.js';
import { firstFocusable } from '../../core/a11y.js';
import styles from './scrollArea.css';

/**
 * A box that scrolls its content, with thin scrollbars and a shadow at each
 * edge where there is more to see.
 *
 * The box needs a size to scroll within: give the element a `block-size` or
 * a `max-block-size` (an `inline-size` for horizontal scrolling). When it
 * overflows and holds nothing focusable, the scrolling box itself joins the
 * tab order so the keyboard can scroll it.
 *
 * @element punica-scroll-area
 *
 * @attr {'vertical' | 'horizontal' | 'both'} orientation - The axes that scroll, `vertical` by default.
 * @attr {string} label - Accessible name; the scrolling box is then a `region`.
 *
 * @slot - The content.
 *
 * @csspart viewport - The scrolling box.
 * @csspart shadow-start - The shadow at the edge content scrolled past.
 * @csspart shadow-end - The shadow at the edge content is still behind.
 *
 * @cssprop --punica-scroll-area-shadow-size - Depth of the edge shadows.
 * @cssprop --punica-scroll-area-shadow-color - Colour of the edge shadows.
 * @cssprop --punica-scroll-area-thumb-color - Colour of the scrollbar thumb.
 *
 * @cssstate scrollable - The content overflows.
 * @cssstate scroll-start - There is content before the visible part.
 * @cssstate scroll-end - There is content after the visible part.
 */
export class PunicaScrollArea extends PunicaElement {
  static properties = {
    orientation: {},
    label: {}
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <div class="frame">
      <div part="viewport" class="viewport"><div class="content"><slot></slot></div></div>
      <div part="shadow-start" class="shadow start"></div>
      <div part="shadow-end" class="shadow end"></div>
    </div>
  `;

  #viewport = this.$('.viewport');
  #content = this.$('.content');
  /** @type {ResizeObserver | null} */
  #observer = null;

  constructor() {
    super();
    this.#viewport.addEventListener('scroll', () => this.#measure(), { passive: true });
    this.$('slot').addEventListener('slotchange', () => this.#measure());
  }

  connected() {
    this.#observer = new ResizeObserver(() => this.#measure());
    this.#observer.observe(this.#viewport);
    this.#observer.observe(this.#content);
  }

  disconnected() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  update() {
    const viewport = this.#viewport;
    if (this.label) {
      viewport.setAttribute('role', 'region');
      viewport.setAttribute('aria-label', this.label);
    } else {
      viewport.removeAttribute('role');
      viewport.removeAttribute('aria-label');
    }
    this.#measure();
  }

  /** The scrolling box, for `scrollTo()` and scroll listeners. */
  get viewport() {
    return this.#viewport;
  }

  #measure() {
    const viewport = this.#viewport;
    const horizontal = this.orientation === 'horizontal';
    const both = this.orientation === 'both';
    const room = horizontal ? viewport.scrollWidth - viewport.clientWidth : viewport.scrollHeight - viewport.clientHeight;
    const position = Math.abs(horizontal ? viewport.scrollLeft : viewport.scrollTop);
    const scrollable = room > 1 || (both && viewport.scrollWidth - viewport.clientWidth > 1);

    this.toggleState('scrollable', scrollable);
    this.toggleState('scroll-start', room > 1 && position > 1);
    this.toggleState('scroll-end', room > 1 && position < room - 1);

    // A scrolling box with nothing focusable inside cannot be scrolled by keyboard.
    if (scrollable && !firstFocusable(this.#content)) viewport.setAttribute('tabindex', '0');
    else viewport.removeAttribute('tabindex');
  }
}

define('punica-scroll-area', PunicaScrollArea);
