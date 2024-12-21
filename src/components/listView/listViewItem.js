(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <punica-row gap="16" wrap="nowrap" alignitems="center">
      <punica-col>
        <slot name="startAdornment"></slot>
      </punica-col>
      <punica-col style="flex-grow: 1;">
        <punica-row>
          <punica-col xs="12">
            <punica-row wrap="nowrap" alignitems="center" justifycontent="space-between">
              <punica-col>
                <slot name="label"></slot>
              </punica-col>
              <punica-col>
                <slot name="icon"></slot>
              </punica-col>
            </punica-row>  
          </punica-col>
          <slot name="content"></slot>
        </punica-row>
      </punica-col>
    </punica-row>
    <style></style>
  `;

  class ListViewItem extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });

    /**
     *
     */
    static get observedAttributes() {
      return [];
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
      this.#shadow.appendChild(template.content.cloneNode(true));

      const startAdornmentSlot = this.#shadow.querySelector(
        'slot[name="startAdornment"]'
      );
      const startAdornmentParent = startAdornmentSlot.parentElement;

      startAdornmentSlot.addEventListener('slotchange', () => {
        this.#updateVisibility(startAdornmentSlot, startAdornmentParent);
      });

      this.#updateVisibility(startAdornmentSlot, startAdornmentParent);
    }

    /**
     *
     * @param {*} slot
     * @param {*} element
     */
    #updateVisibility(slot, element) {
      if (slot.assignedNodes().length > 0) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    }
  }

  customElements.define('punica-list-view-item', ListViewItem);
})();
