(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class ButtonGroup extends PunicaBase {
    static get booleanAttributes() {
      return ['disabled', 'fullwidth'];
    }
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
      return this.hasAttribute('disabled');
    }

    /**
     *
     */
    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     *
     */
    get fullwidth() {
      return this.hasAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(value) {
      if (value) {
        this.setAttribute('fullwidth', '');
      } else {
        this.removeAttribute('fullwidth');
      }
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
        if (newAttributeType === null || newAttributeType === undefined) {
          child.removeAttribute(attribute);
        } else if (
          attributeValue === newAttributeType ||
          (newAttributeType === '' && this.hasAttribute(attribute))
        ) {
          child.classList.remove(attribute);
          child.setAttribute(attribute, newAttributeType);
        }
      });
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      this.setAttribute('role', 'group');

      this.applyNewStyle('disabled', this.disabled ? '' : null);
      this.applyNewStyle('fullwidth', this.fullwidth ? '' : null);
      this.applyNewStyle('color', this.color);
      this.applyNewStyle('size', this.size);
      this.applyNewStyle('variant', this.variant);
    }
  }

  customElements.define('punica-button-group', ButtonGroup);
})();
