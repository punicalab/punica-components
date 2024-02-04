(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="backdrop"></div>
    <div class="drawer-layout-main">
      <div class="drawer-layout-header">
        <slot name="header"></slot>
      </div>
      <div class="drawer-layout-content">
        <slot name="content"></slot>
      </div>
      <div class="drawer-layout-footer">
        <slot name="footer"></slot>
      </div>
    </div>
    <style>@import "http://localhost:5008/assets/drawer/drawer.css";</style>
  `;

  class Drawer extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #content = null;

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
      this.#content = this.#shadow.querySelector('.drawer-layout-main');
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
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = 'translateX(0)';
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = 'translateX(-369px)';
              }
              break;
            case 'right':
              if (newValue == 'true') {
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = 'translateX(0)';
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = 'translateX(369px)';
              }
              break;
            case 'top':
              if (newValue == 'true') {
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = 'translateY(0)';
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = 'translateY(-369px)';
              }
              break;
            case 'bottom':
              if (newValue == 'true') {
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = 'translateY(0)';
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = 'translateY(369px)';
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
