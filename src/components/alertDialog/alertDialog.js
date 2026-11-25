import { PunicaElement, define } from '../../core/element.js';
import { ModalSurface } from '../dialog/modalSurface.js';
import '../button/button.js';
import dialogStyles from '../dialog/dialog.css';
import styles from './alertDialog.css';

/**
 * A confirmation dialog: asks the user to confirm an action before it
 * happens, deleting, revoking or discarding something.
 *
 * It is a native `<dialog>` with `role=alertdialog`, opened with
 * `showModal()` through the same modal surface as `punica-dialog`: the page
 * behind is inert, focus stays inside and goes back to the opener on close.
 * `heading` names it and the default slot describes it. Opening puts focus on
 * the cancel button, the least destructive choice. Escape cancels; a click on
 * the backdrop does nothing.
 *
 * `ask()` opens it and resolves with whether the user confirmed; the module
 * also exports `confirm(options)`, which makes one, asks and removes it.
 *
 * @element punica-alert-dialog
 *
 * @attr {string} heading - The question, a level-2 heading that names the dialog.
 * @attr {string} label - Accessible name, in place of `heading`.
 * @attr {boolean} open - The dialog is showing.
 * @attr {string} confirm-label - Text of the confirm button, `Confirm` by default.
 * @attr {string} cancel-label - Text of the cancel button, `Cancel` by default.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Colour of the confirm button, `primary` by default; `error` for a destructive action.
 * @attr {boolean} no-light-dismiss - Has no effect: a click on the backdrop never closes an alert dialog.
 * @attr {boolean} loading - The confirm button shows a spinner and takes no clicks, while the work it started runs.
 *
 * @prop {string} returnValue - `confirm` or `cancel` after a button closed it, else empty (read-only).
 *
 * @slot - The description: what happens if the user confirms. It is the dialog's accessible description.
 *
 * @fires punica-open - The dialog opened.
 * @fires {{ reason: 'confirm' | 'cancel' | 'escape' | 'api' | (string & {}) }} punica-request-close - A button or Escape is about to close it. `detail` is `{ reason }`. Cancelable: preventing it keeps the dialog open, for example while the confirmed work runs.
 * @fires {{ reason: 'confirm' | 'cancel' | 'escape' | 'api' | (string & {}), returnValue: string }} punica-close - The dialog closed. `detail` is `{ reason, returnValue }`; `reason` is `confirm`, `cancel`, `escape` or `api`.
 *
 * @csspart dialog - The native dialog.
 * @csspart panel - The column holding heading, description and actions.
 * @csspart heading - The heading.
 * @csspart description - The wrapper around the default slot.
 * @csspart actions - The row of buttons.
 * @csspart cancel-button - The cancel `punica-button`.
 * @csspart confirm-button - The confirm `punica-button`.
 *
 * @cssprop --punica-alert-dialog-width - Inline size, `400px` by default.
 * @cssprop --punica-dialog-radius - Corner radius, as on `punica-dialog`.
 * @cssprop --punica-dialog-padding - Padding of the panel.
 * @cssprop --punica-dialog-background - Background.
 * @cssprop --punica-dialog-backdrop - Colour of the backdrop.
 * @cssprop --punica-dialog-shadow - Shadow.
 */
export class PunicaAlertDialog extends ModalSurface(PunicaElement) {
  static properties = {
    heading: {},
    confirmLabel: { default: 'Confirm' },
    cancelLabel: { default: 'Cancel' },
    color: {},
    loading: { type: Boolean }
  };

  static styles = [dialogStyles, styles];
  static template = `
    <dialog part="dialog" role="alertdialog" aria-describedby="description">
      <div part="panel" class="panel">
        <h2 part="heading" class="heading" id="heading"></h2>
        <div part="description" class="description" id="description"><slot></slot></div>
        <div part="actions" class="actions">
          <punica-button part="cancel-button" class="cancel" variant="outlined" color="neutral"></punica-button>
          <punica-button part="confirm-button" class="confirm"></punica-button>
        </div>
      </div>
    </dialog>
  `;

  #heading = this.$('.heading');
  #cancel = this.$('.cancel');
  #confirm = this.$('.confirm');

  constructor() {
    super();
    this.#cancel.addEventListener('click', () => this.requestClose('cancel', 'cancel'));
    this.#confirm.addEventListener('click', () => {
      if (!this.loading) this.requestClose('confirm', 'confirm');
    });
  }

  get labelSources() {
    return this.#heading.textContent.trim() ? [this.#heading] : [];
  }

  /** The backdrop never closes an alert dialog: the user must choose. */
  isBackdropHit() {
    return false;
  }

  /**
   * Opens the dialog and waits for the user's answer.
   * @returns {Promise<boolean>} true when the user confirmed; false on cancel, Escape or any other close
   */
  ask() {
    return new Promise((resolve) => {
      const onClose = (event) => {
        if (event.target !== this) return;
        this.removeEventListener('punica-close', onClose);
        resolve(event.detail?.reason === 'confirm');
      };
      this.addEventListener('punica-close', onClose);
      this.show();
    });
  }

  update(changed) {
    this.#heading.textContent = this.heading ?? '';
    this.#heading.hidden = !this.heading;
    this.#cancel.textContent = this.cancelLabel ?? '';
    this.#confirm.textContent = this.confirmLabel ?? '';
    if (this.color) this.#confirm.setAttribute('color', this.color);
    else this.#confirm.removeAttribute('color');
    this.#confirm.loading = this.loading;
    super.update(changed);
  }

  surfaceOpened() {
    // The least destructive choice takes focus.
    this.#cancel.focus({ preventScroll: true });
  }
}

define('punica-alert-dialog', PunicaAlertDialog);

/**
 * Asks the user to confirm, in an alert dialog made for the question.
 *
 * The dialog is appended to `<body>` (or to `container`), opened, and removed
 * once it closes. Text is set as text, never parsed as markup.
 *
 * @param {{ heading?: string, message?: string, confirmLabel?: string, cancelLabel?: string, color?: string, container?: Element }} [options]
 * @returns {Promise<boolean>} true when the user confirmed
 */
export async function confirm(options = {}) {
  const el = /** @type {PunicaAlertDialog} */ (document.createElement('punica-alert-dialog'));
  if (options.heading != null) el.heading = String(options.heading);
  if (options.message != null) el.textContent = String(options.message);
  if (options.confirmLabel != null) el.confirmLabel = String(options.confirmLabel);
  if (options.cancelLabel != null) el.cancelLabel = String(options.cancelLabel);
  if (options.color != null) el.color = String(options.color);
  const container = options.container || document.body;
  // audit-allow: portal-to-body (confirm() makes its own dialog for one question and removes it)
  container.appendChild(el);
  try {
    return await el.ask();
  } finally {
    el.remove();
  }
}
