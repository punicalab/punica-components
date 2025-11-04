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
    get disablegutters() {
      return this.hasAttribute('disablegutters');
    }

    /**
     *
     */
    set disablegutters(value) {
      if (value) {
        this.setAttribute('disablegutters', '');
      } else {
        this.removeAttribute('disablegutters');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'disablegutters'];
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
