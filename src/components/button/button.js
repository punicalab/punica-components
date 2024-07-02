(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="startIcon"></slot>
    <slot></slot>
    <slot name="endIcon"></slot>
    <style>@import "http://localhost:5008/assets/button/button.css";</style>
  `;

  class Button extends HTMLElement {
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
    set color(val) {
      this.setAttribute('color', val);
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
    set size(val) {
      this.setAttribute('size', val);
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
    set variant(val) {
      this.setAttribute('variant', val);
    }

    /**
     *
     */
    get fullWidth() {
      return this.getAttribute('fullWidth');
    }

    /**
     *
     */
    get disabled() {
      return this.hasAttribute('disabled');
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
    get underline() {
      return this.getAttribute('underline');
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'color',
        'size',
        'variant',
        'fullWidth',
        'loading',
        'underline',
        'disabled'
      ];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    /**
     *
     */
    connectedCallback() {
      if (!this.variant) {
        this.variant = 'filled';
      }

      if (!this.color) {
        this.color = 'primary';
      }

      if (!this.size) {
        this.size = 'medium';
      }

      this.setAttribute('role', 'button');
    }
  }

  customElements.define('punica-button', Button);
})();
