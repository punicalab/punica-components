(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <input type="checkbox" />
    <label></label>
    <style></style>
  `;

  class Checkbox extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #input = null;

    /**
     *
     */
    get checked() {
      return this.getAttribute('checked') == 'true';
    }

    /**
     *
     */
    set checked(value) {
      this.removeAttribute('indeterminate');

      if (value) {
        this.setAttribute('checked', 'true');
      } else {
        this.removeAttribute('checked');
      }

      this.update();
    }

  
    /**
     *
     */
    get label() {
      return this.getAttribute('label');
    }

    /**
     *
     */
    get indeterminate() {
      return this.getAttribute('indeterminate');
    }

    /**
     *
     */
    handleClick = () => {
      this.checked = !this.checked;
      this.fireOnChange();
    };

    /**
     *
     */
     fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            value: this.checked
          },
          bubbles: false,
          cancelable: false,
          composed: true
        })
      );
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['checked', 'label', 'indeterminate'];
    }

    /**
     *
     */
    update() {
      const label = this.#shadow.querySelector('label');

      this.#input.setAttribute('indeterminate', this.indeterminate);

      if (this.checked) {
        this.#input.setAttribute('checked', '');
        this.#input.removeAttribute('indeterminate');
      } else {
        this.#input.removeAttribute('checked');
      }

      label.innerText = this.label;
    }

    /**
     *
     */
    constructor() {
      super();

      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#input = this.#shadow.querySelector('input');

      this.addEventListener('click', this.handleClick);

    }

    /**
     *
     */
    connectedCallback() {
      this.update();
    }


    
  }

  customElements.define('punica-checkbox', Checkbox);
})();
