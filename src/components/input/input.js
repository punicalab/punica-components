(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="startAdornment"></slot>
    <input />
    <slot name="endAdornment"></slot>
    <style></style>
  `;

  class Input extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #input = null;

    /**
     *
     */
    get tabindex() {
      return this.getAttribute('tabindex');
    }

    /**
     *
     */
    set tabindex(val) {
      this.setAttribute('tabindex', val);
    }

    /**
     *
     */
    get readonly() {
      return this.getAttribute('readonly');
    }

    /**
     *
     */
    set readonly(val) {
      this.setAttribute('readonly', val);
    }

    /**
     *
     */
    get rounded() {
      return this.getAttribute('rounded') == 'true';
    }

    /**
     *
     */
    set rounded(val) {
      this.setAttribute('rounded', val);
    }

    /**
     *
     */
    get placeholder() {
      return this.getAttribute('placeholder');
    }

    /**
     *
     */
    set placeholder(val) {
      this.setAttribute('placeholder', val);
    }

    /**
     *
     */
    get error() {
      return this.getAttribute('error') == 'true';
    }

    /**
     *
     */
    set error(val) {
      this.setAttribute('error', val);
    }

    /**
     *
     */
    get type() {
      return this.getAttribute('type') || 'text';
    }

    /**
     *
     */
    set type(val) {
      this.setAttribute('type', val);
    }

    /**
     *
     */
    get fullwidth() {
      return this.getAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(val) {
      this.setAttribute('fullwidth', val);
    }

    /**
     *
     */
    get disabled() {
      return this.getAttribute('disabled');
    }

    /**
     *
     */
    set disabled(val) {
      this.setAttribute('disabled', val);
    }

    /**
     *
     */
    get startadornment() {
      return this.getAttribute('startadornment');
    }

    /**
     *
     */
    set startadornment(val) {
      this.setAttribute('startadornment', val);
    }

    /**
     *
     */
    get endadornment() {
      return this.getAttribute('endadornment');
    }

    /**
     *
     */
    set endadornment(val) {
      this.setAttribute('endadornment', val);
    }

    /**
     *
     */
    get value() {
      return this.getAttribute('value');
    }

    /**
     *
     */
    set value(val) {
      this.setAttribute('value', val);
    }

    /**
     *
     */
    get size() {
      return this.getAttribute('size');
    }

    /**
     *
     */
    set size(val) {
      this.setAttribute('size', val);
    }

    /**
     *
     */
    get maxlength() {
      return this.getAttribute('maxlength');
    }

    /**
     *
     */
    set maxlength(val) {
      this.setAttribute('maxlength', val);
    }

    /**
     *
     */
    get minlength() {
      return this.getAttribute('minlength');
    }

    /**
     *
     */
    set minlength(val) {
      this.setAttribute('minlength', val);
    }

    /**
     *
     */
    inputFocus = () => {
      if (!this.error) {
        this.setAttribute('focus', true);
        this.#input.focus();
      }
    };

    /**
     *
     * @param {*} e
     */
    inputMouseDown = (e) => {
      e.target.focus();
      e.stopPropagation();
      this.fireOnFocus();

      if (!this.error) {
        this.setAttribute('focus', true);
      }
    };

    /**
     *
     */
    inputBlur = () => {
      this.fireOnBlur();
      this.removeAttribute('focus');
    };

    /**
     *
     */
    inputChange = (e) => {
      this.value = this.#input.value;
      this.fireOnChange();

      e.stopPropagation();
    };

    /**
     *
     */
    inputOnKeyDown = (e) => {
      this.dispatchEvent(
        new CustomEvent('keydown', {
          detail: {
            key: e.key
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );

      e.stopImmediatePropagation();
    };

    /**
     *
     */
    fireOnBlur() {
      this.dispatchEvent(
        new CustomEvent('blur', {
          detail: {
            value: this.#input.value
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     */
    fireOnFocus() {
      this.dispatchEvent(
        new CustomEvent('focus', {
          detail: {
            value: this.#input.value
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     */
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('input', {
          detail: {
            value: this.value
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'size',
        'placeholder',
        'fullwidth',
        'disabled',
        'error',
        'startadornment',
        'endadornment',
        'minlength',
        'maxlength',
        'value',
        'type',
        'inputmode',
        'pattern',
        'tabindex'
      ];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#input = this.#shadow.querySelector('input');

      this.#input.focus();
    }

    /**
     *
     */
    connectedCallback() {
      this.#input.addEventListener('mousedown', this.inputMouseDown);
      this.#input.addEventListener('focus', this.inputMouseDown);
      this.#input.addEventListener('blur', this.inputBlur);
      this.#input.addEventListener('input', this.inputChange);
      this.#input.addEventListener('keydown', this.inputOnKeyDown);

      if (!this.size) {
        this.size = 'medium';
      }

      this.#input.disabled = this.disabled === 'true' || this.disabled === true;
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#input.removeEventListener('mousedown', this.inputMouseDown);
      this.#input.removeEventListener('focus', this.inputMouseDown);
      this.#input.removeEventListener('blur', this.inputBlur);
      this.#input.removeEventListener('input', this.inputChange);
      this.#input.removeEventListener('keydown', this.inputOnKeyDown);
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'value':
          this.#input.value = newValue;
          break;
        case 'type':
          this.#input.type = newValue || 'text';
          break;
        case 'inputmode':
          this.#input.inputmode = newValue;
          break;
        case 'pattern':
          this.#input.pattern = newValue;
          break;
        case 'maxlength':
          this.#input.maxLength = parseInt(newValue) || undefined;
          break;
        case 'minlength':
          this.#input.minlength = parseInt(newValue) || undefined;
          break;
        case 'disabled':
          this.#input.disabled = newValue === 'true' || newValue === true;
          break;
        case 'tabindex':
          if (newValue) {
            this.#input.setAttribute('tabindex', newValue);
          }
          break;
        case 'readonly':
          if (newValue) {
            this.#input.setAttribute('readonly', newValue);
          } else if (readonly) {
            this.#input.removeAttribute('readonly');
          }
          break;
        case 'placeholder':
          if (newValue) {
            this.#input.setAttribute('placeholder', newValue);
          } else {
            this.#input.removeAttribute('placeholder');
          }
          break;
      }
    }
  }

  customElements.define('punica-input', Input);
})();
