(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Toolbar extends HTMLElement {
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
    set variant(val) {
      this.setAttribute('variant', val);
    }

    /**
     *
     */
    get disableGutters() {
      return this.getAttribute('disableGutters');
    }

    /**
     *
     */
    set disableGutters(val) {
      return this.setAttribute('disableGutters', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'disableGutters'];
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
      this.setAttribute('role', 'div');

      if (!this.variant) {
        this.variant = 'regular';
      }
    }
  }

  customElements.define('punica-toolbar', Toolbar);
})();
