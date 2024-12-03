(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Container extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get maxWidth() {
      return this.getAttribute('maxWidth');
    }

    /**
     *
     */
    set maxWidth(val) {
      this.aetAttribute('maxWidth', val);
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
      return ['maxWidth', 'disableGutters'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-container', Container);
})();
