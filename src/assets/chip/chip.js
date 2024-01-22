(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <slot name="delete"></slot>
    <style>@import "http://localhost:5008/assets/chip/chip.css";</style>
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
    get variant() {
      return this.getAttribute('variant');
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
    get badgeContent() {
      const badgeContent = this.getAttribute('badgeContent');

      if (badgeContent) {
        return parseInt(badgeContent);
      }

      return 0;
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
