(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Container extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get maxwidth() {
      return this.getAttribute('maxwidth');
    }

    /**
     *
     */
    set maxwidth(val) {
      this.aetAttribute('maxwidth', val);
    }

    /**
     *
     */
    get disablegutters() {
      return this.getAttribute('disablegutters');
    }

    /**
     *
     */
    set disablegutters(val) {
      return this.setAttribute('disablegutters', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['maxwidth', 'disablegutters'];
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
