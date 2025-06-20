(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="active"></slot>
    <slot name="passive"></slot>
    <style></style>
  `;

  class ToggleButton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    get value() {
      return this.getAttribute('value');
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
    get selected() {
      return this.hasAttribute('selected');
    }

    /**
     *
     */
    set selected(value) {
      if (value) {
        this.setAttribute('selected', true);
      } else {
        this.removeAttribute('selected');
      }
      this.updateSlotVisibility();
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['color', 'size', 'disabled', 'selected', 'value'];
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
     */
    toggle() {
      this.selected = !this.selected;
      this.fireOnChange();
    }

    /**
     *
     */
    fireOnChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            value: this.selected
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
    connectedCallback() {
      if (this.disabled === null) {
        this.addEventListener('click', this.toggle);
      }
      this.updateSlotVisibility();
    }

    /**
     *
     */
    disconnectedCallback() {
      this.removeEventListener('click', this.toggle);
    }

    /**
     *
     */
    updateSlotVisibility() {
      const activeSlot = this.#shadow.querySelector('slot[name="active"]');
      const passiveSlot = this.#shadow.querySelector('slot[name="passive"]');

      if (this.selected) {
        this.applyStyles(activeSlot, passiveSlot, 'inline-flex', 'none');
      } else {
        this.applyStyles(activeSlot, passiveSlot, 'none', 'inline-flex');
      }
    }

    /**
     *
     */
    applyStyles(activeSlot, passiveSlot, activeDisplay, passiveDisplay) {
      const activeElements = activeSlot.assignedElements();
      const passiveElements = passiveSlot.assignedElements();

      activeElements.forEach((el) => (el.style.display = activeDisplay));
      passiveElements.forEach((el) => (el.style.display = passiveDisplay));
    }

    /**
     *
     * @param {*} name
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'disabled':
          if (newValue) {
            this.addEventListener('click', this.toggle);
          } else {
            this.removeEventListener('click', this.toggle);
          }
          break;
        case 'selected':
          this.updateSlotVisibility(); // Seçili durumu değiştiğinde slotları güncelle
          break;
      }
    }
  }

  customElements.define('punica-toggle-button', ToggleButton);
})();
