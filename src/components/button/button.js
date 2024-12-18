(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="startIcon"></slot>
    <slot></slot>
    <slot name="endIcon"></slot>
    <style></style>
  `;

  class Button extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get rounded() {
      return this.getAttribute('rounded') == 'true';
    }

    /**
     *
     */
    set rounded(val) {
      this.setAttribute('rounded', val);
    }

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
    get fullwidth() {
      return this.getAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(val) {
      return this.setAttribute('fullwidth', val);
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
    set disabled(val) {
      this.setAttribute('disabled', val);
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
    set loading(val) {
      this.setAttribute('loading', val);
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
    set underline(val) {
      this.setAttribute('underline', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'color',
        'size',
        'variant',
        'fullwidth',
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
      this.setAttribute('role', 'button');
    }
  }

  customElements.define('punica-button', Button);
})();
