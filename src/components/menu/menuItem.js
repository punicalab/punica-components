(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style></style>
  `;

  class MenuItem extends HTMLElement {
    #shadow;

    /**
     * Gets the value of the `value` attribute.
     */
    get value() {
      return this.getAttribute('value') || '';
    }

    /**
     * Sets the value of the `value` attribute.
     */
    set value(newValue) {
      this.setAttribute('value', newValue);
    }

    /**
     * Checks if the item is disabled.
     */
    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     * Enables or disables the item.
     */
    set disabled(isDisabled) {
      if (isDisabled) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     * Observed attributes for the component.
     */
    static get observedAttributes() {
      return ['disabled'];
    }

    /**
     * Constructor: initializes the shadow DOM and appends the template.
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
