(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/paper/paper.css";</style>
  `;

  class Paper extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get rounded() {
      return this.getAttribute('rounded');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['rounded'];
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

  customElements.define('punica-paper', Paper);
})();
