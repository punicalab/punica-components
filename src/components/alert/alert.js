(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Alert extends HTMLElement {
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
    set variant(value) {
      this.setAttribute('variant', value);
    }

    /**
     *
     */
    get severity() {
      return this.getAttribute('severity');
    }

    /**
     *
     */
    set severity(value) {
      this.setAttribute('severity', value);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'severity'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-alert', Alert);
})();
