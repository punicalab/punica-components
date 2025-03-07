(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div class="backdrop"></div>
    <punica-paper>
      <slot></slot>
    </punica-paper>
    <style></style>
  `;

  const SIZES = {
    small: '480px',
    medium: '600px',
    large: '900px',
    xlarge: '1160px',
    '2xlarge': '1280px',
    fullSize: '100%'
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
    set open(val) {
      return this.setAttribute('open', val);
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
     * @param {*} isOpen
     * @param {*} size
     * @param {*} transform
     */
    #updateContentStyles(isOpen, size, transform, wasOpen) {
      this.#content.style.pointerEvents = isOpen ? 'all' : 'none';

      if (isOpen) {
        this.#content.style.visibility = 'visible';
      }

      if (this.direction === 'left' || this.direction === 'right') {
        this.#content.style.width = size;
      } else {
        this.#content.style.height = size;
      }

      this.#content.style.transform = transform;

      if (!isOpen && wasOpen) {
        const transitionHandler = () => {
          this.#content.style.visibility = 'hidden';
          this.#content.removeEventListener('transitionend', transitionHandler);
        };

        this.#content.addEventListener('transitionend', transitionHandler);
      }
    }

    /**
     *
     */
    #fireOnClose() {
      this.dispatchEvent(
        new CustomEvent('close', {
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
    #handleBackdropClick = (e) => {
      this.#fireOnClose();
    };

    /**
     *
     */
    #hosContainerKeyDown = (event) => {
      if (event.key == 'Escape') {
        this.#fireOnClose();
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
          const isOpen = newValue === 'true';
          const wasOpen = oldValue === 'true';

          const transformMap = {
            left: isOpen ? `translateX(0)` : `translateX(-${size})`,
            right: isOpen ? `translateX(0)` : `translateX(${size})`,
            top: isOpen ? `translateY(0)` : `translateY(-${size})`,
            bottom: isOpen ? `translateY(0)` : `translateY(${size})`
          };

          this.#updateContentStyles(
            isOpen,
            size,
            transformMap[this.direction],
            wasOpen
          );
          break;
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

      this.#backdrop.addEventListener('click', this.#handleBackdropClick);
      document.addEventListener('keydown', this.#hosContainerKeyDown);
    }
  }

  customElements.define('punica-drawer', Drawer);
})();
