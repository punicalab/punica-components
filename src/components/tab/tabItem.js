(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class TabItem extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #parent = null;

    /**
     *
     */
    get value() {
      return this.getAttribute('value');
    }

    /**
     *
     */
    get selected() {
      return this.getAttribute('selected');
    }

    /**
     *
     */
    set selected(val) {
      this.setAttribute('selected', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['value', 'selected'];
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
      if (this.parentElement.localName == 'punica-tab') {
        this.#parent = this.parentElement;
        this.#parent.itemAdd(this);
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      if (this.#parent) {
        this.#parent.itemRemove(this);
        this.#parent = null;
      }
    }
  }

  customElements.define('punica-tab-item', TabItem);
})();
