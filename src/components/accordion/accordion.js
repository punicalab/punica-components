(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Accordion extends PunicaBase {
    static get booleanAttributes() {
      return ['rounded', 'expanded'];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #summary = null;

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
    get expanded() {
      return this.hasAttribute('expanded');
    }

    /**
     *
     */
    set expanded(value) {
      if (value) {
        this.setAttribute('expanded', '');
      } else {
        this.removeAttribute('expanded');
      }
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['expanded', 'rounded'];
    }

    /**
     *
     */
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('changeExpanded', {
          detail: {
            expanded: this.expanded
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
    handleSummaryClick = () => {
      this.expanded = !this.expanded;
      this.#shadow.host.setAttribute('aria-expanded', this.expanded);

      this.fireOnChange();
    };

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     * @param {*} summary
     */
    addSummary(summary) {
      this.#summary = summary;
      this.#summary.addEventListener('click', this.handleSummaryClick);
    }

    /**
     *
     */
    connectedCallback() {
      super.connectedCallback();

      if (this.getAttribute('expanded') === null) this.expanded = false;
      if (this.getAttribute('rounded') === null) this.rounded = false;
    }

    /**
     *
     */
    disconnectedCallback() {
      if (this.#summary) {
        this.#summary.removeEventListener('click', this.handleSummaryClick);
        this.#summary = null;
      }
    }
  }

  customElements.define('punica-accordion', Accordion);
})();
