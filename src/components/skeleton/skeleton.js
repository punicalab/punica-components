(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Skeleton extends PunicaBase {
    static get booleanAttributes() {
      return ['rounded'];
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
    get width() {
      return this.getAttribute('width');
    }

    /**
     *
     */
    set width(val) {
      this.setAttribute('width', val);
    }

    /**
     *
     */
    get height() {
      return this.getAttribute('height');
    }

    /**
     *
     */
    set height(val) {
      this.setAttribute('height', val);
    }

    /**
     *
     */
    get rounded() {
      return this.hasAttribute('rounded');
    }

    /**
     *
     */
    set rounded(value) {
      if (value) {
        this.setAttribute('rounded', '');
      } else {
        this.removeAttribute('rounded');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'width', 'height', 'rounded'];
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

      const sheet = new CSSStyleSheet();

      sheet.replaceSync(
        `:host { 
          width: ${this.width}; 
          height: ${this.height}; 
        }`
      );

      this.#shadow.adoptedStyleSheets = [sheet];
    }
  }

  customElements.define('punica-skeleton', Skeleton);
})();
