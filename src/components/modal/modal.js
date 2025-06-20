(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="backdrop"></div>
    <div class="modal">
      <slot></slot>
    </div>
    <style></style>
  `;

  class Modal extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #modal = null;
    #backdrop = null;

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
    set rounded(val) {
      this.setAttribute('rounded', val);
    }

    /**
     *
     */
    get open() {
      return this.getAttribute('open');
    }

    /**
     *
     */
    set open(val) {
      this.setAttribute('open', val);
    }

    /**
     *
     */
    get width() {
      return this.getAttribute('width');
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
    get height() {
      return this.getAttribute('height');
    }

    /**
     *
     */
    set height(val) {
      this.setAttribute('height', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['open', 'width', 'height', 'rounded'];
    }

    /**
     *
     */
    #fireOnClose() {
      this.dispatchEvent(
        new CustomEvent('close', {
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     * @param {*} e
     */
    #handleBackdropClick = (e) => {
      this.#fireOnClose();
    };

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#backdrop = this.#shadow.querySelector('.backdrop');
      this.#modal = this.#shadow.querySelector('.modal');
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
            this.#modal.style.width = this.width;
            this.#modal.style.height = this.height;

            this.#backdrop.addEventListener('click', this.#handleBackdropClick);
          } else {
            this.#backdrop.removeEventListener(
              'click',
              this.#handleBackdropClick
            );
          }
          break;
      }
    }
  }

  customElements.define('punica-modal', Modal);
})();
