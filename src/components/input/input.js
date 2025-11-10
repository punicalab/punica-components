(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="startAdornment"></slot>
    <input />
    <slot name="endAdornment"></slot>
    <style></style>
  `;

  class Input extends PunicaBase {
    static formAssociated = true;
    static get booleanAttributes() {
      return ['rounded', 'error', 'fullwidth', 'disabled'];
    }
    static get observedAttributes() {
      return [
        'size',
        'placeholder',
        'fullwidth',
        'disabled',
        'error',
        'rounded',
        'startadornment',
        'endadornment',
        'minlength',
        'maxlength',
        'value',
        'type',
        'inputmode',
        'pattern',
        'tabindex',
        'name',
        'readonly',
        'autocomplete'
      ];
    }

    #shadow = this.attachShadow({ mode: 'open' });
    #input = null;
    #internals = this.attachInternals();

    // ---- Attribute props ----
    get tabindex() {
      return this.getAttribute('tabindex');
    }
    set tabindex(val) {
      this.setAttribute('tabindex', val);
    }

    get readonly() {
      return this.getAttribute('readonly');
    }
    set readonly(val) {
      this.setAttribute('readonly', val);
    }

    get rounded() {
      return this.hasAttribute('rounded');
    }
    set rounded(value) {
      if (value) {
        this.setAttribute('rounded', '');
      } else {
        this.removeAttribute('rounded');
      }
    }

    get placeholder() {
      return this.getAttribute('placeholder');
    }
    set placeholder(val) {
      this.setAttribute('placeholder', val);
    }

    get error() {
      return this.hasAttribute('error');
    }
    set error(value) {
      if (value) {
        this.setAttribute('error', '');
      } else {
        this.removeAttribute('error');
      }
    }

    get type() {
      return this.getAttribute('type') || 'text';
    }
    set type(val) {
      this.setAttribute('type', val);
    }

    get fullwidth() {
      return this.hasAttribute('fullwidth');
    }
    set fullwidth(value) {
      if (value) {
        this.setAttribute('fullwidth', '');
      } else {
        this.removeAttribute('fullwidth');
      }
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    get startadornment() {
      return this.getAttribute('startadornment');
    }
    set startadornment(val) {
      this.setAttribute('startadornment', val);
    }

    get endadornment() {
      return this.getAttribute('endadornment');
    }
    set endadornment(val) {
      this.setAttribute('endadornment', val);
    }

    get value() {
      return this.getAttribute('value') ?? '';
    }
    set value(val) {
      if (val == null) val = '';
      this.setAttribute('value', val);
      if (this.#input && this.#input.value !== val) this.#input.value = val;

      this.#internals.setFormValue(val);
    }

    get size() {
      return this.getAttribute('size');
    }
    set size(val) {
      this.setAttribute('size', val);
    }

    get maxlength() {
      return this.getAttribute('maxlength');
    }
    set maxlength(val) {
      this.setAttribute('maxlength', val);
    }

    get minlength() {
      return this.getAttribute('minlength');
    }
    set minlength(val) {
      this.setAttribute('minlength', val);
    }

    get name() {
      return this.getAttribute('name') || '';
    }
    set name(val) {
      this.setAttribute('name', val);
    }

    get autocomplete() {
      return this.getAttribute('autocomplete') || '';
    }
    set autocomplete(val) {
      this.setAttribute('autocomplete', val);
    }

    // ---- Events ----
    inputFocus = () => {
      if (!this.error) {
        this.setAttribute('focus', '');
        this.#input.focus();
      }
    };

    inputMouseDown = (e) => {
      e.target.focus();
      e.stopPropagation();
      this.fireOnFocus();
      if (!this.error) this.setAttribute('focus', '');
    };

    inputBlur = () => {
      this.fireOnBlur();
      this.removeAttribute('focus');
    };

    inputChange = (e) => {
      const v = this.#input.value ?? '';
      if (this.value !== v) this.setAttribute('value', v);
      this.#internals.setFormValue(v);
      this.fireOnChange();
      e.stopPropagation();
    };

    inputOnKeyDown = (e) => {
      this.dispatchEvent(
        new CustomEvent('keydown', {
          detail: { key: e.key },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
      e.stopImmediatePropagation();
    };

    fireOnBlur() {
      this.dispatchEvent(
        new CustomEvent('blur', {
          detail: { value: this.#input.value },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    fireOnFocus() {
      this.dispatchEvent(
        new CustomEvent('focus', {
          detail: { value: this.#input.value },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    constructor() {
      super();
      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#input = this.#shadow.querySelector('input');
    }

    connectedCallback() {
      super.connectedCallback();

      this.#input.addEventListener('mousedown', this.inputMouseDown);
      this.#input.addEventListener('focus', this.inputMouseDown);
      this.#input.addEventListener('blur', this.inputBlur);
      this.#input.addEventListener('input', this.inputChange);
      this.#input.addEventListener('change', this.inputChange); // autofill bazı tarayıcılarda change tetikler

      if (!this.size) this.size = 'medium';

      // disabled/readonly
      this.#input.disabled = this.disabled;
      if (this.readonly) this.#input.setAttribute('readonly', this.readonly);

      // autocomplete pass-through
      if (this.autocomplete)
        this.#input.setAttribute('autocomplete', this.autocomplete);

      if (this.hasAttribute('type')) this.#input.type = this.type || 'text';
      if (this.hasAttribute('name')) this.#input.name = this.name;
      if (this.hasAttribute('placeholder'))
        this.#input.placeholder = this.placeholder || '';
      if (this.hasAttribute('maxlength'))
        this.#input.maxLength = parseInt(this.maxlength) || undefined;
      if (this.hasAttribute('minlength'))
        this.#input.minLength = parseInt(this.minlength) || undefined;

      queueMicrotask(() => {
        const current = this.#input.value ?? '';
        if (current && current !== this.value) {
          this.#internals.setFormValue(current);

          if (this.getAttribute('value') !== current)
            this.setAttribute('value', current);
        } else {
          this.#internals.setFormValue(this.value);
        }
      });
    }

    disconnectedCallback() {
      this.#input.removeEventListener('mousedown', this.inputMouseDown);
      this.#input.removeEventListener('focus', this.inputMouseDown);
      this.#input.removeEventListener('blur', this.inputBlur);
      this.#input.removeEventListener('input', this.inputChange);
      this.#input.removeEventListener('change', this.inputChange);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.#input) return;

      if (this.normalizeBooleanAttributeIfNeeded(name, newValue)) {
        return;
      }

      switch (name) {
        case 'value': {
          const v = newValue ?? '';
          if (this.#input.value !== v) this.#input.value = v;
          this.#internals.setFormValue(v);
          break;
        }
        case 'name':
          this.#input.name = newValue || '';
          break;
        case 'type':
          this.#input.type = newValue || 'text';
          break;
        case 'inputmode':
          this.#input.inputMode = newValue || '';
          break;
        case 'pattern':
          if (newValue != null) this.#input.setAttribute('pattern', newValue);
          else this.#input.removeAttribute('pattern');
          break;
        case 'maxlength':
          this.#input.maxLength = newValue ? parseInt(newValue) : undefined;
          break;
        case 'minlength':
          this.#input.minLength = newValue ? parseInt(newValue) : undefined;
          break;
        case 'disabled': {
          const on = newValue != null;
          this.#input.disabled = !!on;
          this.formDisabledCallback?.(!!on);
          break;
        }
        case 'tabindex':
          if (newValue != null) this.#input.setAttribute('tabindex', newValue);
          else this.#input.removeAttribute('tabindex');
          break;
        case 'readonly':
          if (newValue != null) this.#input.setAttribute('readonly', newValue);
          else this.#input.removeAttribute('readonly');
          break;
        case 'placeholder':
          if (newValue != null)
            this.#input.setAttribute('placeholder', newValue);
          else this.#input.removeAttribute('placeholder');
          break;
        case 'autocomplete':
          if (newValue != null)
            this.#input.setAttribute('autocomplete', newValue);
          else this.#input.removeAttribute('autocomplete');
          break;
      }
    }

    formAssociatedCallback(form) {}

    formDisabledCallback(disabled) {
      this.#input.disabled = !!disabled;
    }

    formResetCallback() {
      const v = this.getAttribute('value') ?? '';
      this.#input.value = v;
      this.#internals.setFormValue(v);
    }

    formStateRestoreCallback(state, mode) {
      const v = (typeof state === 'string' ? state : '') ?? '';
      this.#input.value = v;
      this.#internals.setFormValue(v);
    }

    get form() {
      return this.#internals.form;
    }
    get labels() {
      return this.#internals.labels;
    }
    get typeHidden() {
      return this.#internals.type;
    }
  }

  customElements.define('punica-input', Input);
})();
