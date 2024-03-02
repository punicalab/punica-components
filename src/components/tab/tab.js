(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/tab/tab.css";</style>
  `;

  class Tab extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #selected = null;

    /**
     *
     */
    get orientation() {
      return this.getAttribute('orientation');
    }

    /**
     *
     */
    get fullWidth() {
      return this.getAttribute('fullWidth');
    }

    /**
     *
     */
    get disabled() {
      return this.getAttribute('disabled');
    }

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
      return ['fullWidth', 'disabled', 'value', 'orientation'];
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
      if (this.#selected) {
        this.#selected.selected = false;
      }

      this.#selected = event.target;
      this.#selected.selected = true;
      this.value = this.#selected.value;

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
    itemAdd(item) {
      item.addEventListener('click', this.onClickItemHandler);
    }

    /**
     *
     * @param {*} item
     */
    itemRemove(item) {
      item.removeEventListener('click', this.onClickItemHandler);
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'value':
          if (this.#selected && this.#selected.value == newValue) {
            return;
          }

          if (newValue) {
            const nodelist = this.childNodes;
            const n = nodelist.length;
            let i;

            for (i = 0; i < n; i++) {
              const item = nodelist[i];

              if (item.value == newValue) {
                this.#selected = item;
                this.#selected.selected = true;
                this.value = this.#selected.value;
              }
            }
          }
          break;
      }
    }
  }

  customElements.define('punica-tab', Tab);
})();
