(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="backdrop"></div>
    <punica-paper>
      <slot></slot>
    </punica-paper>
    <style>@import "http://localhost:5008/assets/drawer/drawer.css";</style>
  `;

  const SIZES = {
    small: '400px',
    medium: '650px',
    large: '900px',
    xlarge: '90%'
  };

  class Drawer extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #content = null;
    #backdrop = null;

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
    fireOnClose() {
      this.dispatchEvent(
        new CustomEvent('onClose', {
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     * @param {*} e
     */
    handleBackdropClick = (e) => {
      this.fireOnClose();
    };

    /**
     *
     */
    hosContainerKeyDown = (event) => {
      if (event.key == 'Escape') {
        this.fireOnClose();
      }
    };

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#content = this.#shadow.querySelector('punica-paper');
      this.#backdrop = this.#shadow.querySelector('.backdrop');
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
          const size = SIZES[this.size];

          switch (this.direction) {
            case 'left':
              if (newValue == 'true') {
                this.#content.style.width = size;
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = `translateX(${0})`;
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = `translateX(-${size})`;
              }
              break;
            case 'right':
              if (newValue == 'true') {
                this.#content.style.width = size;
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = `translateX(${0})`;
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = `translateX(${size})`;
              }
              break;
            case 'top':
              if (newValue == 'true') {
                this.#content.style.height = size;
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = `translateY(${0})`;
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = `translateY(-${size})`;
              }
              break;
            case 'bottom':
              if (newValue == 'true') {
                this.#content.style.height = size;
                this.#content.style.visibility = 'visible';
                this.#content.style.pointerEvents = 'all';
                this.#content.style.transform = `translateY(${0})`;
              } else {
                this.#content.style.pointerEvents = 'none';
                this.#content.style.transform = `translateY(${size})`;
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

    /**
     *
     */
    connectedCallback() {
      const size = SIZES[this.size];

      switch (this.direction) {
        case 'left':
          this.#content.style.transform = `translateX(-${size})`;
          break;
        case 'right':
          this.#content.style.transform = `translateX(${size})`;
          break;
        case 'top':
          this.#content.style.transform = `translateY(-${size})`;
          break;
        case 'bottom':
          this.#content.style.transform = `translateY(${size})`;
          break;
      }

      this.#backdrop.addEventListener('click', this.handleBackdropClick);
      document.addEventListener('keydown', this.hosContainerKeyDown);
    }
  }

  customElements.define('punica-drawer', Drawer);
})();
