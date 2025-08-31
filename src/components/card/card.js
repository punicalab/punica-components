(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Card extends HTMLElement {
    #shadow = null;

    /**
     *
     */
    get fullwidth() {
      return this.getAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(val) {
      return this.setAttribute('fullwidth', val);
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
    set rounded(val) {
      this.setAttribute('rounded', val);
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
  }

  customElements.define('punica-card', Card);
})();
