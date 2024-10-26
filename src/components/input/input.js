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
    get fullWidth() {
      return this.getAttribute('fullWidth');
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
    get startAdornment() {
      return this.getAttribute('startAdornment');
    }

    /**
     *
     */
    get endAdornment() {
      return this.getAttribute('endAdornment');
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
      }
    };

    /**
     *
     * @param {*} e
     */
    inputMouseDown = (e) => {
      e.target.focus();
      e.stopPropagation();

      if (!this.error) {
        this.setAttribute('focus', true);
      }
    };

    /**
     *
     */
    inputBlur = () => {
      this.removeAttribute('focus');
    };

    /**
     *
     */
    inputChange = (e) => {
      this.fireOnChange();

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
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('onChange', {
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
        'fullWidth',
        'disabled',
        'error',
        'startAdornment',
        'endAdornment',
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
