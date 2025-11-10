(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <input type="checkbox" />
    <label></label>
    <style></style>
  `;

  class Checkbox extends PunicaBase {
    static get booleanAttributes() {
      return ['checked', 'disabled'];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #input = null;

    /**
     *
     */
    get checked() {
      return this.hasAttribute('checked');
    }

    /**
     *
     */
    set checked(value) {
      this.removeAttribute('indeterminate');

      if (value) {
        this.setAttribute('checked', '');
      } else {
        this.removeAttribute('checked');
      }

      this.update();
    }

    /**
     *
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     *
     */
    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
      this.update();
    }

    /**
     *
     */
    get label() {
      return this.getAttribute('label');
    }

    /**
     *
     */
    set label(value) {
      this.setAttribute('label', value);
    }

    /**
     *
     */
    get indeterminate() {
      return this.getAttribute('indeterminate');
    }

    /**
     *
     */
    set indeterminate(value) {
      this.setAttribute('indeterminate', value);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['checked', 'label', 'indeterminate', 'disabled'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#input = this.#shadow.querySelector('input');

      this.addEventListener('click', this.handleClick);
    }

    /**
     *
     * @param {*} event
     * @returns
     */
    handleClick = (event) => {
      if (this.disabled) {
        event.preventDefault();
        return;
      }

      this.checked = !this.checked;

      this.fireOnChange();
    };

    /**
     *
     */
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            value: this.checked
          },
          bubbles: false,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      this.update();

      if (this.disabled) {
        this.#input.disabled = true;
      }
    }

    /**
     *
     */
    update() {
      const label = this.#shadow.querySelector('label');

      this.#input.setAttribute('indeterminate', this.indeterminate);

      if (this.checked) {
        this.#input.setAttribute('checked', '');
        this.#input.removeAttribute('indeterminate');
      } else {
        this.#input.removeAttribute('checked');
      }

      label.innerText = this.label;
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (this.normalizeBooleanAttributeIfNeeded(name, newValue)) {
        return;
      }

      switch (name) {
        case 'checked':
          if (this.checked) {
            this.#input.setAttribute('checked', '');
            this.#input.removeAttribute('indeterminate');
          } else {
            this.#input.removeAttribute('checked');
          }
          break;
        case 'disabled':
          if (newValue != null) {
            this.#input.disabled = true;
          } else {
            this.#input.disabled = false;
          }
          break;
      }
    }
  }

  customElements.define('punica-checkbox', Checkbox);
})();
