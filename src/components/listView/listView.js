(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-row spacing="2">
      <slot></slot>
    </punica-row>
    <style></style>
  `;

  class ListView extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #observer;

    /**
     *
     */
    get enabledivider() {
      return this.getAttribute('enabledivider');
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
      return ['enabledivider'];
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

      this.#observer = new MutationObserver(() => {
        this.#processSlotItems(slot);
      });

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
      if (name === 'enabledivider') {
        const slot = this.#shadow.querySelector('slot');
        this.#processSlotItems(slot);
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
