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
    get rowspacing() {
      return this.getAttribute('rowspacing') || this.spacing;
    }

    /**
     *
     */
    get columnspacing() {
      return this.getAttribute('columnspacing') || this.spacing;
    }

    /**
     *
     */
    get fullheight() {
      return this.getAttribute('fullheight');
    }

    /**
     *
     */
    get justifyitems() {
      return this.getAttribute('justifyitems') || 'inherit';
    }

    /**
     *
     */
    get justifycontent() {
      return this.getAttribute('justifycontent') || 'inherit';
    }

    /**
     *
     */
    get aligncontent() {
      return this.getAttribute('aligncontent') || 'inherit';
    }

    /**
     *
     */
    get alignitems() {
      return this.getAttribute('alignitems') || 'inherit';
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'wrap',
        'direction',
        'spacing',
        'rowspacing',
        'columnspacing',
        'justifyitems',
        'justifycontent',
        'aligncontent',
        'alignitems',
        'fullheight'
      ];
    }

    /**
     *
     */
    update() {
      this.#style.innerHTML = `
        :host{
          --row-spacing: ${this.rowspacing * 8 + 'px'};
          --column-spacing: ${this.columnspacing * 8 + 'px'};
          --align-items: ${this.alignitems};
          --align-content: ${this.aligncontent};
          --justify-items: ${this.justifyitems};
          --justify-content: ${this.justifycontent};
          --wrap: ${this.wrap};
          --direction: ${this.direction};
          --columns: 12;
        }

        :host > * {
          --parent-row-spacing: ${this.rowspacing * 8 + 'px'};
        }

        :host > * {
          --parent-column-spacing: ${this.columnspacing * 8 + 'px'};
        }

        :host > * {
          --parent-columns: var(--columns);
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
