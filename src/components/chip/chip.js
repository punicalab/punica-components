(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <slot name="delete"></slot>
    <style></style>
  `;

  class Chip extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get color() {
      return this.getAttribute('color');
    }

    /**
     *
     */
    set color(value) {
      this.setAttribute('color', value);
    }

    /**
     *
     */
    get variant() {
      return this.getAttribute('variant');
    }

    /**
     *
     */
    set variant(value) {
      this.setAttribute('variant', value);
    }

    /**
     *
     */
    get size() {
      return this.getAttribute('size');
    }

    /**
     *
     */
    set size(value) {
      this.setAttribute('size', value);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'size', 'color'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-chip', Chip);
})();
