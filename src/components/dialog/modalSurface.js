import {
  deepActiveElement,
  composedContains,
  firstFocusable
} from '../../core/a11y.js';
import { sheet } from '../../core/element.js';

/**
 * Page scroll lock. While at least one modal surface is open, a stylesheet
 * that stops the root from scrolling is adopted on the document; it is
 * removed when the last one closes. Nothing is written on `<html>` or
 * `<body>`, so the page's own inline styles and scroll position are left
 * alone. Where the page had a classic scrollbar, `scrollbar-gutter: stable`
 * keeps the width it took, so the page does not shift sideways; where it had
 * none (overlay scrollbars, or a page that does not scroll) no gutter is
 * added, which would open an empty strip at the edge.
 */
const LOCK_CSS = ':root { overflow: hidden; overscroll-behavior: none; }';
const GUTTER_CSS = ':root { scrollbar-gutter: stable; }';
/** @type {Set<object>} */
const locks = new Set();
/** @type {CSSStyleSheet | null} */
let lockSheet = null;
/** @type {CSSStyleSheet | null} */
let gutterSheet = null;

/**
 * @param {object} owner
 * @param {boolean} on
 */
function lockScroll(owner, on) {
  if (typeof document === 'undefined') return;
  if (on) locks.add(owner);
  else locks.delete(owner);
  const want = locks.size > 0;
  const has = !!lockSheet && document.adoptedStyleSheets.includes(lockSheet);
  if (want && !has) {
    lockSheet ||= sheet(LOCK_CSS);
    gutterSheet ||= sheet(GUTTER_CSS);
    // Read before the lock hides the scrollbar.
    const scrollbar =
      window.innerWidth - document.documentElement.clientWidth > 0;
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      lockSheet,
      ...(scrollbar ? [gutterSheet] : [])
    ];
  } else if (!want && has) {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== lockSheet && s !== gutterSheet
    );
  }
}

/** What a person would call a control, as against a scroller the browser lets take focus. */
const CONTROL =
  'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

/**
 * Closes a dialog and takes it out of the top layer if it was there as a
 * popover (a modeless one).
 * @param {HTMLDialogElement} dialog
 */
function closeDialog(dialog) {
  if (dialog.hasAttribute('popover')) {
    try {
      if (dialog.matches(':popover-open')) dialog.hidePopover();
    } catch {
      // No Popover API.
    }
    dialog.removeAttribute('popover');
  }
  if (dialog.open) dialog.close();
}

/**
 * ModalSurface: what every component built on a native `<dialog>` shares.
 *
 * The component's shadow template holds one `<dialog>`. The mixin keeps the
 * `open` property and the native dialog in step in both directions, opens
 * with `showModal()` (or `show()` while a `modeless` property is true),
 * asks before a user-initiated close, names the dialog, and puts focus back
 * where it was.
 *
 *  - `punica-open` when it opened;
 *  - `punica-request-close` `{ reason }`, cancelable, before Escape, a
 *    backdrop click or a close button closes it;
 *  - `punica-close` `{ reason, returnValue }` when it closed. `reason` is
 *    `escape`, `backdrop`, `close-button`, `api`, or one the component adds.
 *
 * A subclass may override `labelSources` (elements that name the dialog when
 * `label` is absent) and `isBackdropHit(event)`, and calls
 * `super.connected()`, `super.disconnected()` and `super.update(changed)`.
 *
 * @template {new (...args: any[]) => import('../../core/element.js').PunicaElement} T
 * @param {T} Base
 */
export const ModalSurface = (Base) =>
  class ModalSurfaceElement extends Base {
    static properties = {
      /** Accessible name of the dialog. */
      label: {},
      /** The dialog is showing. */
      open: { type: Boolean },
      /** A click on the backdrop does not close it. */
      noLightDismiss: { type: Boolean }
    };

    #shown = false;
    #reason = 'api';
    #returnValue = '';
    #downOnBackdrop = false;
    /** @type {Element | null} */
    #returnFocus = null;

    constructor(...args) {
      super(...args);
      const dialog = this.dialogElement;
      // Escape on a modal dialog arrives as `cancel`.
      dialog.addEventListener('cancel', (event) => {
        if (event.target !== dialog) return;
        event.preventDefault();
        this.requestClose('escape');
      });
      // The platform may close the dialog itself (a second Escape cannot be
      // prevented): follow it.
      dialog.addEventListener('close', (event) => {
        if (event.target !== dialog) return;
        if (this.open && this.isConnected && this.#shown && !dialog.open) {
          this.#reason = 'escape';
          this.open = false;
        }
      });
      dialog.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented || !this.modeless)
          return;
        event.preventDefault();
        this.requestClose('escape');
      });
      dialog.addEventListener('pointerdown', (event) => {
        this.#downOnBackdrop =
          event.target === dialog && this.isBackdropHit(event);
      });
      dialog.addEventListener('click', (event) => {
        const hit =
          this.#downOnBackdrop &&
          event.target === dialog &&
          this.isBackdropHit(event);
        this.#downOnBackdrop = false;
        if (hit && !this.noLightDismiss && !this.modeless)
          this.requestClose('backdrop');
      });
    }

    /** The native dialog. @returns {HTMLDialogElement} */
    get dialogElement() {
      return this.$('dialog');
    }

    /** Elements that name the dialog when `label` is not set. @returns {Element[]} */
    get labelSources() {
      return [];
    }

    /** The value handed to `hide()` or `requestClose()` when it last closed. */
    get returnValue() {
      return this.#returnValue;
    }

    /**
     * Whether a pointer event on the dialog element landed on its backdrop.
     * @param {MouseEvent} event
     */
    isBackdropHit(event) {
      const rect = this.dialogElement.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    }

    /** Opens the dialog. */
    show() {
      this.open = true;
    }

    /**
     * Closes the dialog without asking.
     * @param {string} [returnValue] reported in `punica-close`
     */
    hide(returnValue) {
      this.closeWith('api', returnValue);
    }

    /**
     * Closes the dialog the way a user does: fires the cancelable
     * `punica-request-close` first.
     * @param {string} [reason] `api` by default
     * @param {string} [returnValue] reported in `punica-close`
     * @returns {boolean} false when a listener kept it open
     */
    requestClose(reason = 'api', returnValue) {
      if (!this.open) return false;
      const event = this.emit(
        'request-close',
        { reason },
        { cancelable: true }
      );
      if (event.defaultPrevented) return false;
      this.closeWith(reason, returnValue);
      return true;
    }

    /**
     * Closes with a reason, without asking. For the component's own use.
     * @param {string} reason
     * @param {string} [returnValue]
     */
    closeWith(reason, returnValue) {
      if (!this.open) return;
      this.#reason = reason;
      if (returnValue !== undefined) this.#returnValue = String(returnValue);
      this.open = false;
    }

    connected() {
      super.connected();
      // Moved while open: open again in the new place.
      if (this.open && !this.#shown)
        queueMicrotask(() => this.isConnected && this.#sync());
    }

    disconnected() {
      super.disconnected();
      const dialog = this.dialogElement;
      // A removed dialog keeps its `open` attribute, and showModal() throws on it.
      if (dialog.open) closeDialog(dialog);
      this.#shown = false;
      lockScroll(this, false);
    }

    update(changed) {
      super.update(changed);
      this.#name();
      this.#sync();
    }

    #name() {
      const dialog = this.dialogElement;
      const sources = this.label ? [] : this.labelSources;
      const text =
        this.label || sources.map((el) => el.textContent.trim()).join(' ');
      // Both: element references are what a browser follows; the attribute is
      // the same name for one that cannot point out of a shadow tree.
      if ('ariaLabelledByElements' in dialog)
        dialog.ariaLabelledByElements = sources.length ? sources : null;
      if (text) dialog.setAttribute('aria-label', text);
      else dialog.removeAttribute('aria-label');
    }

    #sync() {
      const dialog = this.dialogElement;
      if (this.open && !this.#shown) {
        this.#shown = true;
        this.#returnValue = '';
        this.#returnFocus = deepActiveElement();
        if (dialog.open) closeDialog(dialog);
        if (this.modeless) {
          // A non-modal dialog is in the page's flow, under any positioned
          // or sticky content; as a manual popover it is in the top layer.
          dialog.setAttribute('popover', 'manual');
          dialog.show();
          dialog.showPopover?.();
        } else {
          dialog.showModal();
          lockScroll(this, true);
          // The browser's own pick looks only at the dialog's descendants, not at what its slots show: the content's
          // `autofocus` control is never found, and a scrolling panel can be taken for a stop. Focus the content's
          // `autofocus` control; else, where the pick is no control (a scroller), the content's first control.
          const auto = /** @type {HTMLElement | null} */ (
            this.querySelector('[autofocus]')
          );
          const at = deepActiveElement();
          const control =
            at instanceof HTMLElement &&
            (at.matches(CONTROL) ||
              !!(/** @type {HTMLElement} */ (at).shadowRoot?.delegatesFocus));
          if (auto) auto.focus();
          else if (!control) firstFocusable(this)?.focus();
        }
        this.surfaceOpened();
        this.emit('open');
      } else if (!this.open && this.#shown) {
        this.#shown = false;
        lockScroll(this, false);
        const active = deepActiveElement();
        const inside =
          !active ||
          active === document.body ||
          composedContains(this, active) ||
          composedContains(dialog, active);
        closeDialog(dialog);
        const back = this.#returnFocus;
        this.#returnFocus = null;
        const reason = this.#reason;
        this.#reason = 'api';
        if (
          inside &&
          back instanceof HTMLElement &&
          back.isConnected &&
          deepActiveElement() !== back
        ) {
          back.focus({ preventScroll: true });
        }
        this.surfaceClosed();
        this.emit('close', { reason, returnValue: this.#returnValue });
      }
    }

    /** Runs right after the dialog opened, before `punica-open`. */
    surfaceOpened() {}
    /** Runs right after the dialog closed, before `punica-close`. */
    surfaceClosed() {}
  };
