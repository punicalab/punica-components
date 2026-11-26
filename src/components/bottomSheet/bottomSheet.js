import { PunicaElement, define } from '../../core/element.js';
import { ModalSurface } from '../dialog/modalSurface.js';
import styles from './bottomSheet.css';

/**
 * A modal sheet that rises from the bottom edge and rests at one of several
 * heights.
 *
 * It is a native `<dialog>` opened with `showModal()`. `snap-points` lists
 * the heights as fractions of the viewport and `snap` is the index of the
 * current one. The handle at the top is dragged to another height, or below
 * the lowest one to close the sheet; with the keyboard it is a slider:
 * ArrowUp and ArrowDown move between heights, Home and End go to the lowest
 * and highest, ArrowDown on the lowest closes. Escape closes.
 *
 * @element punica-bottom-sheet
 *
 * @attr {string} label - Accessible name; the header's text by default.
 * @attr {boolean} open - The sheet is showing.
 * @attr {string} snap-points - Heights as fractions of the viewport, lowest first, `0.5 0.9` by default.
 * @attr {number} snap - Index into `snap-points` of the current height, 0 by default.
 * @attr {boolean} no-light-dismiss - A click on the backdrop does not close it.
 * @attr {string} label-handle - Accessible name of the handle, `Sheet height` by default.
 *
 * @prop {string} returnValue - The value given to `hide()` or `requestClose()` when it last closed (read-only).
 *
 * @slot - The body.
 * @slot header - The title.
 * @slot footer - Actions at the end of the sheet.
 *
 * @fires punica-open - The sheet opened.
 * @fires {{ value: string }} punica-change - The user moved the sheet to another height. `detail` is `{ value }`, the new `snap`.
 * @fires {{ reason: 'escape' | 'backdrop' | 'drag' | 'handle' | 'api' | (string & {}) }} punica-request-close - The user asked to close it. `detail` is `{ reason }`. Cancelable: preventing it keeps the sheet open.
 * @fires {{ reason: 'escape' | 'backdrop' | 'drag' | 'handle' | 'api' | (string & {}), returnValue: string }} punica-close - The sheet closed. `detail` is `{ reason, returnValue }`; `reason` is `escape`, `backdrop`, `drag`, `handle` or `api`.
 *
 * @csspart dialog - The native dialog, the sheet.
 * @csspart handle - The drag handle.
 * @csspart header - The header row.
 * @csspart body - The scrolling body.
 * @csspart footer - The footer row.
 *
 * @cssprop --punica-bottom-sheet-radius - Radius of the top corners.
 * @cssprop --punica-bottom-sheet-padding - Padding of header, body and footer.
 * @cssprop --punica-bottom-sheet-background - Background.
 * @cssprop --punica-bottom-sheet-backdrop - Colour of the backdrop.
 * @cssprop --punica-bottom-sheet-shadow - Shadow.
 * @cssprop --punica-bottom-sheet-max-width - Largest inline size.
 */
export class PunicaBottomSheet extends ModalSurface(PunicaElement) {
  static properties = {
    snapPoints: { default: '0.5 0.9' },
    snap: { type: Number, default: 0 },
    labelHandle: { default: 'Sheet height' }
  };

  static styles = styles;
  static template = `
    <dialog part="dialog">
      <div part="handle" class="handle" role="slider" tabindex="0" aria-orientation="vertical"><span class="grip"></span></div>
      <div part="header" hidden><slot name="header"></slot></div>
      <div part="body"><slot></slot></div>
      <div part="footer" hidden><slot name="footer"></slot></div>
    </dialog>
  `;

  #handle = this.$('.handle');
  #headerSlot = this.$('slot[name="header"]');
  #footerSlot = this.$('slot[name="footer"]');
  /** @type {{ y: number, height: number, current: number } | null} */
  #drag = null;

  constructor() {
    super();
    const handle = this.#handle;
    this.#headerSlot.addEventListener('slotchange', () => this.requestUpdate());
    this.#footerSlot.addEventListener('slotchange', () => this.requestUpdate());
    handle.addEventListener('keydown', (event) => this.#onKeydown(event));
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      try {
        handle.setPointerCapture(event.pointerId);
      } catch {
        // A pointer the browser does not know cannot be captured.
      }
      const height = this.dialogElement.getBoundingClientRect().height;
      this.#drag = { y: event.clientY, height, current: height };
      this.dialogElement.classList.add('dragging');
    });
    handle.addEventListener('pointermove', (event) => {
      const drag = this.#drag;
      if (!drag) return;
      drag.current = Math.max(0, Math.min(innerHeight, drag.height - (event.clientY - drag.y)));
      this.dialogElement.style.setProperty('--_height', `${drag.current}px`);
    });
    handle.addEventListener('pointerup', () => this.#endDrag(true));
    handle.addEventListener('pointercancel', () => this.#endDrag(false));
  }

  get labelSources() {
    return this.#headerSlot.assignedElements({ flatten: true });
  }

  /** The heights, as fractions of the viewport, lowest first. @returns {number[]} */
  get points() {
    const points = String(this.snapPoints ?? '')
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => n > 0 && n <= 1)
      .sort((a, b) => a - b);
    return points.length ? points : [0.5, 0.9];
  }

  disconnected() {
    super.disconnected();
    this.#drag = null;
    this.dialogElement.classList.remove('dragging');
  }

  update(changed) {
    super.update(changed);
    const points = this.points;
    const index = this.#index(points);
    const point = points[index];
    const handle = this.#handle;
    if (!this.#drag) this.dialogElement.style.setProperty('--_height', `${point * 100}dvh`);
    const lang = /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || navigator.language;
    handle.setAttribute('aria-label', this.labelHandle);
    handle.setAttribute('aria-valuemin', String(Math.round(points[0] * 100)));
    handle.setAttribute('aria-valuemax', String(Math.round(points[points.length - 1] * 100)));
    handle.setAttribute('aria-valuenow', String(Math.round(point * 100)));
    handle.setAttribute('aria-valuetext', new Intl.NumberFormat(lang, { style: 'percent' }).format(point));
    this.$('[part="header"]').hidden = !this.#headerSlot.assignedNodes({ flatten: true }).length;
    this.$('[part="footer"]').hidden = !this.#footerSlot.assignedNodes({ flatten: true }).length;
  }

  /** @param {number[]} points */
  #index(points) {
    return Math.max(0, Math.min(points.length - 1, Math.round(this.snap ?? 0)));
  }

  /** @param {number} index */
  #move(index) {
    const points = this.points;
    const next = Math.max(0, Math.min(points.length - 1, index));
    if (next === this.#index(points)) return;
    this.snap = next;
    this.emit('change', { value: next });
  }

  /** @param {KeyboardEvent} event */
  #onKeydown(event) {
    const points = this.points;
    const index = this.#index(points);
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        this.#move(index + 1);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        if (index === 0) this.requestClose('handle');
        else this.#move(index - 1);
        break;
      case 'Home':
        this.#move(0);
        break;
      case 'End':
        this.#move(points.length - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** @param {boolean} commit */
  #endDrag(commit) {
    const drag = this.#drag;
    if (!drag) return;
    this.#drag = null;
    this.dialogElement.classList.remove('dragging');
    const points = this.points;
    const fraction = drag.current / innerHeight;
    if (commit && fraction < points[0] / 2 && this.requestClose('drag')) return;
    if (commit) {
      let nearest = 0;
      points.forEach((point, i) => {
        if (Math.abs(point - fraction) < Math.abs(points[nearest] - fraction)) nearest = i;
      });
      this.#move(nearest);
    }
    // Back to the height of the snap point.
    this.dialogElement.style.setProperty('--_height', `${points[this.#index(points)] * 100}dvh`);
  }
}

define('punica-bottom-sheet', PunicaBottomSheet);
