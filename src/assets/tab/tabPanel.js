(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <style>@import "http://localhost:5008/assets/tab/tabPanel.css";</style>
  `;

  class TabPanel extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #slot = null;

    /**
     *
     */
    get value() {
      return this.getAttribute('value');
    }

    /**
     *
     */
    get selectedvalue() {
      return this.getAttribute('selectedvalue');
    }

    /**
     *
     */
    set selectedvalue(val) {
      this.setAttribute('selectedvalue', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['value', 'selectedvalue'];
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
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'selectedvalue':
          if (newValue == this.value) {
            if (this.#slot == null) {
              this.#slot = document.createElement('slot');

              this.#shadow.appendChild(this.#slot);
            }
          } else if (this.#slot) {
            this.#shadow.removeChild(this.#slot);
            this.#slot = null;
          }
          break;
      }
    }
  }

  customElements.define('punica-tab-panel', TabPanel);
})();
