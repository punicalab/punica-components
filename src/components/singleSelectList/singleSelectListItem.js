(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/singleSelectList/singleSelectListItem.css";</style>
  `;

  class SingleSelectListItem extends HTMLElement {
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
      if (this.parentElement.localName == 'punica-single-select-list') {
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

  customElements.define('punica-single-select-list-item', SingleSelectListItem);
})();
