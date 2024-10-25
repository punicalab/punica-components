(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class ToggleButton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });


    /**
     *
     */
    get value() {
      const value = this.getAttribute('value');
    
      return value;
    }
   

    /**
     *
     */
    get size() {
      const value = this.getAttribute('size');

      return value;
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
      this.addEventListener('click', this.toggle);

      if (this.parentElement.localName == 'punica-toggle-button-group') {
      }
    }

    /**
     *
     */
    disconnectedCallback() {
      this.removeEventListener('click', this.toggle);
    }


  }

  customElements.define('punica-toggle-button', ToggleButton);
})();
