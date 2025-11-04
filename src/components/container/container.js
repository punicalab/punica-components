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
      this.setAttribute('maxwidth', val);
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
