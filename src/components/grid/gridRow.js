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
    set wrap(val) {
      this.setAttribute('wrap', val);
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
    set direction(val) {
      this.setAttribute('direction', val);
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
    set spacing(val) {
      this.setAttribute('spacing', val);
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
    set rowspacing(val) {
      this.setAttribute('rowspacing', val);
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
    set columnspacing(val) {
      this.setAttribute('columnspacing', val);
    }

    /**
     *
     */
    get fullheight() {
      return this.hasAttribute('fullheight');
    }

    /**
     *
     */
    set fullheight(value) {
      if (value) {
        this.setAttribute('fullheight', '');
      } else {
        this.removeAttribute('fullheight');
      }
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
    set justifyitems(val) {
      this.setAttribute('justifyitems', val);
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
    set justifycontent(val) {
      this.setAttribute('justifycontent', val);
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
    set aligncontent(val) {
      this.setAttribute('aligncontent', val);
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
    set alignitems(val) {
      this.setAttribute('alignitems', val);
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
