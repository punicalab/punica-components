/**
 * FormControl: makes a component a real form control.
 *
 * The control takes part in `<form>` submission, reset, `<fieldset disabled>`,
 * constraint validation, `<label>` and session restore, through
 * ElementInternals. A control built on it:
 *
 *  - declares its own `value` (or `checked`) property;
 *  - calls `this.setFormValue(value)` and `this.setValidity(...)` from
 *    `update()`;
 *  - implements `formReset()` to go back to its default and
 *    `formRestore(state)` to take a restored value;
 *  - reads `this.isDisabled`, which is true for its own `disabled` and for a
 *    disabled fieldset around it.
 *
 * @template {new (...args: any[]) => import('./element.js').PunicaElement} T
 * @param {T} Base
 */
export const FormControl = (Base) =>
  class FormControlElement extends Base {
    static formAssociated = true;

    static properties = {
      /** Name the value is submitted under. */
      name: {},
      /** The control takes no input and submits nothing. */
      disabled: { type: Boolean },
      /** A value is needed before the form submits. */
      required: { type: Boolean }
    };

    #formDisabled = false;
    #customError = '';

    /** True for the control's own `disabled` or a disabled fieldset. */
    get isDisabled() {
      return this.disabled || this.#formDisabled;
    }

    /** @returns {HTMLFormElement | null} */
    get form() {
      return this.internals.form;
    }
    /** @returns {NodeList} */
    get labels() {
      return this.internals.labels;
    }
    /** @returns {ValidityState} */
    get validity() {
      return this.internals.validity;
    }
    get validationMessage() {
      return this.internals.validationMessage;
    }
    get willValidate() {
      return this.internals.willValidate;
    }
    checkValidity() {
      return this.internals.checkValidity();
    }
    reportValidity() {
      return this.internals.reportValidity();
    }

    /**
     * Sets a custom error; an empty string clears it.
     * @param {string} message
     */
    setCustomValidity(message) {
      this.#customError = message || '';
      if (this.isConnected) this.update(new Map());
    }

    /**
     * @param {File | string | FormData | null} value
     * @param {File | string | FormData | null} [state]
     */
    setFormValue(value, state) {
      this.internals.setFormValue(this.isDisabled ? null : value, state);
    }

    /**
     * Reports validity. A custom error set by `setCustomValidity` gives the
     * message, and its flag joins the others, as on a native control.
     * @param {ValidityStateFlags} [flags]
     * @param {string} [message]
     * @param {HTMLElement} [anchor] element the browser points its bubble at
     */
    setValidity(flags, message, anchor) {
      if (this.#customError) {
        // As a native control: the custom error is added to what is wrong
        // with the value (`badInput`, `valueMissing`, …), not put in its place.
        this.internals.setValidity(
          { ...(flags ? plainFlags(flags) : {}), customError: true },
          this.#customError,
          anchor
        );
      } else if (flags && Object.keys(plainFlags(flags)).length) {
        this.internals.setValidity(plainFlags(flags), message || ' ', anchor);
      } else {
        this.internals.setValidity({});
      }
      const invalid = !this.internals.validity.valid;
      this.toggleState('invalid', invalid);
      this.toggleState('valid', !invalid);
    }

    formDisabledCallback(disabled) {
      this.#formDisabled = disabled;
      this.toggleState('disabled', this.isDisabled);
      if (this.isConnected) this.update(new Map([['disabled', this.disabled]]));
    }

    formResetCallback() {
      this.formReset();
    }

    formStateRestoreCallback(state) {
      this.formRestore(state);
    }

    /** Go back to the default value. */
    formReset() {}
    /** Take a value the browser restored. */
    // eslint-disable-next-line no-unused-vars
    formRestore(state) {}

    /**
     * Submits or resets the owning form the way a native button would.
     * @param {'submit' | 'reset'} type
     */
    formAction(type) {
      const form = this.form;
      if (!form) return;
      if (type === 'reset') form.reset();
      else form.requestSubmit();
    }
  };

/**
 * The set flags of a ValidityStateFlags object or of a native ValidityState,
 * whose flags live on the prototype, as a plain object.
 * @param {ValidityStateFlags | ValidityState} flags
 * @returns {ValidityStateFlags}
 */
function plainFlags(flags) {
  /** @type {Record<string, boolean>} */
  const out = {};
  for (const key in flags) {
    if (key !== 'valid' && flags[key] === true) out[key] = true;
  }
  return out;
}
