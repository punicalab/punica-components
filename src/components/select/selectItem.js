(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class SelectItem extends PunicaBase {
    static get booleanAttributes() {
      return ['selected'];
    }
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
    set value(val) {
      this.setAttribute('value', val);
    }

    /**
     *
     */
    get selected() {
      return this.hasAttribute('selected');
    }

    /**
     *
     */
    set selected(value) {
      if (value) {
        this.setAttribute('selected', '');
      } else {
        this.removeAttribute('selected');
      }
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
      super.connectedCallback();

      if (this.parentElement.localName == 'punica-select') {
        this.parentElement.itemAdd(this);
      }
    }
  }

  customElements.define('punica-select-item', SelectItem);
})();
