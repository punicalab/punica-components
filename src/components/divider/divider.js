(function () {
  const template = document.createElement('template');

  template.innerHTML = `<style></style>`;

  class Divider extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get orientation() {
      return this.getAttribute('orientation');
    }

    /**
     *
     */
    set orientation(val) {
      this.setAttribute('orientation', val);
    }

    /**
     *
     */
    get flexItem() {
      return this.hasAttribute('flexItem');
    }

    /**
     *
     */
    set flexItem(value) {
      if (value) {
        this.setAttribute('flexItem', '');
      } else {
        this.removeAttribute('flexItem');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['orientation', 'flexItem'];
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
      if (!this.orientation) {
        this.orientation = 'horizontal';
      }
    }
  }

  customElements.define('punica-divider', Divider);
})();
