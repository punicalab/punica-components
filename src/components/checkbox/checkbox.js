(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <input type="checkbox" />
    <label></label>
    <style></style>
  `;

  class Checkbox extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

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
        this.setAttribute('checked', value);
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
    };

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
      const input = this.#shadow.querySelector('input');
      const label = this.#shadow.querySelector('label');

      input.setAttribute('indeterminate', this.indeterminate);

      if (this.checked) {
        input.setAttribute('checked', '');
        input.removeAttribute('indeterminate');
      } else {
        input.removeAttribute('checked');
      }

      label.innerText = this.label;
    }

    /**
     *
     */
    constructor() {
      super();

      this.addEventListener('click', this.handleClick);
    }

    /**
     *
     */
    connectedCallback() {
      this.#shadow.appendChild(template.content.cloneNode(true));

      this.update();
    }
  }

  customElements.define('punica-checkbox', Checkbox);
})();
