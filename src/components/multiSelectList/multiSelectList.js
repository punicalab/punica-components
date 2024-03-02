(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/multiSelectList/multiSelectList.css";</style>
  `;

  class MultiSelectList extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #selecteds = null;

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
     * @param {*} event
     */
    onClickItemHandler = (event) => {
      if (this.#selecteds == null) {
        this.#selecteds = [];
      }

      const itemDOM = event.target;
      const { value } = itemDOM;
      const index = this.#selecteds.indexOf(value);

      if (index == -1) {
        this.#selecteds.push(value);
        itemDOM.selected = true;
      } else {
        this.#selecteds.splice(index, 1);
        itemDOM.selected = false;
      }

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

  customElements.define('punica-multi-select-list', MultiSelectList);
})();
