(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class MultiSelectList extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #selecteds = [];

    /**
     *
     */
    get value() {
      // virgülle ayrılmış string olarak expose et (backward compatibility)
      return Array.isArray(this.#selecteds) ? this.#selecteds.join(',') : '';
    }

    /**
     *
     */
    set value(val) {
      // hem string (csv/json) hem array destekle
      this.#selecteds = this.#normalizeToArray(val);
      this.#syncItemsSelection();
      this.setAttribute('value', this.value);
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
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'value' && oldVal !== newVal) {
        this.#selecteds = this.#normalizeToArray(newVal);
        this.#syncItemsSelection();
      }
    }

    /**
     *
     * @param {*} event
     */
    onClickItemHandler = (event) => {
      const itemDOM = event.currentTarget;
      const { value } = itemDOM;
      const index = this.#selecteds.indexOf(value);

      if (index == -1) {
        this.#selecteds.push(value);
        itemDOM.selected = true;
      } else {
        this.#selecteds.splice(index, 1);
        itemDOM.selected = false;
      }

      // attribute ile de senkron
      this.setAttribute('value', this.value);

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            value: this.value,
            selectedValues: [...this.#selecteds]
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
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
     * @param {*} raw
     * @returns {string[]}
     */
    #normalizeToArray(raw) {
      if (Array.isArray(raw)) {
        return raw.map((v) => String(v));
      }

      const str = raw == null ? '' : String(raw).trim();
      if (!str) return [];

      // JSON array desteği
      if (str.startsWith('[')) {
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
        } catch {
          // csv'ye düşsün
        }
      }

      // csv
      return str
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }

    /**
     *
     */
    #syncItemsSelection() {
      const selectedSet = new Set(this.#selecteds || []);
      const items = this.querySelectorAll('punica-multi-select-list-item');
      items.forEach((item) => {
        const val = item.value;
        item.selected = selectedSet.has(val);
      });
    }

    /**
     *
     * @param {*} item
     */
    itemAdded(item) {
      item.addEventListener('click', this.onClickItemHandler);

      // mevcut state'e göre yeni item'ın selected durumunu ayarla
      if (this.#selecteds && this.#selecteds.includes(item.value)) {
        item.selected = true;
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

  customElements.define('punica-multi-select-list', MultiSelectList);
})();
