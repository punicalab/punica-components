(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <dialog>
      <div class="modal-layout-main">
        <div class="modal-layout-header">
          <slot name="header"></slot>
        </div>
        <div class="modal-layout-content">
          <slot name="content"></slot>
        </div>
        <div class="modal-layout-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </dialog>
    <style>@import "http://localhost:5008/assets/modal/modal.css";</style>
  `;

  class Modal extends HTMLElement {
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
    static get observedAttributes() {
      return ['open'];
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
            this.#dialog.showModal();
          } else {
            this.#dialog.close();
          }
          break;
      }
    }
  }

  customElements.define('punica-modal', Modal);
})();
