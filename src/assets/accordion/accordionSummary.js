(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="icon"></slot>
    <slot name="content"></slot>
    <slot name="expandIcon"></slot>
    <style>@import "http://localhost:5008/assets/accordion/accordionSummary.css";</style>
  `;

  class AccordionSummary extends HTMLElement {
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
      if (this.parentElement.localName == 'punica-accordion') {
        this.parentElement.addSummary(this);
      }
    }
  }

  customElements.define('punica-accordion-summary', AccordionSummary);
})();
