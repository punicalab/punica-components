(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Paper extends PunicaBase {
    static get booleanAttributes() {
      return ['rounded'];
    }
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get rounded() {
      return this.hasAttribute('rounded');
    }

    /**
     *
     */
    set rounded(value) {
      if (value) {
        this.setAttribute('rounded', '');
      } else {
        this.removeAttribute('rounded');
      }
    }

    /**
     *
     */
    get class() {
      return this.getAttribute('class');
    }

    /**
     *
     */
    set class(val) {
      this.setAttribute('class', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['rounded', 'class'];
    }

    /**
     *
     */
    constructor() {
      super();
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (this.normalizeBooleanAttributeIfNeeded(name, newValue)) {
        return;
      }

      switch (name) {
        case 'class':
          if (oldValue != newValue) {
            this.className = newValue;
          }
          break;
      }
    }
  }

  customElements.define('punica-paper', Paper);
})();

//elevation eklennecek
//https://mui.com/material-ui/react-paper/
