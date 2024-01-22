(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="backdrop"></div>
    <punica-paper>
      <slot></slot>
    </punica-paper>
    <style>@import "http://localhost:5008/assets/drawer/drawer.css";</style>
  `;

  class Drawer extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #paper = null;

    /**
     *
     */
    get open() {
      return this.getAttribute('open');
    }

    /**
     *
     */
    get direction() {
      return this.getAttribute('direction');
    }

    /**
     *
     */
    get size() {
      return this.getAttribute('size');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['size', 'direction', 'open'];
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#paper = this.#shadow.querySelector('punica-paper');
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'open':
          switch (this.direction) {
            case 'left':
              if (newValue == 'true') {
                this.#paper.style.visibility = 'visible';
                this.#paper.style.pointerEvents = 'all';
                this.#paper.style.transform = 'translateX(0)';
              } else {
                this.#paper.style.pointerEvents = 'none';
                this.#paper.style.transform = 'translateX(-369px)';
              }
              break;
            case 'right':
              if (newValue == 'true') {
                this.#paper.style.visibility = 'visible';
                this.#paper.style.pointerEvents = 'all';
                this.#paper.style.transform = 'translateX(0)';
              } else {
                this.#paper.style.pointerEvents = 'none';
                this.#paper.style.transform = 'translateX(369px)';
              }
              break;
            case 'top':
              if (newValue == 'true') {
                this.#paper.style.visibility = 'visible';
                this.#paper.style.pointerEvents = 'all';
                this.#paper.style.transform = 'translateY(0)';
              } else {
                this.#paper.style.pointerEvents = 'none';
                this.#paper.style.transform = 'translateY(-369px)';
              }
              break;
            case 'bottom':
              if (newValue == 'true') {
                this.#paper.style.visibility = 'visible';
                this.#paper.style.pointerEvents = 'all';
                this.#paper.style.transform = 'translateY(0)';
              } else {
                this.#paper.style.pointerEvents = 'none';
                this.#paper.style.transform = 'translateY(369px)';
              }
              break;
          }

          break;
      }

      if (newValue == 'true') {
        this.style.visibility = 'visible';
      } else {
        this.style.visibility = 'hidden';
      }
    }
  }

  customElements.define('punica-drawer', Drawer);
})();
