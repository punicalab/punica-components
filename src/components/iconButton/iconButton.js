(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class IconButton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

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
    get disabled() {
      return this.getAttribute('disabled');
    }

    /**
     *
     */
    set disabled(val) {
      this.setAttribute('disabled', val);
    }

    /**
     *
     */
    get loading() {
      return this.getAttribute('loading');
    }

    /**
     *
     */
    set loading(val) {
      this.setAttribute('loading', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'loading', 'disabled'];
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
      if (!this.size) {
        this.size = 'medium';
      }

      this.setAttribute('role', 'button');
    }
  }

  customElements.define('punica-icon-button', IconButton);
})();
