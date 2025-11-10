(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Box extends PunicaBase {
    static get booleanAttributes() {
      return ['error', 'fullwidth', 'fullheight', 'border', 'rounded'];
    }
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get error() {
      return this.hasAttribute('error');
    }

    /**
     *
     */
    set error(value) {
      if (value) {
        this.setAttribute('error', '');
      } else {
        this.removeAttribute('error');
      }
    }

    /**
     *
     */
    get fullwidth() {
      return this.hasAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(value) {
      if (value) {
        this.setAttribute('fullwidth', '');
      } else {
        this.removeAttribute('fullwidth');
      }
    }

    /**
     *
     */
    get fullheight() {
      return this.hasAttribute('fullheight');
    }

    /**
     *
     */
    set fullheight(value) {
      if (value) {
        this.setAttribute('fullheight', '');
      } else {
        this.removeAttribute('fullheight');
      }
    }

    /**
     *
     */
    get border() {
      return this.hasAttribute('border');
    }

    /**
     *
     */
    set border(value) {
      if (value) {
        this.setAttribute('border', '');
      } else {
        this.removeAttribute('border');
      }
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
      return ['error', 'rounded', 'border', 'fullheight', 'fullwidth'];
    }

    /**
     *
     */
    constructor() {
      super();
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-box', Box);
})();
