(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style></style>
  `;

  class MenuItem extends HTMLElement {
    #shadow;

    /**
     *
     */
    get value() {
      return this.getAttribute('value') || '';
    }

    /**
     *
     */
    set value(newValue) {
      this.setAttribute('value', newValue);
    }

    /**
     *
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     *
     */
    set disabled(isDisabled) {
      if (isDisabled) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['disabled', 'value'];
    }

    /**
     *
     */
    constructor() {
      super();
      this.#shadow = this.attachShadow({ mode: 'open' });
      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     * Lifecycle callback: called when an observed attribute changes.
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'disabled') {
        this.toggleAttribute('aria-disabled', this.disabled);
      }
    }

    /**
     * Lifecycle callback: called when the element is connected to the DOM.
     */
    connectedCallback() {
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'menuitem');
      }
    }
  }

  // Define the custom element
  customElements.define('punica-menu-item', MenuItem);
})();
