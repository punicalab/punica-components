import { PunicaElement, define } from '../../core/element.js';
import { icons } from '../../core/icons.js';
import styles from './treeItem.css';

const ITEM = 'punica-tree-item';

/**
 * One node of a `punica-tree`. The items in its default slot are its children.
 *
 * @element punica-tree-item
 *
 * @attr {string} label - The node's text and accessible name.
 * @attr {string} value - Carried in `punica-select`; the label when absent.
 * @attr {boolean} expanded - The children are showing.
 * @attr {boolean} selected - The node is selected.
 * @attr {boolean} disabled - The node cannot be focused, selected or toggled.
 * @attr {boolean} lazy - The node has children that are not loaded yet: it shows as a branch and fires `punica-load` when first expanded. Remove the attribute once they are appended.
 * @attr {boolean} loading - The node is waiting for its children. Set by the item while `lazy` and expanded.
 *
 * @slot - The child `punica-tree-item` elements.
 * @slot label - Rich content in place of `label`; keep `label` set as the accessible name.
 * @slot start - Content before the label, an icon.
 * @slot end - Content after the label.
 *
 * @fires {{ open: boolean, item: HTMLElement }} punica-toggle - The user expanded or collapsed the node. `detail` is `{ open, item }`.
 * @fires {{ item: HTMLElement }} punica-load - The node is `lazy` and was expanded. `detail` is `{ item }`.
 *
 * @csspart row - The node's own line.
 * @csspart toggle - The expand indicator.
 * @csspart label - The wrapper around the label.
 * @csspart spinner - The indicator shown while loading.
 * @csspart group - The element with `role="group"` around the children.
 *
 * @cssprop --punica-tree-item-indent - Indent of the children.
 * @cssprop --punica-tree-item-padding - Padding of the row.
 * @cssprop --punica-tree-item-hover-background - Background of the row under the pointer.
 * @cssprop --punica-tree-item-selected-background - Background of a selected row.
 *
 * @cssstate branch - The node has, or will load, children.
 */
export class PunicaTreeItem extends PunicaElement {
  static properties = {
    label: {},
    value: {},
    expanded: { type: Boolean },
    selected: { type: Boolean },
    disabled: { type: Boolean },
    lazy: { type: Boolean },
    loading: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="row" class="row">
      <span part="toggle" class="toggle" aria-hidden="true">${icons.chevronEnd}</span>
      <slot name="start"></slot>
      <span part="label" class="label"><slot name="label"><span class="label-text"></span></slot></span>
      <slot name="end"></slot>
      <span part="spinner" class="spinner" aria-hidden="true"></span>
    </div>
    <div part="group" class="group" role="group"><slot></slot></div>
  `;

  constructor() {
    super();
    this.internals.role = 'treeitem';
    this.$('slot:not([name])').addEventListener('slotchange', () => {
      this.requestUpdate();
      for (const child of this.#children) /** @type {any} */ (child).requestUpdate?.();
      this.#tree?.requestUpdate?.();
    });
  }

  get #children() {
    return [...this.children].filter((el) => el.localName === ITEM);
  }

  /** @returns {any} */
  get #tree() {
    return this.closest('punica-tree');
  }

  connected() {
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
    this.requestUpdate();
  }

  update(changed) {
    const internals = this.internals;
    const tree = this.#tree;
    const branch = this.lazy || this.#children.length > 0;
    this.toggleState('branch', branch);

    if (this.lazy && this.expanded && !this.loading) {
      this.loading = true;
      this.emit('load', { item: this });
    } else if (this.loading && !this.lazy) {
      this.loading = false;
    }

    let level = 1;
    for (let p = this.parentElement; p && p.localName === ITEM; p = p.parentElement) level++;
    const siblings = this.parentElement
      ? [...this.parentElement.children].filter((el) => el.localName === ITEM)
      : [this];
    internals.ariaLevel = String(level);
    internals.ariaSetSize = String(siblings.length);
    internals.ariaPosInSet = String(siblings.indexOf(this) + 1);
    internals.ariaLabel = this.label || null;
    internals.ariaExpanded = branch ? String(this.expanded) : null;
    internals.ariaDisabled = this.disabled ? 'true' : null;
    internals.ariaBusy = this.loading ? 'true' : null;
    const selection = tree?.selection ?? tree?.getAttribute('selection') ?? 'none';
    internals.ariaSelected = selection === 'none' ? null : String(this.selected);
    this.$('.label-text').textContent = this.label ?? '';

    if (changed.has('expanded') || changed.has('disabled') || changed.has('lazy')) tree?.requestUpdate?.();
  }
}

define('punica-tree-item', PunicaTreeItem);
