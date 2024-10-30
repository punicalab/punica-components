(function () {
  const template = document.createElement('template');
  const templateMenu = document.createElement('template');

  template.innerHTML = `<style></style>`;

  templateMenu.innerHTML = `
    <div id="backdrop"></div>
    <punica-popover open="false">
      <div id="option-wrapper">
        <slot></slot>
      </div>
    </punica-popover>
    <style>
      #backdrop {
        position: fixed;
        inset: 0;
        background-color: transparent;
        pointer-events: all;
        z-index: 9;
      }

      #option-wrapper {
        padding: var(--spacing-8) 0;
        background-color: var(--background-paper);
        display: block;
        max-height: 250px;
        overflow-x: hidden;
        border-radius: var(--spacing-4);
        box-shadow: 1px 1px rgba(125, 125, 125, 0.1),
          0 1px 1px 1px rgba(125, 125, 125, 0.1);
      }
    </style>
  `;

  class Menu extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

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
      const childrenClones = Array.from(this.children).map((child) =>
        child.cloneNode(true)
      );

      const menu = document.createElement('div');

      menu.style = this.style;
      menu.style.display = 'inline-flex';

      menu.setAttribute('id', 'menu');
      menu.appendChild(templateMenu.content.cloneNode(true));

      const popover = menu.querySelector('punica-popover');
      const backdrop = menu.querySelector('#backdrop');
      const optionWrapper = menu.querySelector('#option-wrapper');

      childrenClones.forEach((clone) => optionWrapper.appendChild(clone));

      popover.setAttribute('top', this.top);
      popover.setAttribute('left', this.left);
      popover.setAttribute('width', this.width);
      popover.setAttribute('height', this.height);
      popover.setAttribute('bottom', this.bottom);
      popover.setAttribute('placement', this.placement);
      popover.setAttribute('open', true);

      backdrop.addEventListener('click', this.backdropClick);

      document.body.appendChild(menu);
    }

    /**
     *
     */
    hide() {
      const clone = document.body.querySelector('#menu');

      if (!clone) {
        return;
      }

      this.fireOnClose();

      document.body.removeChild(clone);
    }

    /**
     *
     */
    fireOnClose() {
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
