(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class ToggleButtonGroup extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get orientation() {
      return this.getAttribute('orientation') || 'horizontal';
    }

    /**
     *
     */
    set orientation(val) {
      this.setAttribute('orientation', val);
    }

    /**
     *
     */
    get value() {
      return this.getAttribute('value');
    }

    /**
     *
     */
    set value(val) {
      this.setAttribute('value', val);
    }

    /**
     *
     */
    get defaultvalue() {
      return this.getAttribute('defaultvalue');
    }

    /**
     *
     */
    set defaultvalue(val) {
      this.setAttribute('defaultvalue', val);
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
    set disabled(val) {
      this.setAttribute('disabled', val);
    }

    /**
     *
     */
    get fullwidth() {
      return this.getAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(val) {
      this.setAttribute('fullwidth', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'defaultvalue',
        'value',
        'size',
        'color',
        'disabled',
        'fullwidth, orientation'
      ];
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
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true
        })
      );
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
     * @param {*} event
     */
    handleToggleButtonClick(event) {
      const clickedButton = event.target.closest('punica-toggle-button');

      if (
        clickedButton &&
        clickedButton.tagName.toLowerCase() === 'punica-toggle-button'
      ) {
        const selectedvalue = clickedButton.getAttribute('value');

        if (this.defaultvalue) {
          if ((this.value = selectedvalue)) {
            this.value = this.defaultvalue;
          } else {
            this.value = selectedvalue;
          }
        } else {
          this.value = selectedvalue;
        }

        this.fireOnChange();
        this.updateSelectedButton();
      }
    }

    /**
     *
     * @param {*} clickedButton
     */
    updateSelectedButton() {
      const slot = this.#shadow.querySelector('slot');
      const buttons = slot.assignedElements();

      buttons.forEach((button) => {
        if (button.getAttribute('value') === this.value) {
          button.setAttribute('selected', true);
        } else {
          button.removeAttribute('selected');
        }
      });
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'value':
          if (oldValue != newValue) {
            this.value = newValue;

            this.updateSelectedButton();
          }
          break;
      }
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
      this.addEventListener('click', this.handleToggleButtonClick);

      if (!this.hasAttribute('orientation')) {
        this.setAttribute('orientation', 'horizontal');
      }

      if (this.value) {
        this.updateSelectedButton();
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      this.removeEventListener('click', this.handleToggleButtonClick);
    }
  }

  customElements.define('punica-toggle-button-group', ToggleButtonGroup);
})();
