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
      return this.#selectedItem ? this.#selectedItem.value : this.getAttribute('value') || '';
    }

    /**
     *
     */
    set value(val) {
      const strVal = val == null ? '' : String(val);
      this.setAttribute('value', strVal);
      this.#syncSelectedFromValue(strVal);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['value'];
    }

    /**
     *
     * @param {*} name
     * @param {*} oldVal
     * @param {*} newVal
     */
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'value' && oldVal !== newVal) {
        this.#syncSelectedFromValue(newVal);
      }
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
      const itemDOM = event.currentTarget;

      if (this.#selectedItem && this.#selectedItem !== itemDOM) {
        this.#selectedItem.selected = false;
      }

      this.#selectedItem = itemDOM;
      this.#selectedItem.selected = true;

      // attribute + iç state senkron
      this.setAttribute('value', this.#selectedItem.value);

      this.fireOnChange();
    };

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));

      this.setAttribute('role', 'listbox');
    }

    /**
     *
     * @param {string} value
     */
    #syncSelectedFromValue(value) {
      const strVal = value == null ? '' : String(value);
      const items = this.querySelectorAll(
        'punica-single-select-list-item, punica-multi-select-list-item'
      );

      this.#selectedItem = null;

      items.forEach((item) => {
        if (strVal && item.value === strVal) {
          item.selected = true;
          this.#selectedItem = item;
        } else {
          item.selected = false;
        }
      });
    }

    /**
     *
     * @param {*} item
     */
    itemAdded(item) {
      item.addEventListener('click', this.onClickItemHandler);

      // mevcut value'ya göre yeni item'ın seçimini senkronize et
      const currentValue = this.getAttribute('value') || '';
      if (currentValue && item.value === currentValue) {
        if (this.#selectedItem && this.#selectedItem !== item) {
          this.#selectedItem.selected = false;
        }
        item.selected = true;
        this.#selectedItem = item;
      }
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
