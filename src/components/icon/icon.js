(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Icon extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
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
    set size(val) {
      this.setAttribute('size', val);
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
    set color(val) {
      this.setAttribute('color', val);
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
