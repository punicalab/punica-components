(function () {
  const template = document.createElement('template');

  template.innerHTML = `
  <style></style>
  <div class="group">
    <punica-button class="btn-main" data-role="main" size="small" rounded>
      <slot name="label"></slot>
    </punica-button>

    <punica-toggle-button
      color="primary"
      class="btn-toggle"
      data-role="toggle"
      mode="switch"
      size="small"
      rounded
      aria-haspopup="menu"
      aria-expanded="false"
      aria-label="More options"
    >
      <span slot="active" class="caret-up" aria-hidden="true"></span>
      <span slot="passive" class="caret" aria-hidden="true"></span>
    </punica-toggle-button>
  </div>

  <slot></slot>`;

  class PunicaSplitButton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #btnMain;
    #btnToggle;
    #menu;

    static get observedAttributes() {
      return [
        'open',
        'placement',
        'disabled',
        'variant',
        'size',
        'color',
        'rounded',
        'label',
        'icon'
      ];
    }

    constructor() {
      super();
      this.#shadow.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      this.#btnMain = this.#shadow.querySelector('[data-role="main"]');
      this.#btnToggle = this.#shadow.querySelector('[data-role="toggle"]');
      this.#menu = this.querySelector('punica-menu');

      this.#forwardButtonAttrs();

      // primary click
      this.#btnMain?.addEventListener('click', this.#onPrimaryClick);

      // toggle controls open state
      this.#btnToggle?.addEventListener('change', () => {
        const selected = this.#btnToggle.selected;
        if (selected && !this.open) this.openMenu();
        if (!selected && this.open) this.close();
      });

      this.#menu?.addEventListener('close', this.close);
      this.#menu?.addEventListener('menu-item-click', (e) => {
        this.dispatchEvent(
          new CustomEvent('select', {
            bubbles: true,
            composed: true,
            detail: e.detail
          })
        );
      });
    }

    disconnectedCallback() {
      this.close();
      this.#btnMain?.removeEventListener('click', this.#onPrimaryClick);
      this.#btnToggle?.removeEventListener('change', this.toggle);
      this.#menu?.removeEventListener('close', this.close);
    }

    attributeChangedCallback(name) {
      if (name === 'disabled') {
        const dis = this.disabled;
        dis
          ? (this.#btnMain?.setAttribute('disabled', ''),
            this.#btnToggle?.setAttribute('disabled', ''))
          : (this.#btnMain?.removeAttribute('disabled'),
            this.#btnToggle?.removeAttribute('disabled'));
      } else if (
        ['variant', 'size', 'color', 'rounded', 'label', 'icon'].includes(name)
      ) {
        this.#forwardButtonAttrs();
      } else if (name === 'placement' && this.#menu) {
        this.#menu.setAttribute('placement', this.placement);
      } else if (name === 'open') {
        // keep toggle selected state in sync
        const isOpen = this.open;
        if (this.#btnToggle && this.#btnToggle.selected !== isOpen) {
          this.#btnToggle.selected = isOpen;
          this.#btnToggle.setAttribute('aria-expanded', String(isOpen));
        }
      }
    }

    get open() {
      return this.hasAttribute('open');
    }
    set open(v) {
      v ? this.openMenu() : this.close();
    }

    get placement() {
      return this.getAttribute('placement') || 'bottom';
    }
    set placement(v) {
      if (!v) this.removeAttribute('placement');
      else this.setAttribute('placement', v);
      this.#menu?.setAttribute('placement', this.placement);
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(v) {
      v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
    }

    get variant() {
      return this.getAttribute('variant') || undefined;
    }
    set variant(v) {
      v ? this.setAttribute('variant', v) : this.removeAttribute('variant');
    }

    get size() {
      return this.getAttribute('size') || undefined;
    }
    set size(v) {
      v ? this.setAttribute('size', v) : this.removeAttribute('size');
    }

    get color() {
      return this.getAttribute('color') || undefined;
    }
    set color(v) {
      v ? this.setAttribute('color', v) : this.removeAttribute('color');
    }

    get rounded() {
      return this.hasAttribute('rounded');
    }
    set rounded(v) {
      v ? this.setAttribute('rounded', '') : this.removeAttribute('rounded');
    }

    get label() {
      return this.getAttribute('label') || undefined;
    }
    set label(v) {
      v ? this.setAttribute('label', v) : this.removeAttribute('label');
    }

    get icon() {
      return this.getAttribute('icon') || undefined;
    }
    set icon(v) {
      v ? this.setAttribute('icon', v) : this.removeAttribute('icon');
    }

    /* --- public api --- */
    openMenu = () => {
      if (this.disabled || this.open) return;
      this.setAttribute('open', '');

      if (this.#btnToggle && !this.#btnToggle.selected)
        this.#btnToggle.selected = true;
      this.#btnToggle?.setAttribute('aria-expanded', 'true');

      if (this.#menu && this.#btnToggle) {
        const r = this.#btnToggle.getBoundingClientRect();
        this.#menu.setAttribute('top', String(r.top));
        this.#menu.setAttribute('left', String(r.left));
        this.#menu.setAttribute('width', String(r.width));
        this.#menu.setAttribute('height', String(r.height));
        this.#menu.setAttribute('bottom', String(r.bottom));
        this.#menu.setAttribute('placement', this.placement);
        this.#menu.setAttribute('open', '');
      }
    };

    close = () => {
      if (!this.open) return;
      this.removeAttribute('open');

      if (this.#btnToggle?.selected) this.#btnToggle.selected = false;
      this.#btnToggle?.setAttribute('aria-expanded', 'false');

      this.#menu?.removeAttribute('open');
      if (this.#menu)
        ['top', 'left', 'width', 'height', 'bottom'].forEach((a) =>
          this.#menu.removeAttribute(a)
        );
    };

    toggle = () => {
      this.open ? this.close() : this.openMenu();
    };

    #onPrimaryClick = () => {
      if (this.disabled) return;
      this.dispatchEvent(
        new CustomEvent('primary-click', { bubbles: true, composed: true })
      );
    };

    #forwardButtonAttrs() {
      const mainAttrs = [
        'variant',
        'size',
        'color',
        'rounded',
        'disabled',
        'label',
        'icon'
      ];
      mainAttrs.forEach((a) => {
        const v = this.getAttribute(a);
        if (v === null) this.#btnMain?.removeAttribute(a);
        else this.#btnMain?.setAttribute(a, v === '' ? '' : String(v));
      });

      const toggleAttrs = ['size', 'color', 'rounded', 'rounded', 'disabled'];
      toggleAttrs.forEach((a) => {
        const v = this.getAttribute(a);
        if (v === null) this.#btnToggle?.removeAttribute(a);
        else this.#btnToggle?.setAttribute(a, v === '' ? '' : String(v));
      });
    }
  }

  customElements.define('punica-split-button', PunicaSplitButton);
})();
