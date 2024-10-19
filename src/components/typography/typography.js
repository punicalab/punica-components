(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  const defaultVariantLevelMapping = {
    headline1: '1',
    headline2: '2',
    headline3: '3',
    headline4: '4',
    headline5: '5',
    headline6: '6'
  };

  const defaultColorMapping = {
    primary: 'var(--primary-main)',
    secondary: 'var(--secondary-main)',
    error: 'var(--error-main)',
    warning: 'var(--warning-main)',
    info: 'var(--info-main)',
    success: 'var(--success-main)'
  };

  class Typography extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get variant() {
      return this.getAttribute('variant');
    }

    /**
     *
     */
    set variant(val) {
      this.setAttribute('variant', val);
    }

    /**
     *
     */
    get fontWeight() {
      return this.getAttribute('fontWeight');
    }

    /**
     *
     */
    get textAlign() {
      return this.getAttribute('textAlign');
    }

    /**
     *
     */
    get color() {
      return this.getAttribute('color');
    }

    /**
     *
     */
    get truncate() {
      return this.getAttribute('truncate');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'fontWeight', 'textAlign', 'color', 'truncate'];
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
      const areaLevel = defaultVariantLevelMapping[this.variant];

      if (this.variant == null) {
        this.variant = 'body1';
      }

      if (areaLevel) {
        this.setAttribute('role', 'heading');
        this.setAttribute('aria-level', areaLevel);
      }

      if (this.truncate) {
        const style = document.createElement('style');

        style.innerHTML = `
          :host{
            --typography-truncate: ${this.truncate};
          }
        `;

        this.#shadow.appendChild(style);
      }
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'color':
          if (newValue) {
            const isDefinedColor = defaultColorMapping[newValue];

            if (!isDefinedColor) {
              this.style.color = newValue;
            }
          }
          break;
      }
    }
  }

  customElements.define('punica-typography', Typography);
})();
