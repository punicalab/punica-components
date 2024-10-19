(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <div id="backdrop"></div>
    <punica-popover open="false">
      <div id="optionWrapper">
        <slot></slot>
      </div>
    </punica-popover>
    <style></style>
  `;

  class Menu extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #popover = null;
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
    get left() {
      return this.getAttribute('left');
    }

    /**
     *
     */
    get top() {
      return this.getAttribute('top');
    }

    /**
     *
     */
    get bottom() {
      return this.getAttribute('bottom');
    }

    /**
     *
     */
    get width() {
      return this.getAttribute('width');
    }

    /**
     *
     */
    get height() {
      return this.getAttribute('height');
    }

    /**
     *
     */
    get placement() {
      return this.getAttribute('placement');
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['open', 'left', 'top', 'width', 'height', 'bottom', 'placement'];
    }

    /**
     *
     */
    show() {
      this.style.display = 'inline-flex';

      this.#popover.setAttribute('top', this.top);
      this.#popover.setAttribute('left', this.left);
      this.#popover.setAttribute('width', this.width);
      this.#popover.setAttribute('height', this.height);
      this.#popover.setAttribute('bottom', this.bottom);
      this.#popover.setAttribute('placement', this.placement);
      this.#popover.setAttribute('open', true);

      this.#backdrop.addEventListener('click', this.backdropClick);
      this.#backdrop.style.display = 'block';
    }

    /**
     *
     */
    hide() {
      this.style.display = 'none';

      this.#backdrop.style.display = 'none';
      this.#popover.removeAttribute('top');
      this.#popover.removeAttribute('left');
      this.#popover.removeAttribute('width');
      this.#popover.removeAttribute('height');
      this.#popover.removeAttribute('bottom');
      this.#popover.removeAttribute('placement');
      this.#popover.removeAttribute('open');
      this.#backdrop.removeEventListener('click', this.backdropClick);

      this.fireOnClose();
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
     */
    backdropClick = (event) => {
      this.hide();

      event.stopPropagation();
    };

    /**
     *
     */
    hosContainerKeyDown = (event) => {
      if (event.key == 'Escape') {
        this.hide();
      }
    };

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#popover = this.#shadow.querySelector('punica-popover');
      this.#backdrop = this.#shadow.querySelector('#backdrop');
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
          if (newValue == 'true') {
            document.addEventListener('keydown', this.hosContainerKeyDown);
            this.show();
          } else {
            document.removeEventListener('keydown', this.hosContainerKeyDown);
            this.hide();
          }
          break;
      }
    }
  }

  customElements.define('punica-menu', Menu);
})();

//placement="bottom"
