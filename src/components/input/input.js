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
    get error() {
      return this.getAttribute('error') == 'true';
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
    get fullwidth() {
      return this.getAttribute('fullwidth');
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
    get startadornment() {
      return this.getAttribute('startadornment');
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
      this.fireOnChange();
      this.value = this.#input.value;

      e.stopPropagation();
    };

    /**
     *
     */
    inputOnKeyDown = (e) => {
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
        new CustomEvent('change', {
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
    static get observedAttributes() {
      return [
        'size',
        'placeholder',
        'fullwidth',
        'disabled',
        'error',
        'startadornment',
        'endadornment',
        'value',
        'type'
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

      this.#input.setAttribute('type', this.type);
      this.#input.value = this.value;

      if (this.placeholder) {
        this.#input.placeholder = this.placeholder;
      }

      if (!this.size) {
        this.size = 'medium';
      }
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
  }

  customElements.define('punica-input', Input);
})();
