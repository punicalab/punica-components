(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <textarea></textarea>
    <style>@import "http://localhost:5008/assets/textarea/textarea.css";</style>
  `;

  class Textarea extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #textarea = null;

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
      this.dispatchEvent(
        new CustomEvent('onChange', {
          detail: {
            value: this.#textarea.value
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
        'fullWidth',
        'disabled',
        'error',
        'startAdornment',
        'endAdornment',
        'value'
      ];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#textarea = this.#shadow.querySelector('textarea');
      this.#textarea.rows = this.rows;
    }

    /**
     *
     */
    connectedCallback() {
      this.#textarea.addEventListener('focus', this.textareaFocus);
      this.#textarea.addEventListener('blur', this.textareaBlur);
      this.#textarea.addEventListener('input', this.textareaChange);

      this.#textarea.value = this.value;

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
