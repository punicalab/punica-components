(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class SelectItem extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get value() {
      return this.getAttribute('value') || '';
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
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     */
    connectedCallback() {
      if (this.parentElement.localName == 'punica-select') {
        this.parentElement.itemAdd(this);
      }
    }
  }

  customElements.define('punica-select-item', SelectItem);
})();
