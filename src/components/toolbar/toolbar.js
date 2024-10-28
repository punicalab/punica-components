(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Toolbar extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return [];
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
      }


  }

  customElements.define('punica-toolbar', Toolbar);
})();
