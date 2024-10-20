(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class GridCol extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get xs() {
      return this.getAttribute('xs');
    }

    /**
     *
     */
    get sm() {
      return this.getAttribute('sm');
    }

    /**
     *
     */
    get md() {
      return this.getAttribute('md');
    }

    /**
     *
     */
    get lg() {
      return this.getAttribute('lg');
    }

    /**
     *
     */
    get xl() {
      return this.getAttribute('xl');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['xs', 'sm', 'md', 'lg', 'xl'];
    }

    /**
     *
     */
    constructor() {
      super();

      const clone = template.content.cloneNode(true);

      this.#shadow.appendChild(clone);
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'xs':
        case 'sm':
        case 'md':
        case 'lg':
        case 'xl':
          const style = document.createElement('style');

          style.innerHTML = `
            ${
              this.xs
                ? `
                @media (min-width: 0) {
                  :host{
                    width: calc(100% * ${newValue} / var(--columns));
                  }
                }`
                : ``
            }
            ${
              this.sm
                ? `
                @media (min-width: 600px) {
                  :host{
                    width: calc(100% * ${newValue} / var(--columns));
                  }
                }`
                : ``
            }
            ${
              this.md
                ? `
                @media (min-width: 900px) {
                  :host{
                    width: calc(100% * ${newValue} / var(--columns));
                  }
                }`
                : ``
            }
            ${
              this.lg
                ? `
                @media (min-width: 1200px) {
                  :host{
                    width: calc(100% * ${newValue} / var(--columns));
                  }
                }`
                : ``
            }
            ${
              this.xl
                ? `
                @media (min-width: 1536px) {
                  :host{
                    width: calc(100% * ${newValue} / var(--columns));
                  }
                }`
                : ``
            }
          `;

          this.#shadow.appendChild(style);
          break;
      }
    }
  }

  customElements.define('punica-col', GridCol);
})();
