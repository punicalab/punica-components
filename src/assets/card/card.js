(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="media"></slot>
    <slot name="content"></slot>
    <slot name="actions"></slot>
    <style>@import "http://localhost:5008/assets/card/card.css";</style>
  `;

  class Card extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get indeterminate() {
      return this.getAttribute('indeterminate');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['indeterminate'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-card', Card);
})();
