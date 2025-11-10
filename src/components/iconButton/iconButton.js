(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class IconButton extends PunicaBase {
    static get booleanAttributes() {
      return ['disabled', 'loading'];
    }
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get color() {
      return this.getAttribute('color');
    }

    /**
     *
     */
    set color(val) {
      this.setAttribute('color', val);
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
    }

    /**
     *
     */
    get loading() {
      return this.hasAttribute('loading');
    }

    /**
     *
     */
    set loading(value) {
      if (value) {
        this.setAttribute('loading', '');
      } else {
        this.removeAttribute('loading');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'loading', 'disabled'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      if (!this.size) {
        this.size = 'medium';
      }

      this.setAttribute('role', 'button');
    }

    /**
     *
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (this.normalizeBooleanAttributeIfNeeded(name, newValue)) {
        this.updateComponent();
        return;
      }

      this.updateComponent();
    }

    /**
     * Update component styles based on attributes
     * and properties.
     */
    updateComponent() {
      if (this.disabled) {
        this.style.pointerEvents = 'none';
        this.style.opacity = '0.5';
      } else {
        this.style.pointerEvents = 'auto';
        this.style.opacity = '1';
      }

      if (this.loading) {
        this.style.pointerEvents = 'none';
      }

      if (this.color) {
        this.style.setProperty('--icon-color', this.color);
      }
    }
  }

  customElements.define('punica-icon-button', IconButton);
})();
