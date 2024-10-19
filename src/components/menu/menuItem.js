(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class MenuItem extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get disabled() {
      return this.getAttribute('disabled');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['disabled'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-menu-item', MenuItem);
})();
