(function () {
  const template = document.createElement('template');

  template.innerHTML = `
      <div class="track" role="progressbar" aria-busy="true">
        <div class="indeterminate"></div>
      </div>
      <style></style>`;

  class ProgressLine extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return ['height', 'color'];
    }

    /**
     *
     */
    #applyHeight() {
      this.style.setProperty(
        '--progress-height',
        this.getAttribute('height') || '4px'
      );
    }

    /**
     *
     */
    #applyColor() {
      if (this.getAttribute('color')) {
        this.style.setProperty('--progress-color', this.getAttribute('color'));
      }
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
      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#applyHeight();
      this.#applyColor();
    }

    /**
     *
     * @param {*} name
     * @returns
     */
    attributeChangedCallback(name) {
      if (!this.isConnected) return;
      if (name === 'height') this.#applyHeight();
      if (name === 'color') this.#applyColor();
    }
  }

  customElements.define('punica-progress-line', ProgressLine);
})();
