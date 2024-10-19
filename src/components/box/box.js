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
    get fullWidth() {
      return this.getAttribute('fullWidth');
    }

    /**
     *
     */
    get fullHeight() {
      return this.getAttribute('fullHeight');
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
    get rounded() {
      const value = this.getAttribute('rounded');

      return value || true;
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['error', 'rounded', 'border', 'fullHeight', 'fullWidth'];
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
