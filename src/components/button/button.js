import { PunicaElement, define } from '../../core/element.js';
import { FormControl } from '../../core/form.js';
import styles from './button.css';

const FORWARDED = [
  ['ariaExpanded', 'aria-expanded'],
  ['ariaHasPopup', 'aria-haspopup'],
  ['ariaPressed', 'aria-pressed'],
  ['ariaDescription', 'aria-description']
];

/**
 * The input types whose Enter submits their form (HTML's "fields that block
 * implicit submission"): a field of one line.
 */
const IMPLICIT = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number'
]);

/**
 * The form's default button: its first submit button in tree order, native or
 * a `punica-button type="submit"`.
 * @param {HTMLFormElement} form
 */
function defaultButton(form) {
  for (const el of form.elements) {
    if (el.localName === 'punica-button' && el.type === 'submit') return el;
    if (
      (el.localName === 'button' || el.localName === 'input') &&
      /** @type {any} */ (el).type === 'submit'
    )
      return el;
    if (el.localName === 'input' && /** @type {any} */ (el).type === 'image')
      return el;
  }
  return null;
}

/**
 * A button: an action, or a form's submit or reset.
 *
 * @element punica-button
 *
 * @attr {'filled' | 'outlined' | 'text' | 'plain'} variant - Visual weight, `filled` by default. `plain` paints nothing of its own: the element's class draws the box, the content stays a centred row, and it stays a button.
 * @attr {'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'neutral'} color - Accent, `primary` by default.
 * @attr {'small' | 'medium' | 'large'} size - Control height, `medium` by default.
 * @attr {'button' | 'submit' | 'reset'} type - What a click does to the owning form, `button` by default. The first submit button of a form is its default button: Enter in a native field of one line clicks it.
 * @attr {boolean} disabled - Takes no clicks and no focus.
 * @attr {boolean} required - Part of the form control contract; a button never blocks a form.
 * @attr {boolean} loading - Shows a spinner, keeps focus, ignores clicks.
 * @attr {boolean} pill - Fully rounded ends.
 * @attr {boolean} full-width - Fills its container's inline size.
 * @attr {string} name - Submitted with `value` when this button submits the form.
 * @attr {string} value - Submitted with `name`.
 * @attr {string} label - Accessible name, for a button with no text. An `aria-label` on the element names it too; `label` wins.
 *
 * @slot - The label.
 * @slot start - Content before the label, an icon.
 * @slot end - Content after the label.
 *
 * @csspart base - The native button.
 * @csspart label - The wrapper around the default slot.
 * @csspart spinner - The loading indicator.
 *
 * @cssstate focus-visible - The native button has focus the browser would show a ring for (the keyboard's). The
 *   element itself does not match `:focus-visible`; a page that draws the button with its own class puts its ring
 *   on the element with `punica-button.x:state(focus-visible)`.
 *
 * @cssprop --punica-button-radius - Corner radius.
 * @cssprop --punica-button-height - Minimum block size.
 * @cssprop --punica-button-padding - Inline padding.
 */
export class PunicaButton extends FormControl(PunicaElement) {
  static properties = {
    variant: {},
    color: {},
    size: {},
    type: { default: 'button' },
    loading: { type: Boolean },
    pill: { type: Boolean },
    fullWidth: { type: Boolean },
    value: {},
    label: {},
    // ARIA a wrapper (a popover, a menu) writes on the host is passed to
    // the native button, which is what assistive technology reads.
    ariaExpanded: { attribute: 'aria-expanded', reflect: false },
    ariaHasPopup: { attribute: 'aria-haspopup', reflect: false },
    ariaControls: { attribute: 'aria-controls', reflect: false },
    ariaPressed: { attribute: 'aria-pressed', reflect: false },
    ariaDescription: { attribute: 'aria-description', reflect: false },
    // A name written on the host the usual way names the native button too; `label` wins when both are there.
    ariaLabel: { attribute: 'aria-label', reflect: false }
  };

  static styles = styles;
  static shadowOptions = { delegatesFocus: true };
  static template = `
    <button part="base" type="button">
      <slot name="start"></slot>
      <span part="label" class="label"><slot></slot></span>
      <slot name="end"></slot>
      <span part="spinner" class="spinner" aria-hidden="true"></span>
    </button>
  `;

  #button = this.$('button');

  constructor() {
    super();
    this.#button.addEventListener('click', (event) => this.#onClick(event));
    // The host matches :focus, never :focus-visible, while its native button has focus: the state says which focus it is.
    this.#button.addEventListener('focus', () =>
      this.toggleState('focus-visible', this.#button.matches(':focus-visible'))
    );
    this.#button.addEventListener('blur', () =>
      this.toggleState('focus-visible', false)
    );
    // A click that lands on the host while it cannot act goes nowhere.
    this.addEventListener(
      'click',
      (event) => {
        if (this.isDisabled || this.loading) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true }
    );
  }

  update() {
    const button = this.#button;
    button.disabled = this.isDisabled;
    button.setAttribute('aria-busy', String(this.loading));
    if (this.loading) button.setAttribute('aria-disabled', 'true');
    else button.removeAttribute('aria-disabled');
    const name = this.label || this.ariaLabel;
    if (name) button.setAttribute('aria-label', name);
    else button.removeAttribute('aria-label');
    for (const [prop, attribute] of FORWARDED) {
      if (this[prop] == null) button.removeAttribute(attribute);
      else button.setAttribute(attribute, this[prop]);
    }
  }

  connected() {
    super.connected?.();
    // Enter in a native field of one line submits the form through its default button, as the platform does when
    // that button is a native one: a custom element is not a default button to the browser, so a form whose submit
    // button was a punica-button lost Enter once it had two fields. Each button listens while connected; only the
    // form's default button acts, and a disabled one blocks the submission as a native one does.
    this.listen(this.getRootNode(), 'keydown', (event) =>
      this.#onEnter(/** @type {KeyboardEvent} */ (event))
    );
  }

  /** @param {KeyboardEvent} event */
  #onEnter(event) {
    if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing)
      return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const field = event.composedPath()[0];
    if (
      !(field instanceof HTMLInputElement) ||
      !IMPLICIT.has(field.type) ||
      !field.form
    )
      return;
    if (defaultButton(field.form) !== this) return;
    event.preventDefault();
    this.click();
  }

  /** Moves focus to the button. */
  focus(options) {
    this.#button.focus(options);
  }

  /** Clicks the button the way a user would. */
  click() {
    this.#button.click();
  }

  #onClick() {
    if (this.isDisabled || this.loading) return;
    if (this.type === 'submit') {
      // A native submitter carries its name and value into the form data.
      this.internals.setFormValue(this.value ?? '');
      this.formAction('submit');
      this.internals.setFormValue(null);
    } else if (this.type === 'reset') {
      this.formAction('reset');
    }
  }
}

define('punica-button', PunicaButton);
