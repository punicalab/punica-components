(function () {
  const template = document.createElement('template');
  template.innerHTML = `
    <div class="backdrop"></div>
    <punica-box>
      <slot></slot>
    </punica-box>
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

    get open() {
      return this.getAttribute('open');
    }
    set open(val) {
      this.setAttribute('open', val);
    }

    get direction() {
      return this.getAttribute('direction');
    }
    set direction(val) {
      this.setAttribute('direction', val);
    }

    get size() {
      return this.getAttribute('size');
    }
    set size(val) {
      this.setAttribute('size', val);
    }

    get rounded() {
      return this.getAttribute('rounded') == 'true';
    }
    set rounded(val) {
      this.setAttribute('rounded', val);
    }

    get customsize() {
      return this.getAttribute('customsize');
    }
    set customsize(val) {
      this.setAttribute('customsize', val);
    }

    static get observedAttributes() {
      return ['size', 'direction', 'open', 'rounded', 'customsize'];
    }

    constructor() {
      super();
      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#content = this.#shadow.querySelector('punica-box');
      this.#backdrop = this.#shadow.querySelector('.backdrop');
    }

    /**
     *
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

      this.#content.offsetWidth;

      this.#content.style.opacity = isOpen ? '1' : '0';
      this.#content.style.transform = transform;

      if (!isOpen && wasOpen) {
        const transitionHandler = (ev) => {
          if (
            ev.propertyName === 'transform' ||
            ev.propertyName === 'opacity'
          ) {
            this.#content.style.visibility = 'hidden';
            this.#content.removeEventListener(
              'transitionend',
              transitionHandler
            );
          }
        };
        this.#content.addEventListener('transitionend', transitionHandler);
      }
    }

    #fireOnClose() {
      this.dispatchEvent(
        new CustomEvent('close', {
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
    }

    #handleBackdropClick = () => {
      this.#fireOnClose();
    };

    #hosContainerKeyDown = (event) => {
      if (event.key === 'Escape') this.#fireOnClose();
    };

    attributeChangedCallback(name, oldValue, newValue) {
      if (name !== 'open') return;

      const size = this.customsize || SIZES[this.size];
      const isOpen = newValue === 'true';
      const wasOpen = oldValue === 'true';

      const transformMap = {
        left: isOpen ? 'translate3d(0,0,0)' : `translate3d(-${size}, 0, 0)`,
        right: isOpen ? 'translate3d(0,0,0)' : `translate3d(${size}, 0, 0)`,
        top: isOpen ? 'translate3d(0,0,0)' : `translate3d(0, -${size}, 0)`,
        bottom: isOpen ? 'translate3d(0,0,0)' : `translate3d(0, ${size}, 0)`
      };

      if (isOpen && !wasOpen) {
        const startTransformMap = {
          left: `translate3d(-${size}, 0, 0)`,
          right: `translate3d(${size}, 0, 0)`,
          top: `translate3d(0, -${size}, 0)`,
          bottom: `translate3d(0, ${size}, 0)`
        };

        this.#content.style.transform = startTransformMap[this.direction];
        this.#content.style.opacity = '0';
        this.#content.style.visibility = 'visible';

        requestAnimationFrame(() => {
          this.#content.offsetWidth;
          this.#updateContentStyles(true, size, 'translate3d(0,0,0)', false);
        });
      } else {
        this.#updateContentStyles(
          isOpen,
          size,
          transformMap[this.direction],
          wasOpen
        );
      }

      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    connectedCallback() {
      const size = this.customsize || SIZES[this.size] || '600px';

      switch (this.direction) {
        case 'left':
          this.#content.style.transform = `translate3d(-${size}, 0, 0)`;
          break;
        case 'right':
          this.#content.style.transform = `translate3d(${size}, 0, 0)`;
          break;
        case 'top':
          this.#content.style.transform = `translate3d(0, -${size}, 0)`;
          break;
        case 'bottom':
          this.#content.style.transform = `translate3d(0, ${size}, 0)`;
          break;
      }

      this.#backdrop.addEventListener('click', this.#handleBackdropClick);
      document.addEventListener('keydown', this.#hosContainerKeyDown);
    }
  }

  customElements.define('punica-drawer', Drawer);
})();
