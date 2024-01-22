(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <style>@import "http://localhost:5008/assets/typography/typography.css";</style>
  `;

  const defaultVariantLevelMapping = {
    headline1: '1',
    headline2: '2',
    headline3: '3',
    headline4: '4',
    headline5: '5',
    headline6: '6'
  };

  class Typography extends HTMLElement {
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
    get variant() {
      return this.getAttribute('variant') || 'body1';
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['variant'];
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
      const areaLevel = defaultVariantLevelMapping[this.variant];

      if (areaLevel) {
        this.setAttribute('role', 'heading');
        this.setAttribute(
          'aria-level',
          defaultVariantLevelMapping[this.variant]
        );
      }
    }
  }

  customElements.define('punica-typography', Typography);
})();
