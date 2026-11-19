import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { ModalSurface } from './modalSurface.js';
import styles from './dialog.css';

/**
 * A dialog: a window over the page that takes focus until it is closed.
 *
 * It is a native `<dialog>` opened with `showModal()`, so the page behind is
 * inert, focus stays inside and Escape closes it. Its children are
 * `punica-dialog-header`, `punica-dialog-content` and `punica-dialog-footer`.
 * The header names the dialog unless `label` does.
 *
 * Opening moves focus to the first focusable element inside, or to the one
 * carrying `autofocus`; closing puts it back on the element that had it.
 *
 * @element punica-dialog
 *
 * @attr {string} label - Accessible name; the header's text by default.
 * @attr {boolean} open - The dialog is showing.
 * @attr {boolean} modeless - Opens with `show()`: no backdrop, the page stays usable.
 * @attr {'small' | 'medium' | 'large'} size - Inline size, `medium` by default.
 * @attr {boolean} no-light-dismiss - A click on the backdrop does not close it.
 * @attr {boolean} no-close-button - Hides the close button.
 * @attr {string} label-close - Accessible name of the close button, `Close` by default.
 *
 * @prop {string} returnValue - The value given to `hide()` or `requestClose()` when it last closed (read-only).
 *
 * @slot - `punica-dialog-header`, `punica-dialog-content`, `punica-dialog-footer`.
 *
 * @fires punica-open - The dialog opened.
 * @fires punica-request-close - The user asked to close it. `detail` is `{ reason }`. Cancelable: preventing it keeps the dialog open.
 * @fires punica-close - The dialog closed. `detail` is `{ reason, returnValue }`; `reason` is `escape`, `backdrop`, `close-button` or `api`.
 *
 * @csspart dialog - The native dialog.
 * @csspart panel - The grid holding header, content and footer.
 * @csspart close-button - The close button.
 *
 * @cssprop --punica-dialog-radius - Corner radius.
 * @cssprop --punica-dialog-padding - Padding of the panel.
 * @cssprop --punica-dialog-background - Background.
 * @cssprop --punica-dialog-backdrop - Colour of the backdrop.
 * @cssprop --punica-dialog-shadow - Shadow.
 * @cssprop --punica-dialog-width - Inline size.
 */
export class PunicaDialog extends ModalSurface(PunicaElement) {
  static properties = {
    size: {},
    modeless: { type: Boolean },
    noCloseButton: { type: Boolean },
    labelClose: { default: 'Close' }
  };

  static styles = styles;
  static template = `
    <dialog part="dialog">
      <div part="panel" class="panel"><slot></slot></div>
      <button part="close-button" class="close" type="button">${icons.close}</button>
    </dialog>
  `;

  #close = this.$('.close');

  constructor() {
    super();
    this.#close.addEventListener('click', () => this.requestClose('close-button'));
    this.$('slot').addEventListener('slotchange', () => this.requestUpdate());
  }

  get labelSources() {
    return [...this.children].filter((el) => el.localName === 'punica-dialog-header');
  }

  update(changed) {
    super.update(changed);
    this.#close.setAttribute('aria-label', this.labelClose);
  }
}

define('punica-dialog', PunicaDialog);
