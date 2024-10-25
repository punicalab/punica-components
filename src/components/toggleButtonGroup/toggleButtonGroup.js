(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class ToggleButtonGroup extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return ['value','size', 'color', 'disabled', 'fullWidth'];
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
    get size() {
      return this.getAttribute('size');
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
      return this.getAttribute('color');
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
    get fullWidth() {
      return this.getAttribute('fullWidth');
    }


    /**
     * 
     * @param {*} children 
     * @param {*} index 
     * @returns 
     */
    getButtonPositionClassName(children, index){
      const isFirstButton = index === 0;
      const isLastButton = index === children.length - 1;
  
      if (isFirstButton && isLastButton) {
        return null;
      }

      if (isFirstButton) {
        return 'first-button'
      }

      if (isLastButton) {
       return 'last-button'
      }

      return 'middle-button'
    };

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
          })

      };
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
    handleToggleButtonClick(event){
      const clickedButton = event.target.closest('punica-toggle-button');

      if (clickedButton.tagName.toLowerCase() === 'punica-toggle-button') {
        const selectedValue = clickedButton.getAttribute('value');
        this.value = selectedValue;

        this.dispatchEvent(new CustomEvent('toggle-button-click', {
          detail: { value: selectedValue },
          bubbles: true,
          composed: true
        }));

        this.updateSelectedButton(selectedValue);
      }
  };

    /**
     * 
     * @param {*} clickedButton 
     */
    updateSelectedButton(value) {
      const slot = this.#shadow.querySelector('slot');
      const buttons = slot.assignedElements();

      buttons.forEach((button) => {
        if (button.getAttribute('value') === value) {
          button.setAttribute('selected', true);
        } else {
          button.removeAttribute('selected');
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

      this.color = this.color || 'primary';
      this.applyNewStyle('color', this.color);

      this.size = this.size || 'medium';
      this.applyNewStyle('size', this.size);

      this.addEventListener('click', this.handleToggleButtonClick);

      if(this.value){
        this.updateSelectedButton(this.value)
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
