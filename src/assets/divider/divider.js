(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <style>@import "http://localhost:5008/assets/divider/divider.css";</style>
  `;

  class Divider extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

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

  customElements.define('punica-divider', Divider);
})();
