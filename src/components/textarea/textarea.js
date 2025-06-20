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
    set placeholder(val) {
      this.setAttribute('placeholder', val);
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
    set rows(val) {
      this.setAttribute('rows', val);
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
