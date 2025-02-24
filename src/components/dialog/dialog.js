(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <dialog>
      <slot></slot>
    </dialog>
    <style></style>
  `;

  class Dialog extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #dialog = null;

    /**
     *
     */
    get open() {
      return this.getAttribute('open');
    }

    /**
     *
     */
    get width() {
      return this.getAttribute('width') || 440;
    }

    /**
     *
     */
    set width(val) {
      this.setAttribute('width', val);
    }

    /**
     *
     */
    get rounded() {
      const value = this.getAttribute('rounded');

      return value || true;
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['open', 'width'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));

      this.#dialog = this.#shadow.querySelector('dialog');
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'open':
          if (newValue == 'true') {
            this.#dialog.style.width = `${this.width}px`;
            this.#dialog.showModal();
          } else {
            this.#dialog.close();
          }
          break;
      }
    }
  }

  customElements.define('punica-dialog', Dialog);
})();
