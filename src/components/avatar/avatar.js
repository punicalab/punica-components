(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-typography color="white">
      <slot></slot>
    </punica-typography>
    <style></style>
  `;

  const defaultColorMapping = {
    primary: 'var(--primary-main)',
    secondary: 'var(--secondary-main)',
    error: 'var(--error-main)',
    warning: 'var(--warning-main)',
    info: 'var(--info-main)',
    success: 'var(--success-main)'
  };

  class Avatar extends PunicaBase {
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
    set variant(value) {
      this.setAttribute('variant', value);
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
    set color(value) {
      this.setAttribute('color', value);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'color'];
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
              this.style.backgroundColor = isDefinedColor;
            } else {
              this.style.backgroundColor = newValue;
            }
          }
          break;
      }
    }
  }

  customElements.define('punica-avatar', Avatar);
})();
