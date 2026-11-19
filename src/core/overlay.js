/**
 * Overlay: places a popover panel next to an anchor.
 *
 * The panel is an element carrying the `popover` attribute, so it opens in
 * the top layer: no z-index, no portal to <body>, light dismiss and Escape
 * from the platform. Position comes from CSS anchor positioning where the
 * browser has it and the two elements share a tree; everywhere else it is
 * measured, and kept right while the page scrolls or resizes.
 *
 * Placement is logical: `block-end` is below in horizontal writing, and
 * `start` / `end` alignments follow the writing direction.
 */

/**
 * @typedef {'block-end' | 'block-start' | 'inline-end' | 'inline-start'} Side
 * @typedef {'start' | 'center' | 'end'} Align
 * @typedef {object} OverlayOptions
 * @property {Side} [side] default `block-end`
 * @property {Align} [align] default `start`
 * @property {number} [offset] gap between anchor and panel in px, default 4
 * @property {boolean} [matchWidth] panel is at least as wide as the anchor
 * @property {{ x: number, y: number }} [point] open at a point (context
 *   menus) instead of beside the anchor
 */

const supportsAnchor = () =>
  typeof CSS !== 'undefined' &&
  CSS.supports('anchor-name: --a') &&
  CSS.supports('position-area: block-end');

const supportsPopover = () =>
  typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

let anchorCounter = 0;

/**
 * The physical position-area for a logical side and alignment, resolved in
 * the anchor's own direction. Logical position-area keywords follow the
 * containing block, which is the document, so a right-to-left element on a
 * left-to-right page would get the wrong edge from them.
 * @param {Side} side
 * @param {Align} align
 * @param {boolean} rtl
 */
function physicalArea(side, align, rtl) {
  const startEdge = rtl ? 'right' : 'left';
  const endEdge = rtl ? 'left' : 'right';
  if (side === 'block-end' || side === 'block-start') {
    const edge = side === 'block-end' ? 'bottom' : 'top';
    if (align === 'center') return edge;
    // Aligned to the start edge, the panel spans toward the end, and back.
    return `${edge} span-${align === 'start' ? endEdge : startEdge}`;
  }
  const edge = side === 'inline-end' ? endEdge : startEdge;
  if (align === 'center') return edge;
  return `${edge} span-${align === 'start' ? 'bottom' : 'top'}`;
}

export class Overlay {
  /** @type {HTMLElement} */
  #panel;
  /** @type {Element | null} */
  #anchor = null;
  /** @type {OverlayOptions} */
  #options = {};
  /** @type {AbortController | null} */
  #abort = null;
  #frame = 0;
  #css = false;

  /**
   * @param {HTMLElement} panel an element with a `popover` attribute
   */
  constructor(panel) {
    this.#panel = panel;
  }

  get open() {
    try {
      return this.#panel.matches(':popover-open');
    } catch {
      return this.#panel.hasAttribute('data-open');
    }
  }

  /**
   * @param {Element | null} anchor
   * @param {OverlayOptions} [options]
   */
  show(anchor, options = {}) {
    this.#anchor = anchor;
    this.#options = options;
    const panel = this.#panel;
    if (!this.open) {
      if (supportsPopover()) panel.showPopover();
      else panel.setAttribute('data-open', '');
    }
    panel.style.margin = '0';
    this.#css =
      !options.point &&
      !!anchor &&
      supportsAnchor() &&
      anchor.getRootNode() === panel.getRootNode() &&
      anchor instanceof HTMLElement;
    if (this.#css) this.#placeWithCss();
    else this.#track();
  }

  hide() {
    this.#abort?.abort();
    this.#abort = null;
    cancelAnimationFrame(this.#frame);
    const panel = this.#panel;
    if (this.open) {
      if (supportsPopover()) panel.hidePopover();
      else panel.removeAttribute('data-open');
    }
    if (this.#css && this.#anchor instanceof HTMLElement) {
      this.#anchor.style.removeProperty('anchor-name');
    }
  }

  /** Re-measure; call after the panel's content changed size. */
  reposition() {
    if (this.open && !this.#css) this.#measure();
  }

  #placeWithCss() {
    const { side = 'block-end', align = 'start', offset = 4, matchWidth } = this.#options;
    const anchor = /** @type {HTMLElement} */ (this.#anchor);
    const name = `--punica-anchor-${++anchorCounter}`;
    anchor.style.setProperty('anchor-name', name);
    const s = this.#panel.style;
    s.position = 'fixed';
    s.inset = 'auto';
    s.setProperty('position-anchor', name);
    const rtl = getComputedStyle(anchor).direction === 'rtl';
    s.setProperty('position-area', physicalArea(side, align, rtl));
    s.setProperty('position-try-fallbacks', 'flip-block, flip-inline, flip-block flip-inline');
    s.margin = side.startsWith('block') ? `${offset}px 0` : `0 ${offset}px`;
    s.minInlineSize = matchWidth ? 'anchor-size(inline)' : '';
  }

  #track() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    const signal = this.#abort.signal;
    const schedule = () => {
      cancelAnimationFrame(this.#frame);
      this.#frame = requestAnimationFrame(() => this.#measure());
    };
    addEventListener('scroll', schedule, { capture: true, passive: true, signal });
    addEventListener('resize', schedule, { passive: true, signal });
    this.#measure();
  }

  #measure() {
    const panel = this.#panel;
    const { side = 'block-end', align = 'start', offset = 4, matchWidth, point } = this.#options;
    const s = panel.style;
    s.position = 'fixed';
    s.inset = 'auto';
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const a = point
      ? { left: point.x, right: point.x, top: point.y, bottom: point.y, width: 0, height: 0 }
      : this.#anchor?.getBoundingClientRect();
    if (!a) return;
    if (matchWidth) s.minWidth = `${a.width}px`;
    const p = panel.getBoundingClientRect();
    const rtl = getComputedStyle(panel).direction === 'rtl';
    const pad = 4;

    // Resolve the logical side to a physical one, flipping when it would
    // not fit and the opposite side has more room.
    let physical =
      side === 'block-end' ? 'bottom'
      : side === 'block-start' ? 'top'
      : (side === 'inline-end') !== rtl ? 'right' : 'left';
    const room = {
      bottom: vh - a.bottom,
      top: a.top,
      right: vw - a.right,
      left: a.left
    };
    const need = physical === 'top' || physical === 'bottom' ? p.height : p.width;
    const opposite = { bottom: 'top', top: 'bottom', left: 'right', right: 'left' }[physical];
    if (room[physical] < need + offset && room[opposite] > room[physical]) {
      physical = opposite;
    }
    // Beside the anchor in neither direction: below it, or above.
    if ((physical === 'left' || physical === 'right') && room[physical] < p.width + offset) {
      physical = room.bottom >= p.height + offset || room.bottom >= room.top ? 'bottom' : 'top';
    }

    let x;
    let y;
    const startIsLeft = !rtl;
    if (physical === 'bottom' || physical === 'top') {
      y = physical === 'bottom' ? a.bottom + offset : a.top - p.height - offset;
      if (align === 'center') x = a.left + a.width / 2 - p.width / 2;
      else if ((align === 'start') === startIsLeft) x = a.left;
      else x = a.right - p.width;
    } else {
      x = physical === 'right' ? a.right + offset : a.left - p.width - offset;
      if (align === 'center') y = a.top + a.height / 2 - p.height / 2;
      else if (align === 'start') y = a.top;
      else y = a.bottom - p.height;
    }
    // The cross axis is kept on screen. The main axis follows the anchor:
    // once the anchor has scrolled out of view the panel goes with it
    // instead of sticking to the viewport's edge.
    const anchorVisible = a.bottom > 0 && a.top < vh && a.right > 0 && a.left < vw;
    const clampX = (v) => Math.max(pad, Math.min(v, vw - p.width - pad));
    const clampY = (v) => Math.max(pad, Math.min(v, vh - p.height - pad));
    if (physical === 'bottom' || physical === 'top') {
      x = clampX(x);
      if (anchorVisible) y = clampY(y);
    } else {
      y = clampY(y);
      if (anchorVisible) x = clampX(x);
    }
    s.left = `${Math.round(x)}px`;
    s.top = `${Math.round(y)}px`;
    s.maxHeight = `${vh - pad * 2}px`;
    panel.dataset.side = physical;
  }
}

/**
 * CSS every overlay panel needs: the UA popover defaults removed and a
 * fallback for browsers with no Popover API.
 */
export const overlayCss = `
[popover] {
  position: fixed;
  inset: auto;
  margin: 0;
  border: 0;
  padding: 0;
  overflow: visible;
  background: none;
  color: inherit;
}
@supports not selector(:popover-open) {
  [popover]:not([data-open]) { display: none; }
  [popover][data-open] { display: block; z-index: 2147483647; }
}
`;
