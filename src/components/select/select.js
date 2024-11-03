(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="adornment"></slot>
    <div id="contentWrapper"><span id="content"></span></div>
    <slot name="preload"></slot>
    <slot name="clear"></slot>
    <slot name="caret"></slot>
    <div id="backdrop"></div>
    <punica-popover open="false" placement="bottom" minimumTargetWidth="true">
      <div id="optionWrapper">
        <slot></slot>
      </div>
    </punica-popover>
    <style></style>
  `;

  class Select extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #popover = null;
    #backdrop = null;
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
    get placeholder() {
      return this.getAttribute('placeholder');
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
    get fullWidth() {
      return this.getAttribute('fullWidth');
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
    get adornment() {
      return this.getAttribute('adornment');
    }

    /**
     *
     */
    get clearButton() {
      return this.getAttribute('clearButton');
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
        'fullWidth',
        'disabled',
        'adornment',
        'clearButton',
        'loading',
        'value',
        'size'
      ];
    }

    /**
     *
     */
    show() {
      const position = this.getBoundingClientRect();

      this.setAttribute('focus', true);

      this.#popover.setAttribute('top', position.top);
      this.#popover.setAttribute('left', position.left);
      this.#popover.setAttribute('width', position.width);
      this.#popover.setAttribute('height', position.height);
      this.#popover.setAttribute('bottom', position.bottom);
      this.#popover.setAttribute('open', true);

      this.#backdrop.addEventListener('click', this.backdropClick);
      this.#backdrop.style.display = 'block';

      this.removeEventListener('click', this.click);
    }

    /**
     *
     */
    hide() {
      this.removeAttribute('focus');
      this.#backdrop.style.display = 'none';
      this.#popover.removeAttribute('open');
      this.#backdrop.removeEventListener('click', this.backdropClick);
      this.addEventListener('click', this.click);
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

      document.addEventListener('keydown', this.hosContainerKeyDown);
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
    onClickItemHandler = (event) => {
      if (this.#selected) {
        this.#selected.selected = false;
      }

      this.#selected = event.target;
      this.#selected.selected = true;
      this.value = this.#selected.value;

      this.#content.innerHTML = this.#selected.innerHTML;

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
      this.#popover = this.#shadow.querySelector('punica-popover');
      this.#backdrop = this.#shadow.querySelector('#backdrop');
      this.#content = this.#shadow.querySelector('#content');
    }

    /**
     *
     * @param {*} item
     */
    itemAdd(item) {
      const itemValue = item.getAttribute('value');

      item.addEventListener('click', this.onClickItemHandler);

      if (itemValue == this.value) {
        this.#selected = item;
        this.#selected.selected = true;
        this.value = this.#selected.value;

        this.#content.innerHTML = this.#selected.innerHTML;
      }
    }

    /**
     *
     * @param {*} item
     */
    itemRemove(item) {
      item.removeEventListener('click', this.onClickItemHandler);
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
