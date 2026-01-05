(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style></style>
  `;

  class ListViewItem extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return [];
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
      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-list-view-item', ListViewItem);
})();
