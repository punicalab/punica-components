(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/skeleton/skeleton.css";</style>
  `;

  class Skeleton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get variant() {
      return this.getAttribute('variant');
    }

    /**
     *
     */
    get width() {
      return this.getAttribute('width');
    }

    /**
     *
     */
    get height() {
      return this.getAttribute('height');
    }

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
      return ['variant', 'width', 'height', 'rounded'];
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
      const sheet = new CSSStyleSheet();

      sheet.replaceSync(
        `:host { 
          width: ${this.width}; 
          height: ${this.height}; 
        }`
      );

      this.#shadow.adoptedStyleSheets = [sheet];
    }
  }

  customElements.define('punica-skeleton', Skeleton);
})();
