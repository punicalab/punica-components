import { PunicaElement, define } from '../../core/element.js';
import './metadataListItem.js';
import styles from './metadataList.css';

/** A `:host {}` rule of this instance alone, changed through the CSSOM. */
function instanceStyle(root) {
  const own = new CSSStyleSheet();
  own.replaceSync(':host{}');
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
  return /** @type {CSSStyleRule} */ (own.cssRules[0]).style;
}

/**
 * Facts about one thing as label and value pairs: the details of an order,
 * a file's properties, a record's status and owner.
 *
 * Its children are `punica-metadata-list-item` elements. Assistive
 * technology reads it the way it reads a native description list: a list
 * (`role=list`, named by `label`) whose items each hold a term and its
 * definition.
 *
 * @element punica-metadata-list
 *
 * @attr {string} label - Accessible name of the list.
 * @attr {'stacked' | 'inline' | 'columns'} layout - `inline` (the default) puts each label beside its value with the labels in one column; `stacked` puts each label above its value; `columns` flows stacked items into `columns` columns.
 * @attr {number} columns - Columns of the `columns` layout, 1 to 12; 2 by default. Under 480 px of width it is one column.
 * @attr {boolean} dividers - A line between the items.
 * @attr {boolean} dense - Smaller type and less space.
 *
 * @slot - The `punica-metadata-list-item` elements.
 *
 * @csspart base - The grid holding the items.
 *
 * @cssprop --punica-metadata-list-gap - Space between the items.
 * @cssprop --punica-metadata-list-label-width - Largest inline size of the label column of the `inline` layout, `40%` by default.
 * @cssprop --punica-metadata-list-label-color - Colour of the labels.
 * @cssprop --punica-metadata-list-divider-color - Colour of the dividers.
 */
export class PunicaMetadataList extends PunicaElement {
  static properties = {
    label: {},
    layout: {},
    columns: { type: Number, default: 2 },
    dividers: { type: Boolean },
    dense: { type: Boolean }
  };

  static styles = styles;
  static template = `<div part="base" class="base"><slot></slot></div>`;

  #style = instanceStyle(this.shadowRoot);

  update() {
    this.internals.role = 'list';
    this.internals.ariaLabel = this.label || null;
    const n = this.columns;
    if (Number.isInteger(n) && n >= 1 && n <= 12) this.#style.setProperty('--_columns', String(n));
    else this.#style.removeProperty('--_columns');
  }
}

define('punica-metadata-list', PunicaMetadataList);
