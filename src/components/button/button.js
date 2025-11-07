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
      return this.hasAttribute('rounded');
    }

    /**
     *
     */
    set rounded(value) {
      if (value) {
        this.setAttribute('rounded', '');
      } else {
        this.removeAttribute('rounded');
      }
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
      return this.hasAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(value) {
      if (value) {
        this.setAttribute('fullwidth', '');
      } else {
        this.removeAttribute('fullwidth');
      }
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
    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    /**
     *
     */
    get loading() {
      return this.hasAttribute('loading');
    }

    /**
     *
     */
    set loading(value) {
      if (value) {
        this.setAttribute('loading', '');
      } else {
        this.removeAttribute('loading');
      }
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
    get type() {
      return this.getAttribute('type') || 'button';
    }

    /**
     *
     */
    set type(val) {
      this.setAttribute('type', val);
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
        'disabled',
        'rounded',
        'type'
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

      if (!this.hasAttribute('size')) this.setAttribute('size', 'small');
      if (!this.hasAttribute('color')) this.setAttribute('color', 'primary');
      if (!this.hasAttribute('variant')) this.setAttribute('variant', 'filled');
    }
  }

  customElements.define('punica-button', Button);
})();
