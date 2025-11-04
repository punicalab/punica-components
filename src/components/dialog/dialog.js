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
      return this.hasAttribute('open');
    }

    /**
     *
     */
    set open(value) {
      if (value) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
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
      return this.hasAttribute('rounded');
    }

    /**
     *
     */
    set rounded(value) {
      if (value) {
        this.setAttribute('rounded', '');
      } else {
        this.removeAttribute('rounded');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['open', 'width', 'rounded'];
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
          if (newValue != null) {
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
