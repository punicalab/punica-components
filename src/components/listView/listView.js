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
    #slotEl;
    #row;

    /**
     *
     */
    get enabledivider() {
      if (!this.hasAttribute('enabledivider')) {
        return false;
      }

      const value = this.getAttribute('enabledivider');

      if (value === '' || value?.toLowerCase() === 'true') {
        return true;
      }

      return false;
    }

    /**
     *
     */
    set enabledivider(val) {
      this.setAttribute('enabledivider', val);
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
    set spacing(val) {
      this.setAttribute('spacing', val);
    }

    /**
     */
    static get observedAttributes() {
      return ['enabledivider', 'spacing'];
    }

    /**
     *
     */
    #onSlotChange = () => {
      if (!this.#slotEl) return;

      const assigned = this.#slotEl
        .assignedElements({ flatten: true })
        .filter((el) => el.nodeType === Node.ELEMENT_NODE);

      assigned.forEach((el) => el.removeAttribute('data-divider'));

      if (!this.enabledivider) return;

      for (let i = 1; i < assigned.length; i++) {
        const el = assigned[i];
        el.setAttribute('data-divider', '');
      }
    };

    /**
     * Constructor
     */
    constructor() {
      super();
    }

    /**
     *
     */
    attributeChangedCallback(name) {
      if (!this.#row) return;

      if (name === 'spacing') {
        this.#row.setAttribute('spacing', this.spacing);
        this.style.setProperty('--list-view-spacing', `${this.spacing * 8}px`);
      }
    }

    /**
     *
     */
    connectedCallback() {
      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#slotEl = this.#shadow.querySelector('slot');

      this.#row = this.#shadow.querySelector('punica-row');
      this.#row.setAttribute('spacing', this.spacing);
      this.style.setProperty('--list-view-spacing', `${this.spacing * 8}px`);
      this.#slotEl.addEventListener('slotchange', this.#onSlotChange);

      this.#onSlotChange();
    }

    /**
     *
     */
    disconnectedCallback() {
      this.#slotEl.removeEventListener('slotchange', this.#onSlotChange);
    }
  }

  customElements.define('punica-list-view', ListView);
})();
