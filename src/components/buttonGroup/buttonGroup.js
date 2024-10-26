(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class ButtonGroup extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'size', 'color', 'disabled', 'fullWidth'];
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
    get fullWidth() {
      return this.getAttribute('fullWidth') == 'true';
    }

    /**
     *
     * @param {*} children
     * @param {*} index
     * @returns
     */
    getButtonPositionClassName(children, index) {
      const isFirstButton = index === 0;
      const isLastButton = index === children.length - 1;

      if (isFirstButton && isLastButton) {
        return null;
      }

      if (isFirstButton) {
        return 'first-button';
      }

      if (isLastButton) {
        return 'last-button';
      }

      return 'middle-button';
    }

    /**
     *
     */
    applyButtonStyles() {
      const slot = this.#shadow.querySelector('slot');
      const children = slot.assignedElements();

      if (children.length > 0) {
        children.forEach((_, i) => {
          const className = this.getButtonPositionClassName(children, i);
          children[i].classList.add(className);
        });
      }
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
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     */
    connectedCallback() {
      this.applyButtonStyles();
      this.setAttribute('role', 'group');

      this.applyNewStyle('disabled', this.disabled ? 'true' : 'false');
      this.applyNewStyle('fullWidth', this.fullWidth ? 'true' : 'false');
      this.applyNewStyle('color', this.color);
      this.applyNewStyle('size', this.size);
      this.applyNewStyle('variant', this.variant);
    }
  }

  customElements.define('punica-button-group', ButtonGroup);
})();
