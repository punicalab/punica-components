(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class CardHeader extends HTMLElement {
    #shadow = null;

    /**
     *
     */
    constructor() {
      super();

      this.#shadow = this.attachShadow({ mode: 'open' });
      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-card-header', CardHeader);
})();
