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

  class Typography extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
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
    get fontweight() {
      return this.getAttribute('fontweight');
    }

    /**
     *
     */
    set fontweight(val) {
      return this.setAttribute('fontweight', val);
    }

    /**
     *
     */
    get textalign() {
      return this.getAttribute('textalign');
    }

    /**
     *
     */
    set textalign(val) {
      return this.setAttribute('textalign', val);
    }

    /**
     *
     */
    get whitespace() {
      return this.getAttribute('whitespace');
    }

    /**
     *
     */
    set whitespace(val) {
      return this.setAttribute('whitespace', val);
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
    set color(val) {
      return this.setAttribute('color', val);
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
    set truncate(val) {
      return this.setAttribute('truncate', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'variant',
        'fontweight',
        'textalign',
        'whitespace',
        'color',
        'truncate'
      ];
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

            if (isDefinedColor) {
              this.style.color = isDefinedColor;
            } else {
              this.style.color = newValue;
            }
          }
          break;
      }
    }
  }

  customElements.define('punica-typography', Typography);
})();
