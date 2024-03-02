(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-dialog open="false">
      <punica-typography slot="content">
        <slot name="text" /> 
      </punica-typography>
      <punica-button slot="footer" variant="outlined">
        Cancel
      </punica-button>
      <punica-button slot="footer" color="error">
        Delete
      </punica-button>
    </punica-dialog>
  `;

  class DialogDelete extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #punicaDialog = null;

    /**
     *
     */
    get open() {
      return this.getAttribute('open');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['open'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));

      this.#punicaDialog = this.#shadow.querySelector('punica-dialog');
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
            this.#punicaDialog.setAttribute('open', true);
          } else {
            this.#punicaDialog.setAttribute('open', false);
          }
          break;
      }
    }
  }

  customElements.define('punica-dialog-delete', DialogDelete);
})();
