(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-row>
      <slot></slot>
    </punica-row>
    <style></style>
  `;

  class ListView extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #observer;
    #row;

    /**
     *
     */
    get enabledivider() {
      return this.getAttribute('enabledivider');
    }

    /**
     *
     */
    get spacing() {
      return this.getAttribute('spacing') || 2;
    }

    /**
     *
     */
    set enabledivider(val) {
      this.setAttribute('enabledivider', val);
    }

    /**
     */
    static get observedAttributes() {
      return ['enabledivider', 'spacing'];
    }

    /**
     * Constructor
     */
    constructor() {
      super();
    }

    /**
     *
     */
    connectedCallback() {
      this.#shadow.appendChild(template.content.cloneNode(true));

      const slot = this.#shadow.querySelector('slot');

      this.#row = this.#shadow.querySelector('punica-row');
      this.#observer = new MutationObserver(() => {
        this.#processSlotItems(slot);
      });

      this.#row.setAttribute('spacing', this.spacing);

      this.#observer.observe(slot, {
        childList: true,
        subtree: true
      });

      this.#processSlotItems(slot);
    }

    /**
     *
     */
    disconnectedCallback() {
      if (this.#observer) {
        this.#observer.disconnect();
      }
    }

    /**
     *
     */
    attributeChangedCallback(name) {
      if (!this.#row) return;

      if (name === 'enabledivider') {
        const slot = this.#shadow.querySelector('slot');
        this.#processSlotItems(slot);
      }

      if (name === 'spacing') {
        this.#row.setAttribute('spacing', this.spacing);
      }
    }

    /**
     *
     */
    #processSlotItems(slot) {
      if (!slot) {
        return;
      }

      const assignedNodes = slot
        .assignedNodes({ flatten: true })
        .filter((node) => node.nodeType === Node.ELEMENT_NODE);

      if (assignedNodes.length === 0) return;

      const container = slot.parentElement;

      container
        .querySelectorAll('punica-divider')
        .forEach((divider) => divider.remove());

      if (!this.hasAttribute('enabledivider')) return;

      assignedNodes.forEach((node, index) => {
        if (index > 0) {
          const divider = document.createElement('punica-divider');

          if (node.previousElementSibling?.tagName === 'PUNICA-DIVIDER') return;

          node.before(divider);
        }
      });
    }
  }

  customElements.define('punica-list-view', ListView);
})();
