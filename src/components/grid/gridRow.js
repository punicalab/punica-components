(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class GridRow extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #style = null;

    /**
     *
     */
    get wrap() {
      return this.getAttribute('wrap') || 'wrap';
    }

    /**
     *
     */
    get direction() {
      return this.getAttribute('direction') || 'row';
    }

    /**
     *
     */
    get spacing() {
      return this.getAttribute('spacing') || 0;
    }

    /**
     *
     */
    get gap() {
      return this.getAttribute('gap') || 0;
    }

    /**
     *
     */
    get fullHeight() {
      return this.getAttribute('fullHeight');
    }

    /**
     *
     */
    get justifyItems() {
      return this.getAttribute('justifyItems') || 'inherit';
    }

    /**
     *
     */
    get justifyContent() {
      return this.getAttribute('justifyContent') || 'inherit';
    }

    /**
     *
     */
    get alignContent() {
      return this.getAttribute('alignContent') || 'inherit';
    }

    /**
     *
     */
    get alignItems() {
      return this.getAttribute('alignItems') || 'inherit';
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'wrap',
        'direction',
        'spacing',
        'gap',
        'justifyItems',
        'justifyContent',
        'alignContent',
        'alignItems',
        'fullHeight'
      ];
    }

    /**
     *
     */
    update() {
      this.#style.innerHTML = `
        :host{
          --gap: ${this.gap};
          --spacing: ${this.spacing ? this.spacing + 'px' : 0};
          --align-items: ${this.alignItems};
          --align-content: ${this.alignContent};
          --justify-items: ${this.justifyItems};
          --justify-content: ${this.justifyContent};
          --wrap: ${this.wrap};
          --direction: ${this.direction};
          --columns: 12;
        }
      `;
    }

    /**
     *
     */
    constructor() {
      super();

      const clone = template.content.cloneNode(true);

      this.#shadow.appendChild(clone);
      this.#style = document.createElement('style');

      this.#shadow.appendChild(this.#style);
    }

    /**
     *
     */
    connectedCallback() {
      this.update();
    }

    /**
     *
     */
    attributeChangedCallback() {
      this.update();
    }
  }

  customElements.define('punica-row', GridRow);
})();
