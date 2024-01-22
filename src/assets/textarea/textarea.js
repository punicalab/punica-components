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
    inputFocus = () => {
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
    static get observedAttributes() {
      return [
        'placeholder',
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
    }

    /**
     *
     */
    connectedCallback() {
      this.#textarea.addEventListener('focus', this.inputFocus);
      this.#textarea.addEventListener('blur', this.inputBlur);

      if (this.placeholder) {
        this.#textarea.placeholder = this.placeholder;
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#textarea.removeEventListener('focus', this.inputFocus);
      this.#textarea.removeEventListener('blur', this.inputBlur);
    }
  }

  customElements.define('punica-textarea', Textarea);
})();
