(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot></slot>
    <span class="content"></span>
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
      const badgeContent = this.getAttribute('badgeContent');

      if (badgeContent) {
        return parseInt(badgeContent);
      }

      return 0;
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'badgeContent', 'max'];
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

      wrapper.setAttribute('class', 'badge');
      wrapper.appendChild(template.content.cloneNode(true));

      this.#shadow.appendChild(wrapper);

      this.update();
    }

    /**
     *
     */
    update() {
      const content = this.#shadow.querySelector('.content');

      const classNames = generateClassNames('content', {
        [`badge-is-color-${this.color}`]: true,
        [`badge-is-size-${this.size}`]: true
      });

      content.setAttribute('class', classNames);

      if (this.size == 'large') {
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
