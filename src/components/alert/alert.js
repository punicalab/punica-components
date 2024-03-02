(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="alert-layout-main">
      <div class="alert-layout-icon">
        <slot name="icon"></slot>
      </div>
      <div class="alert-layout-title">
        <slot name="title"></slot>
      </div>
      <div class="alert-layout-description">
        <slot name="description"></slot>
      </div>
    </div>
    <style>@import "http://localhost:5008/assets/alert/alert.css";</style>
  `;

  class Alert extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get variant() {
      return this.getAttribute('variant') || 'default';
    }

    /**
     *
     */
    get severity() {
      return this.getAttribute('severity');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant', 'severity'];
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
      const wrapper = document.createElement('div');
      const classNames = generateClassNames('alert', {
        [`alert-is-variant-${this.variant}`]: this.variant,
        [`alert-is-severity-${this.severity}`]: this.severity
      });

      wrapper.setAttribute('class', classNames);
      wrapper.appendChild(template.content.cloneNode(true));

      this.#shadow.appendChild(wrapper);
    }
  }

  customElements.define('punica-alert', Alert);
})();
