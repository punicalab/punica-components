(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class GridCol extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

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
    get xs() {
      return this.getAttribute('xs');
    }

    /**
     *
     */
    set xs(val) {
      this.setAttribute('xs', val);
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
    set sm(val) {
      this.setAttribute('sm', val);
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
    set md(val) {
      this.setAttribute('md', val);
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
    set lg(val) {
      this.setAttribute('lg', val);
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
    set xl(val) {
      this.setAttribute('xl', val);
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
    #cerateStyle() {
      const style = document.createElement('style');

      style.innerHTML = `
        ${
          this.xs
            ? `
            @media (min-width: 0) {
              :host{
                width: calc(100% * ${this.xs} / var(--parent-columns) - (var(--parent-columns) - ${this.xs}) * (var(--parent-column-spacing) / var(--parent-columns)))
              }
            }`
            : ``
        }
        ${
          this.sm
            ? `
            @media (min-width: 600px) {
              :host{
                width: calc(100% * ${this.sm} / var(--parent-columns) - (var(--parent-columns) - ${this.sm}) * (var(--parent-column-spacing) / var(--parent-columns)))
              }
            }`
            : ``
        }
        ${
          this.md
            ? `
            @media (min-width: 900px) {
              :host{
                width: calc(100% * ${this.md} / var(--parent-columns) - (var(--parent-columns) - ${this.md}) * (var(--parent-column-spacing) / var(--parent-columns)))
              }
            }`
            : ``
        }
        ${
          this.lg
            ? `
            @media (min-width: 1200px) {
              :host{
                width: calc(100% * ${this.lg} / var(--parent-columns) - (var(--parent-columns) - ${this.lg}) * (var(--parent-column-spacing) / var(--parent-columns)))
              }
            }`
            : ``
        }
        ${
          this.xl
            ? `
            @media (min-width: 1536px) {
              :host{
                width: calc(100% * ${this.xl} / var(--parent-columns) - (var(--parent-columns) - ${this.xl}) * (var(--parent-column-spacing) / var(--parent-columns)))
              }
            }`
            : ``
        }
      `;

      this.#shadow.appendChild(style);
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
          if (oldValue != newValue) {
            this.#cerateStyle();
          }
          break;
      }
    }

    /**
     *
     */
    connectedCallback() {
      this.#cerateStyle();
    }
  }

  customElements.define('punica-col', GridCol);
})();
