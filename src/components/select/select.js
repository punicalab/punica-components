(function () {
  const template = document.createElement('template');
  const templateMenu = document.createElement('template');

  template.innerHTML = `
    <slot name="adornment"></slot>
    <div id="contentWrapper"><span id="content"></span></div>
    <slot name="preload"></slot>
    <slot name="clear"></slot>
    <slot name="caret"></slot>
    <style></style>
  `;

  templateMenu.innerHTML = `
    <div id="backdrop"></div>
    <punica-popover open="false" placement="bottom">
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
        z-index: var(--zindex-backdrop);
      }

      #option-wrapper {
        padding: var(--spacing-8) 0;
        border: 1px solid var(--neutral-main);
        background-color: var(--background-paper);
        display: block;
        max-height: 250px;
        overflow-x: hidden;
        border-radius: var(--spacing-4);
        box-shadow: var(--box-shadow-xxs);
      }
    </style>
  `;

  class Select extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #selected = null;
    #content = null;

    /**
     *
     */
    get rounded() {
      const value = this.getAttribute('rounded');

      return value || true;
    }

    /**
     *
     */
    set rounded(val) {
      this.setAttribute('rounded', val);
    }

    /**
     *
     */
    get placeholder() {
      return this.getAttribute('placeholder');
    }

    /**
     *
     */
    set placeholder(val) {
      this.setAttribute('placeholder', val);
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
    get selecteditemdisplayitem() {
      return this.getAttribute('selecteditemdisplayitem');
    }

    /**
     *
     */
    set selecteditemdisplayitem(val) {
      this.setAttribute('selecteditemdisplayitem', val);
    }

    /**
     *
     */
    get error() {
      return this.getAttribute('error') == 'true';
    }

    /**
     *
     */
    set error(val) {
      this.setAttribute('error', val);
    }

    /**
     *
     */
    get fullwidth() {
      return this.getAttribute('fullwidth');
    }

    /**
     *
     */
    set fullwidth(val) {
      this.setAttribute('fullwidth', val);
    }

    /**
     *
     */
    get disabled() {
      return this.getAttribute('disabled');
    }

    /**
     *
     */
    set disabled(val) {
      this.setAttribute('disabled', val);
    }

    /**
     *
     */
    get adornment() {
      return this.getAttribute('adornment');
    }

    /**
     *
     */
    set adornment(val) {
      this.setAttribute('adornment', val);
    }

    /**
     *
     */
    get clearbutton() {
      return this.getAttribute('clearbutton');
    }

    /**
     *
     */
    set clearbutton(val) {
      this.setAttribute('clearbutton', val);
    }

    /**
     *
     */
    get loading() {
      return this.getAttribute('loading');
    }

    /**
     *
     */
    set loading(val) {
      this.setAttribute('loading', val);
    }

    /**
     *
     */
    get value() {
      return this.getAttribute('value') || '';
    }

    /**
     *
     */
    set value(val) {
      this.setAttribute('value', val);
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
    set size(val) {
      this.setAttribute('size', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return [
        'placeholder',
        'error',
        'fullwidth',
        'disabled',
        'adornment',
        'clear-button',
        'loading',
        'value',
        'size',
        'minimumtargetwidth',
        'selecteditemdisplayitem'
      ];
    }

    /**
     *
     */
    setSelectedItemContent() {
      if (this.selecteditemdisplayitem) {
        const displayContent = this.#selected.querySelector(
          this.selecteditemdisplayitem
        );
        this.#content.innerHTML = displayContent.innerHTML;
      } else {
        this.#content.innerHTML = this.#selected.innerHTML;
      }
    }

    /**
     *
     */
    show() {
      document.addEventListener('keydown', this.hosContainerKeyDown);

      const childrenClones = Array.from(this.children)
        .filter((child) => child.nodeName == 'PUNICA-SELECT-ITEM')
        .map((child) => {
          const clone = child.cloneNode(true);
          const existingInlineStyle = child.getAttribute('style');

          clone.setAttribute('style', existingInlineStyle);

          return clone;
        });

      const position = this.getBoundingClientRect();
      const select = document.createElement('div');

      this.setAttribute('focus', true);

      select.style = this.style;

      select.setAttribute('id', 'select');
      select.appendChild(templateMenu.content.cloneNode(true));

      const popover = select.querySelector('punica-popover');
      const backdrop = select.querySelector('#backdrop');
      const optionWrapper = select.querySelector('#option-wrapper');

      popover.setAttribute('minimumtargetwidth', true);

      childrenClones.forEach((clone) => {
        clone.addEventListener('click', this.onClickItemHandler);

        optionWrapper.appendChild(clone);
      });

      popover.setAttribute('top', position.top);
      popover.setAttribute('left', position.left);
      popover.setAttribute('width', position.width);
      popover.setAttribute('height', position.height);
      popover.setAttribute('bottom', position.bottom);
      popover.setAttribute('open', true);

      backdrop.addEventListener('click', this.backdropClick);

      document.body.appendChild(select);
    }

    /**
     *
     */
    hide() {
      this.removeAttribute('focus');

      const clone = document.body.querySelector('#select');

      if (!clone) {
        return;
      }

      this.fireOnClose();

      document.body.removeChild(clone);
      document.removeEventListener('keydown', this.hosContainerKeyDown);
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
    selectListChange = (event) => {
      this.hide();

      event.stopPropagation();
    };

    /**
     *
     */
    click = () => {
      this.show();
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
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            value: this.value
          },
          bubbles: true,
          cancelable: false,
          composed: true
        })
      );
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
    onClickItemHandler = (event) => {
      if (this.#selected) {
        this.#selected.selected = false;
      }

      this.#selected = event.currentTarget;
      this.#selected.selected = true;
      this.value = this.#selected.value;

      this.setSelectedItemContent();

      this.hide();
      this.fireOnChange();

      event.stopPropagation();
    };

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#content = this.#shadow.querySelector('#content');
    }

    /**
     *
     * @param {*} item
     */
    itemAdd(item) {
      const itemValue = item.getAttribute('value');

      if (itemValue == this.value) {
        this.#selected = item;
        this.#selected.selected = true;
        this.value = this.#selected.value;

        this.setSelectedItemContent();
      }
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'value':
          if (newValue == null) {
            if (this.#selected) {
              this.#selected.selected = false;
            }

            this.#selected = null;
            this.#content.innerHTML = '';
          } else {
            const item = Array.from(this.children).find(
              (child) =>
                child.nodeName === 'PUNICA-SELECT-ITEM' &&
                child.getAttribute('value') === newValue
            );

            if (item) {
              if (this.#selected) {
                this.#selected.selected = false;
              }

              this.#selected = item;
              this.#selected.selected = true;
              this.#content.innerHTML = this.#selected.innerHTML;
            }
          }
          break;
      }
    }

    /**
     *
     */
    connectedCallback() {
      if (!this.size) {
        this.size = 'medium';
      }

      this.addEventListener('click', this.click);
    }

    /**
     *
     */
    disconnectedCallback() {
      this.removeEventListener('click', this.click);
    }
  }

  customElements.define('punica-select', Select);
})();
