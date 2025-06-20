(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <div class="wrapper">
      <span class="content" part="badge-content"></span>
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
    set color(value) {
      this.setAttribute('color', value);
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
    set max(value) {
      this.setAttribute('max', value);
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
    set size(value) {
      this.setAttribute('size', value);
    }

    /**
     *
     */
    get badgecontent() {
      const value = this.getAttribute('badgecontent');

      if (value) {
        return parseInt(value);
      }

      return 0;
    }

    /**
     *
     */
    set badgecontent(val) {
      this.setAttribute('badgecontent', val);
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

      if (this.badgecontent) {
        content.classList.add('has-content');

        if (this.size == 'medium') {
          if (this.badgecontent < this.max) {
            content.innerText = this.badgecontent;
          } else {
            content.innerText = `${this.max}+`;
          }
        }
      } else {
        content.classList.remove('has-content');
      }
    }
  }

  customElements.define('punica-badge', Badge);
})();
