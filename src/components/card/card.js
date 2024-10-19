(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Card extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get fullWidth() {
      return this.getAttribute('fullWidth');
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
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-card', Card);
})();
