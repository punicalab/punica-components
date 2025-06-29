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
      if (val) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
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
        'minlength',
        'maxlength',
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

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.#textarea) return;

      switch (name) {
        case 'placeholder':
          this.#textarea.placeholder = newValue || '';
          break;
        case 'rows':
          this.#textarea.rows = parseInt(newValue) || 3;
          break;
        case 'maxlength':
          this.#textarea.maxLength = parseInt(newValue) || undefined;
          break;
        case 'minlength':
          this.#textarea.minlength = parseInt(newValue) || undefined;
          break;
        case 'disabled':
          this.#textarea.disabled = newValue != null;
          break;
        case 'value':
          this.#textarea.value = newValue || '';
          break;
      }
    }

    /**
     *
     */
    connectedCallback() {
      this.#textarea.addEventListener('focus', this.textareaFocus);
      this.#textarea.addEventListener('blur', this.textareaBlur);
      this.#textarea.addEventListener('input', this.textareaChange);
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
