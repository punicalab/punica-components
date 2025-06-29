(function () {
  const template = document.createElement('template');

  template.innerHTML = `<slot></slot><style></style>`;

  const oppositePlacements = {
    top: 'bottom',
    left: 'right',
    right: 'left',
    bottom: 'top'
  };

  /**
   *
   * @param {*} params
   * @returns
   */
  const getPlacementLeft = ({ targetRect, contentRect }) => ({
    left: targetRect.left - contentRect.width,
    top: targetRect.top + window.scrollY
  });

  /**
   *
   * @param {*} params
   * @returns
   */
  const getPlacementRight = ({ targetRect }) => ({
    left: targetRect.left + targetRect.width,
    top: targetRect.top + window.scrollY
  });

  /**
   *
   * @param {*} params
   * @returns
   */
  const getPlacementBottom = ({ targetRect, contentRect }) => {
    if (targetRect.left + contentRect.width > window.innerWidth) {
      return {
        right: window.innerWidth - targetRect.left - targetRect.width,
        top: targetRect.top + targetRect.height
      };
    }

    return {
      left: targetRect.left,
      top: targetRect.top + targetRect.height
    };
  };

  /**
   *
   * @param {*} params
   * @returns
   */
  const getPlacementTop = ({ targetRect, contentRect }) => {
    if (targetRect.left + contentRect.width > window.innerWidth) {
      return {
        left:
          window.innerWidth -
          contentRect.width -
          (window.innerWidth - targetRect.right),
        top: targetRect.top + targetRect.height + window.scrollY
      };
    }

    return {
      left: targetRect.left,
      top: targetRect.top - contentRect.height + window.scrollY
    };
  };

  /**
   *
   * @param {*} targetRect
   * @param {*} contentRect
   * @returns
   */
  const getAvailableSpaces = (targetRect, contentRect) => {
    const { innerWidth, innerHeight } = window;
    const { width: pWidth, height: pHeight } = contentRect;
    const {
      top: tTop,
      left: tLeft,
      width: tWidth,
      bottom: tBottom
    } = targetRect;

    return {
      top: tTop - pHeight > 0,
      left: tLeft - pWidth > 0,
      bottom: innerHeight > tBottom + pHeight,
      right: innerWidth > tLeft + tWidth + pWidth
    };
  };

  /**
   *
   * @param {*} placement
   * @returns
   */
  const getPlacement = (placement) => {
    switch (placement) {
      case 'top':
        return getPlacementTop;
      case 'bottom':
        return getPlacementBottom;
      case 'left':
        return getPlacementLeft;
      case 'right':
        return getPlacementRight;
      default:
        return getPlacementBottom;
    }
  };

  class Popover extends HTMLElement {
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
    set open(val) {
      this.setAttribute('open', val);
    }

    /**
     *
     */
    get minimumtargetwidth() {
      return this.getAttribute('minimumtargetwidth') == 'true';
    }

    /**
     *
     */
    set minimumtargetwidth(val) {
      this.setAttribute('minimumtargetwidth', val);
    }

    /**
     *
     */
    get left() {
      const left = this.getAttribute('left');

      return left ? parseInt(left) : 0;
    }

    /**
     *
     */
    set left(val) {
      this.setAttribute('left', val);
    }

    /**
     *
     */
    get right() {
      const right = this.getAttribute('right');

      return right ? parseInt(right) : 0;
    }

    /**
     *
     */
    set right(val) {
      this.setAttribute('right', val);
    }

    /**
     *
     */
    get top() {
      const top = this.getAttribute('top');

      return top ? parseInt(top) : 0;
    }

    /**
     *
     */
    set top(val) {
      this.setAttribute('top', val);
    }

    /**
     *
     */
    get bottom() {
      const bottom = this.getAttribute('bottom');

      return bottom ? parseInt(bottom) : 0;
    }

    /**
     *
     */
    set bottom(val) {
      this.setAttribute('bottom', val);
    }

    /**
     *
     */
    get width() {
      const width = this.getAttribute('width');

      return width ? parseInt(width) : 0;
    }

    /**
     *
     */
    set width(val) {
      this.setAttribute('width', val);
    }

    /**
     *
     */
    get height() {
      const height = this.getAttribute('height');

      return height ? parseInt(height) : 0;
    }

    /**
     *
     */
    set height(val) {
      this.setAttribute('height', val);
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
    set placement(val) {
      this.setAttribute('placement', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'open',
        'left',
        'right',
        'top',
        'width',
        'height',
        'bottom',
        'placement',
        'minimumtargetwidth'
      ];
    }

    /**
     *
     * @returns
     */
    getTargetRect() {
      return {
        left: this.left,
        right: this.right,
        top: this.top,
        bottom: this.bottom,
        width: this.width,
        height: this.height
      };
    }

    /**
     *
     * @returns
     */
    getPopoverPosition() {
      const targetRect = this.getTargetRect();
      const contentRect = this.getBoundingClientRect();
      const availableSpaces = getAvailableSpaces(targetRect, contentRect);
      const oppositePlacement = oppositePlacements[this.placement];
      const shouldFlip =
        !availableSpaces[this.placement] && availableSpaces[oppositePlacement];

      const certainPlacement = shouldFlip ? oppositePlacement : this.placement;
      const newPosition = {
        ...getPlacement(certainPlacement)({ targetRect, contentRect })
      };

      const position = {
        ...newPosition,
        zIndex: 999999999,
        ...(this.minimumtargetwidth
          ? { width: targetRect.width }
          : { width: contentRect.width })
      };

      for (const key in position) {
        this.style[key] = position[key] + 'px';
      }
    }

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
            this.style.display = 'block';
            this.getPopoverPosition();
          } else {
            this.style.display = 'none';
          }
          break;
      }
    }
  }

  customElements.define('punica-popover', Popover);
})();
