(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  class Hidden extends PunicaBase {
    static get booleanAttributes() {
      return [];
    }
    #shadow = this.attachShadow({ mode: 'open' });
    #matched = null;

    /**
     *
     */
    get direction() {
      return this.getAttribute('direction');
    }

    /**
     *
     */
    set direction(val) {
      this.setAttribute('direction', val);
    }

    /**
     *
     */
    get breakPoint() {
      return this.getAttribute('breakPoint');
    }

    /**
     *
     */
    set breakPoint(val) {
      this.setAttribute('breakPoint', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['direction', 'breakPoint'];
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
      const media = window.matchMedia(
        BreakPointRelativeToDirection[this.direction](this.breakPoint)
      );

      if (media.matches !== this.#matched) {
        this.#matched = media.matches;

        this.render();
      }

      media.onchange = (e) => {
        this.#matched = e.matches;

        this.render();
      };
    }

    render() {
      if (this.#matched) {
        this.#shadow.appendChild(template.content.cloneNode(true));
      } else {
        this.#shadow.innerHTML = '';
      }
    }
  }

  const BreakPointSize = {
    xs: 444,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536
  };

  const BreakPointRelativeToDirection = {
    up: (breakPoint) => `(min-width:${BreakPointSize[breakPoint] + 1}px)`,
    down: (breakPoint) => `(max-width:${BreakPointSize[breakPoint]}px)`
  };

  customElements.define('punica-hidden', Hidden);
})();
