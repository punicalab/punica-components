import { PunicaElement, define } from '../../core/element.js';
import styles from './formLayout.css';

/**
 * Lays out the fields of a form: `punica-field`s and plain controls in one
 * to four columns, with the labels above the fields or beside them in one
 * aligned column, and a row of buttons at the end.
 *
 * It is layout only: wrap it in a `<form>` for submission. In a container
 * narrower than 480px it falls back to one column with labels above, which
 * it measures on itself (a container query), not on the viewport. So it
 * never takes its inline size from its content: in a flex row or another
 * shrink-to-fit parent, give it a width.
 *
 * A field's control fills its column without `full-width`. With labels
 * beside the fields, a label sits on the baseline of its control; a control
 * with `full-width` is stretched by `punica-field` instead, and its label
 * goes to the top of the row.
 *
 * A child takes more than one column with `span="2"`, `"3"`, `"4"` or
 * `"full"`; a span wider than the layout takes the whole row.
 *
 * With `label-position="start"` each `punica-field` becomes a subgrid row:
 * its label sits in the label column and the control in the field column,
 * and the label column is as wide as the longest label, up to
 * `--punica-form-layout-label-max-width`. A child that is not a
 * `punica-field` spans both columns.
 *
 * @element punica-form-layout
 *
 * @attr {number} columns - Number of columns, 1 to 4; `1` by default.
 * @attr {'top' | 'start'} label-position - Labels above the fields, or beside them on the inline-start side; `top` by default.
 * @attr {'small' | 'medium' | 'large'} gap - Space between the rows, `medium` by default.
 *
 * @slot - The fields: `punica-field` elements or controls. Each may carry `span`.
 * @slot actions - The buttons under the fields, in the field column.
 *
 * @csspart base - The grid.
 * @csspart actions - The row around the `actions` slot.
 *
 * @cssprop --punica-form-layout-gap - Space between the rows.
 * @cssprop --punica-form-layout-column-gap - Space between the columns, and between a label and its field.
 * @cssprop --punica-form-layout-label-max-width - Widest the label column grows with `label-position="start"`, 40% by default.
 *
 * @cssstate has-actions - The `actions` slot has content.
 */
export class PunicaFormLayout extends PunicaElement {
  static properties = {
    columns: { type: Number, default: 1 },
    labelPosition: { default: 'top' },
    gap: {}
  };

  static styles = styles;
  static template = `
    <div part="base" class="grid">
      <slot></slot>
      <div part="actions" class="actions" hidden><slot name="actions"></slot></div>
    </div>
  `;

  #actions = this.$('.actions');
  #actionsSlot = this.$('slot[name="actions"]');

  constructor() {
    super();
    this.#actionsSlot.addEventListener('slotchange', () => this.requestUpdate());
  }

  update() {
    const filled = this.#actionsSlot.assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
    this.#actions.hidden = !filled;
    this.toggleState('has-actions', filled);
  }
}

define('punica-form-layout', PunicaFormLayout);
