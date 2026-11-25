import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import { ModalSurface } from '../dialog/modalSurface.js';
import styles from './drawer.css';

/**
 * A panel that slides in from an edge of the viewport.
 *
 * It is a native `<dialog>` opened with `showModal()`: the page behind is
 * inert, focus stays inside, Escape closes it and focus returns to the
 * element that had it. The `header` slot names it unless `label` does.
 *
 * @element punica-drawer
 *
 * @attr {string} label - Accessible name; the header's text by default.
 * @attr {boolean} open - The drawer is showing.
 * @attr {'inline-end' | 'inline-start' | 'block-start' | 'block-end'} side - Edge it slides from, `inline-end` by default.
 * @attr {'small' | 'medium' | 'large'} size - Extent across its edge, `medium` by default.
 * @attr {boolean} no-light-dismiss - A click on the backdrop does not close it.
 * @attr {boolean} no-close-button - Hides the close button.
 * @attr {string} label-close - Accessible name of the close button, `Close` by default.
 *
 * @prop {string} returnValue - The value given to `hide()` or `requestClose()` when it last closed (read-only).
 *
 * @slot - The body.
 * @slot header - The title.
 * @slot footer - Actions at the end of the drawer.
 *
 * @fires punica-open - The drawer opened.
 * @fires {{ reason: 'escape' | 'backdrop' | 'close-button' | 'api' | (string & {}) }} punica-request-close - The user asked to close it. `detail` is `{ reason }`. Cancelable: preventing it keeps the drawer open.
 * @fires {{ reason: 'escape' | 'backdrop' | 'close-button' | 'api' | (string & {}), returnValue: string }} punica-close - The drawer closed. `detail` is `{ reason, returnValue }`; `reason` is `escape`, `backdrop`, `close-button` or `api`.
 *
 * @csspart dialog - The native dialog, the sliding panel.
 * @csspart header - The row holding the title and the close button.
 * @csspart body - The scrolling body.
 * @csspart footer - The footer row.
 * @csspart close-button - The close button.
 *
 * @cssprop --punica-drawer-size - Inline size for an inline edge, block size for a block edge.
 * @cssprop --punica-drawer-radius - Radius of the two corners away from the edge.
 * @cssprop --punica-drawer-padding - Padding of header, body and footer.
 * @cssprop --punica-drawer-background - Background.
 * @cssprop --punica-drawer-backdrop - Colour of the backdrop.
 * @cssprop --punica-drawer-shadow - Shadow.
 */
export class PunicaDrawer extends ModalSurface(PunicaElement) {
  static properties = {
    side: { default: 'inline-end' },
    size: {},
    noCloseButton: { type: Boolean },
    labelClose: { default: 'Close' }
  };

  static styles = styles;
  static template = `
    <dialog part="dialog">
      <div part="header">
        <div class="title"><slot name="header"></slot></div>
        <button part="close-button" class="close" type="button">${icons.close}</button>
      </div>
      <div part="body"><slot></slot></div>
      <div part="footer" hidden><slot name="footer"></slot></div>
    </dialog>
  `;

  #close = this.$('.close');
  #headerSlot = this.$('slot[name="header"]');
  #footerSlot = this.$('slot[name="footer"]');

  constructor() {
    super();
    this.#close.addEventListener('click', () => this.requestClose('close-button'));
    this.#headerSlot.addEventListener('slotchange', () => this.requestUpdate());
    this.#footerSlot.addEventListener('slotchange', () => this.requestUpdate());
  }

  get labelSources() {
    return this.#headerSlot.assignedElements({ flatten: true });
  }

  update(changed) {
    super.update(changed);
    this.#close.setAttribute('aria-label', this.labelClose);
    this.$('[part="footer"]').hidden = !this.#footerSlot.assignedNodes({ flatten: true }).length;
    const noHeader = !this.#headerSlot.assignedNodes({ flatten: true }).length && this.noCloseButton;
    this.$('[part="header"]').hidden = noHeader;
  }
}

define('punica-drawer', PunicaDrawer);
