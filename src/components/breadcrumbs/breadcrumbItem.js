import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './breadcrumbItem.css';

/**
 * One step of a `punica-breadcrumbs` path.
 *
 * @element punica-breadcrumb-item
 *
 * @attr {string} href - Address the item links to; plain text when absent.
 * @attr {string} target - Where the link opens.
 * @attr {string} rel - Relationship of the link.
 * @attr {boolean} current - The item is the current page: it gets `aria-current="page"`.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 * @slot separator - The separator after the item, a chevron by default.
 *
 * @csspart link - The `a` element.
 * @csspart separator - The separator after the item.
 *
 * @cssprop --punica-breadcrumb-item-color - Color of a link.
 * @cssprop --punica-breadcrumb-item-current-color - Color of the current page and of an item with no link.
 * @cssprop --punica-breadcrumb-item-gap - Space between the link and its separator.
 * @cssprop --punica-breadcrumb-item-separator-display - `display` of the separator; `punica-breadcrumbs` hides the last one.
 */
export class PunicaBreadcrumbItem extends PunicaElement {
  static properties = {
    href: {},
    target: {},
    rel: {},
    current: { type: Boolean }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <a part="link" class="link"><slot name="start"></slot><slot></slot></a>
    <span part="separator" class="separator" aria-hidden="true"><slot name="separator">${icons.chevronEnd}</slot></span>
  `;

  #link = this.$('a');

  constructor() {
    super();
    this.internals.role = 'listitem';
  }

  update() {
    const link = this.#link;
    for (const name of ['href', 'target', 'rel']) {
      if (this[name] != null) link.setAttribute(name, this[name]);
      else link.removeAttribute(name);
    }
    if (this.current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

define('punica-breadcrumb-item', PunicaBreadcrumbItem);
