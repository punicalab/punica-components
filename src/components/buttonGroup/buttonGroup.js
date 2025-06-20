(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class ButtonGroup extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'size', 'color', 'disabled', 'fullwidth'];
    }

    /**
     *
     */
    get size() {
      return this.getAttribute('size') || 'medium';
    }

    /**
     *
     */
    set size(val) {
      this.setAttribute('size', val);
    }

    /**
     *
     */
    get variant() {
      return this.getAttribute('variant') || 'outlined';
    }

    /**
     *
     */
    set variant(val) {
      this.setAttribute('variant', val);
    }

    /**
     *
     */
    get color() {
      return this.getAttribute('color') || 'primary';
    }

    /**
     *
     */
    set color(val) {
      this.setAttribute('color', val);
    }

    /**
     *
     */
    get disabled() {
      return this.hasAttribute('disabled') == 'true';
    }

    /**
     *
     */
    set disabled(val) {
      this.setAttribute('disabled', val);
    }

    /**
     *
     */
    get fullwidth() {
      return this.getAttribute('fullwidth') == 'true';
    }

    /**
     *
     */
    set fullwidth(val) {
      return this.getAttribute('fullwidth', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'variant', 'fullwidth', 'disabled'];
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
     * @param {*} attribute
     * @param {*} newAttributeType
     */
    applyNewStyle(attribute, newAttributeType) {
      const attributeValue = this.getAttribute(attribute);
      const slot = this.#shadow.querySelector('slot');
      const children = slot.assignedElements();

      children.forEach((child) => {
        if (attributeValue === newAttributeType) {
          child.classList.remove(attribute);
          child.setAttribute(attribute, newAttributeType);
        }
      });
    }

    /**
     *
     */
    connectedCallback() {
      this.setAttribute('role', 'group');

      this.applyNewStyle('disabled', this.disabled ? 'true' : 'false');
      this.applyNewStyle('fullwidth', this.fullwidth ? 'true' : 'false');
      this.applyNewStyle('color', this.color);
      this.applyNewStyle('size', this.size);
      this.applyNewStyle('variant', this.variant);
    }
  }

  customElements.define('punica-button-group', ButtonGroup);
})();
