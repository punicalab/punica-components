(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <input type="checkbox" />
    <label></label>
    <style>@import "http://localhost:5008/assets/checkbox/checkbox.css";</style>
  `;

  class Checkbox extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get checked() {
      return this.getAttribute('checked');
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
    onClickHandler() {
      this.checked = !this.checked;
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
      const wrapper = this.#shadow.querySelector('div');
      const input = this.#shadow.querySelector('input');
      const label = this.#shadow.querySelector('label');

      const classNames = generateClassNames('checkbox', {
        'checkbox-is-indeterminate': this.indeterminate
      });

      wrapper.setAttribute('class', classNames);

      input.setAttribute('indeterminate', this.indeterminate);

      if (this.checked) {
        input.setAttribute('checked', '');
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

      this.addEventListener('click', this.onClickHandler.bind(this));
    }

    /**
     *
     */
    connectedCallback() {
      const wrapper = document.createElement('div');
      wrapper.appendChild(template.content.cloneNode(true));

      this.#shadow.appendChild(wrapper);

      this.update();
    }
  }

  customElements.define('punica-checkbox', Checkbox);
})();
