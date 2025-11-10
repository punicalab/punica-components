(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Card extends PunicaBase {
    static get booleanAttributes() {
      return ['fullwidth', 'rounded'];
    }
    #shadow = null;

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
      return ['fullwidth', 'rounded'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow = this.attachShadow({ mode: 'open' });
      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();
    }
  }

  customElements.define('punica-card', Card);
})();
