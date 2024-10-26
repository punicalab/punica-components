(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class ToggleButton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });


    /**
     *
     */
    get value() {
      return this.getAttribute('value');
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
    get disabled() {
      return this.getAttribute('disabled');
    }


    /**
     * 
     */
    get selected() {
      return this.hasAttribute('selected');
    }

    /**
     * 
     */
    set selected(value) {
      if (value) {
        this.setAttribute('selected', true);
      } else {
        this.removeAttribute('selected');
      }
    }


    toggle() {
      this.selected = !this.selected;
      this.fireOnChange();
    }

    /**
     *
     */
     fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            value: this.selected
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    
    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'disabled', 'selected', 'value'];
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
      if(this.disabled === null){
        this.addEventListener('click', this.toggle);
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      this.removeEventListener('click', this.toggle);
    }
    
    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
     attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'disabled':
          if(newValue){
            this.addEventListener('click', this.toggle);
          }
          else {
            this.removeEventListener('click');
          }
          break;
      }
    }


  }

  customElements.define('punica-toggle-button', ToggleButton);
})();
