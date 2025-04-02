(function () {
  const template = document.createElement('template');

  template.innerHTML = `
      <slot></slot>
      <div class="tooltip-text"></div>
      <style></style>
    `;

  class Tooltip extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return ['text'];
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

      const tooltip = this.#shadow.querySelector('.tooltip-text');

      tooltip.innerHTML = this.getAttribute('text') || '';
    }
  }

  customElements.define('punica-tooltip', Tooltip);
})();
