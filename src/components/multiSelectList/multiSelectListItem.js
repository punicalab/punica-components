(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class MultiSelectListItem extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #parent = null;

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
      if (this.parentElement.localName == 'punica-multi-select-list') {
        this.#parent = this.parentElement;
        this.#parent.itemAdded(this);
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      if (this.#parent) {
        this.#parent.itemRemoved(this);
        this.#parent = null;
      }
    }
  }

  customElements.define('punica-multi-select-list-item', MultiSelectListItem);
})();
