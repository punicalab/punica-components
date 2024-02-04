(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="startAdornment"></slot>
    <input />
    <slot name="endAdornment"></slot>
    <style>@import "http://localhost:5008/assets/input/input.css";</style>
  `;

  class Input extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #input = null;

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
    inputChange = () => {
      this.fireOnChange();
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
    }

    /**
     *
     */
    connectedCallback() {
      this.#input.addEventListener('focus', this.inputFocus);
      this.#input.addEventListener('blur', this.inputBlur);
      this.#input.addEventListener('input', this.inputChange);

      this.#input.setAttribute('type', this.type);
      this.#input.value = this.value;

      if (this.placeholder) {
        this.#input.placeholder = this.placeholder;
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#input.removeEventListener('focus', this.inputFocus);
      this.#input.removeEventListener('blur', this.inputBlur);
      this.#input.removeEventListener('input', this.inputChange);
    }
  }

  customElements.define('punica-input', Input);
})();
