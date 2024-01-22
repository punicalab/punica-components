(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/singleSelectList/singleSelectList.css";</style>
  `;

  class SingleSelectList extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #selected = null;

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
    onClickItemHandler = (event) => {
      if (this.#selected) {
        this.#selected.selected = false;
      }

      this.#selected = event.target;
      this.#selected.selected = true;
      this.value = this.#selected.value;

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
