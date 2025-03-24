(function () {
  const template = document.createElement('template');

  template.innerHTML = `<textarea></textarea><style></style>`;

  class Textarea extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #textarea = null;

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
    get rows() {
      return this.getAttribute('rows') || 3;
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
    get value() {
      return this.getAttribute('value');
    }

    /**
     *
     */
    set value(data) {
      this.setAttribute('value', data);
    }

    /**
     *
     */
    textareaFocus = () => {
      if (!this.error) {
        this.setAttribute('focus', true);
      }
    };

    /**
     *
     */
    textareaBlur = () => {
      this.removeAttribute('focus');
    };

    /**
     *
     */
    textareaChange = () => {
      this.fireOnChange();
    };

    /**
     *
     */
    fireOnChange() {
      this.value = this.#textarea.value;

      this.dispatchEvent(
        new CustomEvent('change', {
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
        'placeholder',
        'rows',
        'fullwidth',
        'disabled',
        'error',
        'value',
        'rounded'
      ];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#textarea = this.#shadow.querySelector('textarea');
    }

    /**
     *
     */
    connectedCallback() {
      this.#textarea.addEventListener('focus', this.textareaFocus);
      this.#textarea.addEventListener('blur', this.textareaBlur);
      this.#textarea.addEventListener('input', this.textareaChange);

      this.#textarea.value = this.value;
      this.#textarea.rows = this.rows;

      if (this.placeholder) {
        this.#textarea.placeholder = this.placeholder;
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#textarea.removeEventListener('focus', this.textareaFocus);
      this.#textarea.removeEventListener('blur', this.textareaBlur);
      this.#textarea.removeEventListener('input', this.textareaChange);
    }
  }

  customElements.define('punica-textarea', Textarea);
})();
