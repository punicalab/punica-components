(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="icon"></slot>
    <slot name="content"></slot>
    <slot name="actions"></slot>
    <slot name="expandIcon"></slot>
    <style></style>
  `;

  class AccordionSummary extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });

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
      super.connectedCallback();

      if (this.parentElement.localName == 'punica-accordion') {
        this.parentElement.addSummary(this);
      }
    }
  }

  customElements.define('punica-accordion-summary', AccordionSummary);
})();
