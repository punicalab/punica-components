(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <div class="wrapper">
      <span class="content"></span>
    </div>
    <style></style>
  `;

  class Badge extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get color() {
      return this.getAttribute('color') || 'primary';
    }

    /**
     *
     */
    get max() {
      const max = this.getAttribute('max');

      if (max) {
        return parseInt(max);
      }

      return 9;
    }

    /**
     *
     */
    get size() {
      return this.getAttribute('size') || 'large';
    }

    /**
     *
     */
    get badgeContent() {
      const badgeContent = this.getAttribute('badgecontent');

      if (badgeContent) {
        return parseInt(badgeContent);
      }

      return 0;
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'badgecontent', 'max'];
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

      this.update();
    }

    /**
     *
     * @param {*} name
     */
    attributeChangedCallback(name) {
      switch (name) {
        case 'badgecontent':
          this.update();
          break;
      }
    }

    /**
     *
     */
    update() {
      const content = this.#shadow.querySelector('.content');

      if (!content) {
        return;
      }

      if (this.size == 'medium') {
        if (this.badgeContent < this.max) {
          content.innerText = this.badgeContent;
        } else {
          content.innerText = `${this.max}+`;
        }
      }
    }
  }

  customElements.define('punica-badge', Badge);
})();
