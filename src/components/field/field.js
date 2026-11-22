import { PunicaElement, define } from '../../core/element.js';
import styles from './field.css';

/**
 * A label, a help text and an error message around one form control.
 *
 * The control goes in the default slot. A click on the label focuses it,
 * and `label` becomes the control's accessible name unless the control
 * already has one. Once the control has been reported invalid (its
 * `invalid` event fired: a submit, `reportValidity()` or `checkValidity()`)
 * or the user left it while invalid, the field shows the control's
 * `validationMessage` and keeps it up to date until the control is valid
 * again. `error` shows a message of your own at any time. The help and the
 * message shown are the control's description (its `description`, or
 * `aria-description` on a native control), and an invalid control says so
 * (`aria-invalid`) once touched.
 *
 * @element punica-field
 *
 * @attr {string} label - The visible label, and the control's accessible name when it has none.
 * @attr {string} help - Text under the control.
 * @attr {string} error - An error message to show now, in place of the control's own.
 * @attr {boolean} required - Shows the required mark; also shown when the control is `required`.
 *
 * @slot - The control: one `punica-*` form control or a native one.
 * @slot label - Rich label content, in place of `label`.
 * @slot help - Rich help content, in place of `help`.
 *
 * @csspart label - The label row.
 * @csspart required - The required mark.
 * @csspart help - The help text.
 * @csspart error - The error message.
 *
 * @cssprop --punica-field-gap - Space between the label, the control and the texts.
 * @cssprop --punica-field-control-align - Block alignment of a full-width control, `stretch` by default; a form layout with labels beside the fields sets `baseline`.
 * @cssprop --punica-field-label-color - Label colour.
 * @cssprop --punica-field-help-color - Help text colour.
 * @cssprop --punica-field-error-color - Error text colour.
 * @cssprop --punica-field-line-height - Line height of the label, the help and the error, 1.43 by default.
 *
 * @cssstate invalid - An error message is showing.
 * @cssstate required - The required mark is showing.
 */
export class PunicaField extends PunicaElement {
  static properties = {
    label: {},
    help: {},
    error: {},
    required: { type: Boolean }
  };

  static styles = styles;
  static template = `
    <div part="label" class="label" hidden>
      <slot name="label"><span class="label-text"></span></slot>
      <span part="required" class="required" aria-hidden="true" hidden>*</span>
    </div>
    <slot></slot>
    <div part="help" class="help" hidden><slot name="help"><span class="help-text"></span></slot></div>
    <div part="error" class="error" aria-live="polite" hidden></div>
  `;

  /** The control was reported invalid, or left while invalid. */
  #touched = false;
  /** The control whose name this field wrote, so it can keep it current. */
  #named = null;
  /** The control whose description this field wrote, so it can keep it current. */
  #described = null;

  constructor() {
    super();
    const root = this.shadowRoot;
    for (const slot of root.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => {
        if (this.isConnected) this.update();
      });
    }
    this.$('.label').addEventListener('click', (event) => {
      // An interactive element inside a rich label keeps its own click.
      if (event.target.closest?.('a, button, input, select, textarea')) return;
      this.control?.focus();
    });
    // `invalid` does not bubble; the capture phase still passes here. The
    // event is left alone, so the browser still focuses the first invalid
    // control of a submit and shows its own bubble there.
    this.addEventListener(
      'invalid',
      (event) => {
        if (event.target !== this.control) return;
        this.#touched = true;
        this.#refresh();
      },
      { capture: true }
    );
    this.addEventListener('focusout', () => {
      const control = this.control;
      if (control?.validity && !control.validity.valid) this.#touched = true;
      this.#later();
    });
    for (const type of ['input', 'change', 'punica-input', 'punica-change']) {
      this.addEventListener(type, () => this.#later());
    }
  }

  connected() {
    // A reset of the owning form clears what the field was showing.
    const form = this.closest('form');
    if (form) {
      this.listen(form, 'reset', () => {
        this.#touched = false;
        this.#later();
      });
    }
  }

  /**
   * The control in the default slot.
   * @returns {any}
   */
  get control() {
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    return slot.assignedElements({ flatten: true })[0] || null;
  }

  update() {
    const control = this.control;
    const labelSlot = this.$('slot[name=label]');
    const helpSlot = this.$('slot[name=help]');
    this.$('.label-text').textContent = this.label ?? '';
    this.$('.help-text').textContent = this.help ?? '';
    this.$('.label').hidden = !this.label && !labelSlot.assignedNodes().length;
    this.$('.help').hidden = !this.help && !helpSlot.assignedNodes().length;

    const required = this.required || !!control?.required;
    this.$('.required').hidden = !required;
    this.toggleState('required', required);

    this.#name(control);
    this.#refresh();
  }

  /** Gives the control the field's label as its name, if it has none. */
  #name(control) {
    if (this.#named && this.#named !== control) this.#named = null;
    if (!control) return;
    if (control.localName.includes('-') && !customElements.get(control.localName)) {
      // Not upgraded yet: it cannot say whether it has a name. Come back.
      customElements.whenDefined(control.localName).then(() => this.isConnected && this.update());
      return;
    }
    const label = this.label || this.$('slot[name=label]').assignedNodes().map((n) => n.textContent.trim()).join(' ') || null;
    if ('label' in control) {
      if (this.#named === control || !control.label) {
        if (label || this.#named === control) control.label = label;
        this.#named = label ? control : null;
      }
      return;
    }
    // A native control: name it the same way, unless something already does.
    const has = control.hasAttribute('aria-labelledby') || control.labels?.length;
    if (this.#named === control || (!has && !control.hasAttribute('aria-label'))) {
      if (label) control.setAttribute('aria-label', label);
      else control.removeAttribute('aria-label');
      this.#named = label ? control : null;
    }
  }

  /** Shows `error`, or the control's own message once it was touched. */
  #refresh() {
    const control = this.control;
    let message = this.error || '';
    if (!message && this.#touched && control?.validity && !control.validity.valid) {
      message = control.validationMessage || '';
    }
    const box = this.$('.error');
    if (box.textContent !== message) box.textContent = message;
    box.hidden = !message;
    this.toggleState('invalid', !!message);
    this.#describe(control, message);
  }

  /**
   * Gives the control the field's help and error as its description, read
   * after its name, unless it has one of its own.
   */
  #describe(control, message) {
    if (this.#described && this.#described !== control) this.#described = null;
    if (!control) return;
    const help = this.help || this.$('slot[name=help]').assignedNodes().map((n) => n.textContent.trim()).join(' ');
    const text = [help, message].filter(Boolean).join(' ') || null;
    if ('description' in control) {
      if (this.#described === control || !control.description) {
        if (text || this.#described === control) control.description = text;
        this.#described = text ? control : null;
      }
      return;
    }
    // A native control: the same, through its attribute.
    if (this.#described === control || !control.hasAttribute('aria-description')) {
      if (text) control.setAttribute('aria-description', text);
      else if (this.#described === control) control.removeAttribute('aria-description');
      this.#described = text ? control : null;
    }
  }

  /** Refreshes after the control has brought its validity up to date. */
  #later() {
    Promise.resolve()
      .then(() => undefined)
      .then(() => {
        if (this.isConnected) this.update();
      });
  }
}

define('punica-field', PunicaField);
