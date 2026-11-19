import { PunicaElement, define } from '../../core/element.js';
import styles from './commandGroup.css';

/**
 * A labelled set of `punica-command-item` in a `punica-command-palette`.
 *
 * @element punica-command-group
 *
 * @attr {string} label - Accessible name, shown above the items.
 *
 * @prop {boolean} filteredOut - Hidden because none of its items matches the query; set by the palette.
 *
 * @slot - The items.
 *
 * @csspart label - The visible label.
 *
 * @cssstate filtered-out - None of its items matches the query.
 */
export class PunicaCommandGroup extends PunicaElement {
  static properties = {
    label: {},
    filteredOut: { type: Boolean, attribute: false }
  };

  static styles = styles;
  static template = `<div part="label" class="label" aria-hidden="true"></div><slot></slot>`;

  connected() {
    this.internals.role = 'group';
  }

  update() {
    this.$('.label').textContent = this.label ?? '';
    this.internals.ariaLabel = this.label || null;
    this.toggleState('filtered-out', this.filteredOut);
  }
}

define('punica-command-group', PunicaCommandGroup);
