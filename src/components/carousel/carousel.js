import { PunicaElement, define } from '../../core/element.js';
import { nextIndex, isRtl, prefersReducedMotion } from '../../core/a11y.js';
import { icons } from '../../core/icons.js';
import styles from './carousel.css';

/**
 * Slides shown one at a time on a scroll-snap track.
 *
 * The slides are `punica-carousel-item` children. The user moves with the
 * previous and next buttons, the dots, the arrow keys or by scrolling the
 * track. `autoplay` advances on a timer and stops while the pointer or focus
 * is inside, when the user presses pause, and does not start when the user
 * asked for reduced motion.
 *
 * @element punica-carousel
 *
 * @attr {number} index - The slide showing, from 0.
 * @attr {boolean} loop - Next after the last slide is the first, and the reverse.
 * @attr {boolean} autoplay - Advances by itself every `interval`.
 * @attr {number} interval - Milliseconds between automatic advances, 5000 by default.
 * @attr {string} label - Accessible name of the carousel.
 * @attr {string} label-previous - Name of the previous button, `Previous slide` by default.
 * @attr {string} label-next - Name of the next button, `Next slide` by default.
 * @attr {string} label-pause - Name of the button that stops autoplay, `Pause` by default.
 * @attr {string} label-play - Name of the button that resumes autoplay, `Play` by default.
 * @attr {string} label-slide - Pattern naming a slide and its dot; `{index}` and `{total}` are replaced. `{index} of {total}` by default.
 * @attr {string} label-dots - Name of the list of dots, `Slides` by default.
 * @attr {string} roledescription - How assistive technology calls the element, `carousel` by default.
 * @attr {string} slide-roledescription - How assistive technology calls a slide, `slide` by default.
 *
 * @slot - The `punica-carousel-item` slides.
 *
 * @fires punica-change - The user moved to another slide. `detail.index` (also `detail.value`).
 *
 * @csspart base - The wrapper.
 * @csspart track - The scrolling track.
 * @csspart controls - The row of buttons under the track.
 * @csspart previous - The previous button.
 * @csspart next - The next button.
 * @csspart pause - The pause and play button, shown with `autoplay`.
 * @csspart dots - The list of dots, a tab list.
 * @csspart dot - One dot.
 * @csspart dot-active - The dot of the slide showing, beside `dot`.
 *
 * @cssprop --punica-carousel-gap - Space between slides.
 * @cssprop --punica-carousel-slide-size - Inline size of a slide, 100% by default.
 * @cssprop --punica-carousel-dot-size - Diameter of a dot.
 * @cssprop --punica-carousel-dot-color - Color of a dot.
 * @cssprop --punica-carousel-dot-active-color - Color of the active dot.
 *
 * @cssstate playing - Autoplay is running.
 */
export class PunicaCarousel extends PunicaElement {
  static properties = {
    index: { type: Number, default: 0 },
    loop: { type: Boolean },
    autoplay: { type: Boolean },
    interval: { type: Number, default: 5000 },
    label: {},
    labelPrevious: { default: 'Previous slide' },
    labelNext: { default: 'Next slide' },
    labelPause: { default: 'Pause' },
    labelPlay: { default: 'Play' },
    labelSlide: { default: '{index} of {total}' },
    labelDots: { default: 'Slides' },
    roledescription: { default: 'carousel' },
    slideRoledescription: { default: 'slide' }
  };

  static styles = styles;
  static template = `
    <div part="base" class="base">
      <div part="track" class="track" tabindex="0"><slot></slot></div>
      <div part="controls" class="controls">
        <button part="pause" class="pause" type="button" hidden><span class="glyph"></span></button>
        <button part="previous" class="previous" type="button">${icons.chevronStart}</button>
        <div part="dots" class="dots" role="tablist"></div>
        <button part="next" class="next" type="button">${icons.chevronEnd}</button>
      </div>
    </div>
  `;

  #track = this.$('.track');
  #controls = this.$('.controls');
  #dots = this.$('.dots');
  #previous = this.$('.previous');
  #next = this.$('.next');
  #pause = this.$('.pause');
  #timer = 0;
  #settle = 0;
  #paused = false;
  #hover = false;
  #focus = false;
  #first = true;
  /** @type {ResizeObserver | null} */
  #resize = null;

  constructor() {
    super();
    this.internals.role = 'region';
    this.$('slot').addEventListener('slotchange', () => this.requestUpdate());
    this.#previous.addEventListener('click', () => this.#step(-1, true));
    this.#next.addEventListener('click', () => this.#step(1, true));
    this.#pause.addEventListener('click', () => {
      this.#paused = !this.#paused;
      this.requestUpdate();
    });
    this.#dots.addEventListener('click', (event) => {
      const dot = /** @type {HTMLElement} */ (event.target).closest('button');
      if (dot) this.#go(Number(dot.dataset.index), true);
    });
    this.$('.base').addEventListener('keydown', (event) => this.#onKeydown(event));
    // The user scrolled the track: the slide at its start is the index.
    // `scrollend` where the browser has it, a pause in `scroll` everywhere.
    const settled = () => {
      clearTimeout(this.#settle);
      if (!this.isConnected) return;
      const nearest = this.#nearest();
      if (nearest >= 0 && nearest !== this.currentIndex) this.#go(nearest, true);
    };
    this.#track.addEventListener('scrollend', settled);
    this.#track.addEventListener(
      'scroll',
      () => {
        clearTimeout(this.#settle);
        this.#settle = setTimeout(settled, 150);
      },
      { passive: true }
    );
    this.addEventListener('pointerenter', () => this.#hold('hover', true));
    this.addEventListener('pointerleave', () => this.#hold('hover', false));
    this.addEventListener('focusin', () => this.#hold('focus', true));
    this.addEventListener('focusout', () => this.#hold('focus', false));
  }

  /** The slides, in order. */
  get items() {
    return /** @type {any[]} */ ([...this.children].filter((el) => el.localName === 'punica-carousel-item'));
  }

  /** `index`, kept inside the slides there are. */
  get currentIndex() {
    const count = this.items.length;
    return count ? Math.min(count - 1, Math.max(0, Math.round(this.index ?? 0))) : -1;
  }

  /** Whether autoplay is running right now. */
  get playing() {
    return this.autoplay && this.isConnected && !this.#paused && !this.#hover && !this.#focus && this.items.length > 1;
  }

  /** Shows the following slide. Fires nothing. */
  next() {
    this.#step(1, false);
  }

  /** Shows the preceding slide. Fires nothing. */
  previous() {
    this.#step(-1, false);
  }

  /** Stops autoplay until `play()`. */
  pause() {
    this.#paused = true;
    this.requestUpdate();
  }

  /** Resumes autoplay. */
  play() {
    this.#paused = false;
    this.requestUpdate();
  }

  connected() {
    this.#first = true;
    // Someone who asked for less motion starts paused and may press play.
    this.#paused = prefersReducedMotion();
    this.#hover = false;
    this.#focus = false;
    // A track that changed size is put back on its slide; the first report
    // is only the size it already had.
    let size = -1;
    this.#resize = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (size >= 0 && next !== size) this.#scrollTo(this.currentIndex, false);
      size = next;
    });
    this.#resize.observe(this.#track);
    this.requestUpdate();
  }

  disconnected() {
    clearInterval(this.#timer);
    clearTimeout(this.#settle);
    this.#timer = 0;
    this.#resize?.disconnect();
    this.#resize = null;
  }

  /** @param {'hover' | 'focus'} what @param {boolean} on */
  #hold(what, on) {
    if (what === 'hover') this.#hover = on;
    else this.#focus = on;
    this.#syncTimer();
  }

  #step(by, user) {
    const count = this.items.length;
    if (!count) return;
    let next = this.currentIndex + by;
    if (this.loop) next = (next + count) % count;
    this.#go(next, user);
  }

  #go(index, user) {
    const count = this.items.length;
    const next = Math.min(count - 1, Math.max(0, index));
    if (!count || next === this.currentIndex) return;
    this.index = next;
    if (user) this.emit('change', { index: next, value: next });
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const inDots = this.#dots.contains(target);
    // Keys typed inside a slide's own content are not the carousel's.
    if (target !== this.#track && !this.#controls.contains(target)) return;
    const next = nextIndex(event, this.items.length, this.currentIndex, {
      orientation: 'horizontal',
      loop: this.loop,
      rtl: isRtl(this)
    });
    if (next < 0) return;
    event.preventDefault();
    this.#go(next, true);
    if (inDots) /** @type {HTMLElement} */ (this.#dots.children[next])?.focus();
  }

  /** Index of the slide closest to the start of the track. */
  #nearest() {
    const track = this.#track.getBoundingClientRect();
    const rtl = isRtl(this);
    let best = -1;
    let distance = Infinity;
    this.items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const d = Math.abs(rtl ? rect.right - track.right : rect.left - track.left);
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    return best;
  }

  #scrollTo(index, smooth) {
    const item = this.items[index];
    if (!item) return;
    const track = this.#track.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    const delta = isRtl(this) ? rect.right - track.right : rect.left - track.left;
    if (Math.abs(delta) < 1) return;
    this.#track.scrollBy({ left: delta, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant' });
  }

  #syncTimer() {
    clearInterval(this.#timer);
    this.#timer = 0;
    const playing = this.playing;
    this.toggleState('playing', playing);
    // A region that changes by itself is not announced while it does.
    this.#track.setAttribute('aria-live', playing ? 'off' : 'polite');
    if (!playing) return;
    this.#timer = setInterval(
      () => {
        const last = this.currentIndex >= this.items.length - 1;
        if (last && !this.loop) this.#go(0, false);
        else this.#step(1, false);
      },
      Math.max(50, this.interval ?? 5000)
    );
  }

  update() {
    const items = this.items;
    const count = items.length;
    const current = this.currentIndex;
    const lang = this.closest('[lang]')?.lang || navigator.language;
    const number = new Intl.NumberFormat(lang);
    const name = (i) =>
      this.labelSlide.replace('{index}', number.format(i + 1)).replace('{total}', number.format(count));

    this.internals.ariaLabel = this.label || null;
    this.internals.ariaRoleDescription = this.roledescription;

    items.forEach((item, i) => {
      item.active = i === current;
      item.positionLabel = name(i);
      item.roledescription = this.slideRoledescription;
    });

    // One dot per slide; the list is rebuilt only when their number changes.
    const dots = this.#dots;
    while (dots.children.length > count) dots.lastElementChild.remove();
    while (dots.children.length < count) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('role', 'tab');
      dot.dataset.index = String(dots.children.length);
      dots.append(dot);
    }
    [...dots.children].forEach((dot, i) => {
      const selected = i === current;
      dot.setAttribute('part', selected ? 'dot dot-active' : 'dot');
      dot.setAttribute('aria-selected', String(selected));
      dot.setAttribute('aria-label', name(i));
      /** @type {HTMLElement} */ (dot).tabIndex = selected ? 0 : -1;
    });
    dots.setAttribute('aria-label', this.labelDots);
    dots.hidden = count < 2;

    this.#previous.setAttribute('aria-label', this.labelPrevious);
    this.#next.setAttribute('aria-label', this.labelNext);
    const edge = (button, at) => {
      if (at) button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
    };
    edge(this.#previous, !this.loop && current <= 0);
    edge(this.#next, !this.loop && current >= count - 1);

    this.#pause.hidden = !this.autoplay;
    this.#pause.setAttribute('aria-label', this.#paused ? this.labelPlay : this.labelPause);
    this.#pause.classList.toggle('paused', this.#paused);

    this.#scrollTo(current, !this.#first);
    this.#first = false;
    this.#syncTimer();
  }
}

define('punica-carousel', PunicaCarousel);
