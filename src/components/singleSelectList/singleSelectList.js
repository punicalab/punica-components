(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class SingleSelectList extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #selectedItem = null;

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
    static get observedAttributes() {
      return ['value'];
    }

    /**
     *
     */
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            value: this.value
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     */
    onClickItemHandler = (event) => {
      if (this.#selectedItem) {
        this.#selectedItem.selected = false;
      }

      this.#selectedItem = event.target;
      this.#selectedItem.selected = true;
      this.value = this.#selectedItem.value;

      this.fireOnChange();
    };

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     * @param {*} item
     */
    itemAdded(item) {
      item.addEventListener('click', this.onClickItemHandler);
    }

    /**
     *
     * @param {*} item
     */
    itemRemoved(item) {
      item.removeEventListener('click', this.onClickItemHandler);
    }
  }

  customElements.define('punica-single-select-list', SingleSelectList);
})();
