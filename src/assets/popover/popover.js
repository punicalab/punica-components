(function () {
  const template = document.createElement('template');
  template.innerHTML = `
    <slot></slot>
    <style>
      :host{
        position: fixed;
      }
    </style>
  `;

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
        left:
          window.innerWidth -
          contentRect.width -
          (window.innerWidth - targetRect.right),
        top: targetRect.top + targetRect.height + window.scrollY
      };
    }

    return {
      left: targetRect.left,
      top: targetRect.top + targetRect.height + window.scrollY
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
    get minimumTargetWidth() {
      return this.getAttribute('minimumTargetWidth') == 'true';
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
    get top() {
      const top = this.getAttribute('top');

      return top ? parseInt(top) : 0;
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
    get width() {
      const width = this.getAttribute('width');

      return width ? parseInt(width) : 0;
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
    get placement() {
      return this.getAttribute('placement');
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'open',
        'left',
        'top',
        'width',
        'height',
        'bottom',
        'placement',
        'minimumTargetWidth'
      ];
    }

    /**
     *
     * @returns
     */
    getTargetRect() {
      return {
        left: this.left,
        top: this.top,
        width: this.width,
        height: this.height,
        bottom: this.bottom
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
        ...(this.minimumTargetWidth
          ? { width: targetRect.width }
          : { width: contentRect.width })
      };

      for (const key in position) {
        this.style[key] = position[key];
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
