(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Accordion extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #summary = null;

    /**
     *
     */
    get rounded() {
      return this.getAttribute('rounded') == 'true';
    }

    /**
     *
     */
    get expanded() {
      return this.getAttribute('expanded') == 'true';
    }

    /**
     *
     */
    set expanded(value) {
      this.setAttribute('expanded', value);
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
    disconnectedCallback() {
      if (this.#summary) {
        this.#summary.removeEventListener('click', this.handleSummaryClick);
        this.#summary = null;
      }
    }
  }

  customElements.define('punica-accordion', Accordion);
})();
