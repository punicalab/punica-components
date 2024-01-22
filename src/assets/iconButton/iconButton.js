(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/iconButton/iconButton.css";</style>
  `;

  class IconButton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get color() {
      const value = this.getAttribute('color');

      return value;
    }

    /**
     *
     */
    get size() {
      const value = this.getAttribute('size');

      return value;
    }

    /**
     *
     */
    get disabled() {
      return this.getAttribute('disabled');
    }

    /**
     *
     */
    get loading() {
      return this.getAttribute('loading');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'loading', 'disabled'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }
  }

  customElements.define('punica-icon-button', IconButton);
})();
