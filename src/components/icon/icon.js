(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Icon extends HTMLElement {
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
    get color() {
      return this.getAttribute('color');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['size', 'color'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-icon', Icon);
})();
