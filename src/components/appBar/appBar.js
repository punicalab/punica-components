(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class AppBar extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get color() {
      return this.getAttribute('color') || 'primary';
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
    get position() {
      return this.getAttribute('position') || 'fixed';
    }

    /**
     *
     */
    set position(val) {
      this.setAttribute('position', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'position'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     */
    connectedCallback() {
      this.setAttribute('role', 'header');
    }
  }

  customElements.define('punica-app-bar', AppBar);
})();
