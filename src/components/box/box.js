(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Box extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get error() {
      return this.getAttribute('error');
    }

    /**
     *
     */
    set error(value) {
      this.setAttribute('error', value);
    }

    /**
     *
     */
    get fullwidth() {
      return this.getAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(value) {
      this.setAttribute('fullwidth', value);
    }

    /**
     *
     */
    get fullheight() {
      return this.getAttribute('fullheight');
    }

    /**
     *
     */
    set fullheight(value) {
      this.setAttribute('fullheight', value);
    }

    /**
     *
     */
    get border() {
      return this.getAttribute('border');
    }

    /**
     *
     */
    set border(value) {
      this.setAttribute('border', value);
    }

    /**
     *
     */
    get rounded() {
      const value = this.getAttribute('rounded');

      return value || true;
    }

    /**
     *
     */
    set rounded(value) {
      this.setAttribute('rounded', value);
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
      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-box', Box);
})();
