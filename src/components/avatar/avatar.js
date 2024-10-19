(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-typography color="white">
      <slot></slot>
    </punica-typography>
    <style></style>
  `;

  const defaultColorMapping = {
    error: 'var(--error-main)',
    warning: 'var(--warning-main)',
    info: 'var(--info-main)',
    success: 'var(--success-main)'
  };

  class Avatar extends HTMLElement {
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
    get color() {
      return this.getAttribute('color');
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

            if (!isDefinedColor) {
              this.style.backgroundColor = newValue;
            }
          }
          break;
      }
    }
  }

  customElements.define('punica-avatar', Avatar);
})();
