(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <slot name="active"></slot>
    <slot name="passive"></slot>
    <style></style>
  `;

  class ToggleButton extends PunicaBase {
    static formAssociated = true;
    static get booleanAttributes() {
      return ['disabled', 'selected'];
    }
    static get observedAttributes() {
      return ['disabled', 'selected', 'color', 'mode', 'name', 'value'];
    }

    #shadow = this.attachShadow({ mode: 'open' });
    #internals = this.attachInternals();
    #defaultSelected = false;

    #onClick = () => {
      if (this.disabled) return;

      if (this.mode === 'radio') {
        if (this.selected) return; // radio: zaten seçiliyse çözme
        this.selected = true; // kendini seç
        this.#deselectSiblings(); // diğerlerini çöz
      } else {
        this.selected = !this.selected; // switch/checkbox davranışı
      }

      this.#updateFormValue();
      this.#render();
      this.#emitChange();
    };

    #onKeyDown = (e) => {
      if (this.disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.#onClick();
      }
      if (this.mode === 'radio') {
        const prevKeys = ['ArrowLeft', 'ArrowUp'];
        const nextKeys = ['ArrowRight', 'ArrowDown'];
        if (prevKeys.includes(e.key)) {
          e.preventDefault();
          this.#moveRadioFocus(-1);
        }
        if (nextKeys.includes(e.key)) {
          e.preventDefault();
          this.#moveRadioFocus(1);
        }
      }
    };

    constructor() {
      super();
      this.#shadow.appendChild(template.content.cloneNode(true));

      // slot değişince görünürlüğü tekrar ayarla
      this.#shadow
        .querySelector('slot[name="active"]')
        ?.addEventListener('slotchange', () => this.#render());
      this.#shadow
        .querySelector('slot[name="passive"]')
        ?.addEventListener('slotchange', () => this.#render());
    }

    /* ---------- public API ---------- */
    get mode() {
      return (this.getAttribute('mode') || 'switch').toLowerCase();
    } // "switch" | "radio"
    set mode(v) {
      if (!v) this.removeAttribute('mode');
      else this.setAttribute('mode', v);
    }

    get selected() {
      return this.hasAttribute('selected');
    }
    set selected(v) {
      v ? this.setAttribute('selected', '') : this.removeAttribute('selected');
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(v) {
      v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
    }

    get color() {
      return this.getAttribute('color') ?? '';
    }
    set color(v) {
      if (!v) this.removeAttribute('color');
      else this.setAttribute('color', v);
    }

    get name() {
      return this.getAttribute('name') ?? '';
    }
    set name(v) {
      if (!v) this.removeAttribute('name');
      else this.setAttribute('name', v);
    }

    get value() {
      return this.getAttribute('value') ?? 'on';
    } // checkbox default
    set value(v) {
      if (!v) this.removeAttribute('value');
      else this.setAttribute('value', v);
    }

    toggle() {
      this.#onClick();
    }

    connectedCallback() {
      super.connectedCallback();

      this.#applyA11yRole();

      if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
      if (!this.hasAttribute('color')) this.setAttribute('color', 'primary');
      if (!this.hasAttribute('size')) this.setAttribute('size', 'medium');

      this.#defaultSelected = this.selected;

      if (!this.disabled) {
        this.addEventListener('click', this.#onClick);
        this.addEventListener('keydown', this.#onKeyDown);
      }

      queueMicrotask(() => {
        this.#updateFormValue();
        this.#render();
      });
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.#onClick);
      this.removeEventListener('keydown', this.#onKeyDown);
    }

    attributeChangedCallback(name, oldV, newV) {
      if (oldV === newV) return;

      if (this.normalizeBooleanAttributeIfNeeded(name, newV)) {
        return;
      }

      if (name === 'disabled') {
        if (this.disabled) {
          this.removeEventListener('click', this.#onClick);
          this.removeEventListener('keydown', this.#onKeyDown);
          this.setAttribute('tabindex', '-1');
        } else {
          this.addEventListener('click', this.#onClick);
          this.addEventListener('keydown', this.#onKeyDown);
          if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
        }
        this.#render();
      }

      if (name === 'selected') {
        if (this.mode === 'radio' && this.selected) this.#deselectSiblings();
        this.#updateFormValue();
        this.#render();
      }

      if (name === 'color') {
        if (this.color)
          this.style.setProperty('--punica-toggle-color', this.color);
        else this.style.removeProperty('--punica-toggle-color');
      }

      if (name === 'mode') {
        this.#applyA11yRole();
        if (this.mode === 'radio' && this.selected) this.#deselectSiblings();
      }

      if (name === 'name' || name === 'value') {
        this.#updateFormValue();
      }
    }

    formDisabledCallback(disabled) {
      this.disabled = disabled;
    }

    formResetCallback() {
      this.selected = this.#defaultSelected;
      if (this.mode === 'radio' && this.selected) this.#deselectSiblings();
      this.#updateFormValue();
      this.#render();
    }

    formStateRestoreCallback(state /*, mode */) {
      if (typeof state === 'boolean') {
        this.selected = state;
        if (this.mode === 'radio' && this.selected) this.#deselectSiblings();
        this.#updateFormValue();
        this.#render();
      }
    }

    #applyA11yRole() {
      const role = this.mode === 'radio' ? 'radio' : 'switch';
      this.setAttribute('role', role);
      this.setAttribute('aria-checked', String(!!this.selected));
    }

    #emitChange() {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.selected, name: this.name || null },
          bubbles: true,
          composed: true
        })
      );
    }

    #updateFormValue() {
      if (this.name) {
        this.#internals.setFormValue(
          this.selected ? this.value : null,
          this.selected
        );
      } else {
        this.#internals.setFormValue(null);
      }
    }

    #deselectSiblings() {
      if (!this.name) return;
      const root = this.getRootNode();
      const group = [
        ...root.querySelectorAll('punica-toggle-button[mode="radio"]')
      ].filter((el) => el !== this && el.name === this.name);

      for (const el of group) {
        if (el.selected) {
          el.selected = false;
          el.#updateFormValue?.();
          el.#render?.();
        }
      }
    }

    #moveRadioFocus(dir) {
      if (!this.name) return;
      const root = this.getRootNode();
      const group = [
        ...root.querySelectorAll('punica-toggle-button[mode="radio"]')
      ].filter((el) => el.name === this.name);
      if (group.length < 2) return;

      const idx = group.indexOf(this);
      const next = (idx + dir + group.length) % group.length;
      group[next].focus();
    }

    #render() {
      const on = this.selected;

      const activeSlot = this.#shadow.querySelector('slot[name="active"]');
      const passiveSlot = this.#shadow.querySelector('slot[name="passive"]');

      if (activeSlot) activeSlot.hidden = !on;
      if (passiveSlot) passiveSlot.hidden = on;

      const activeEls = activeSlot?.assignedElements({ flatten: true }) ?? [];
      const passiveEls = passiveSlot?.assignedElements({ flatten: true }) ?? [];

      activeEls.forEach((el) => {
        el.hidden = !on;
        if (!on) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
        } else {
          el.style.display = '';
          el.style.visibility = '';
        }
      });

      passiveEls.forEach((el) => {
        el.hidden = on;
        if (on) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
        } else {
          el.style.display = '';
          el.style.visibility = '';
        }
      });

      this.setAttribute('aria-checked', String(on));
      if (this.disabled) this.setAttribute('aria-disabled', 'true');
      else this.removeAttribute('aria-disabled');

      const states = this.#internals?.states;
      if (states && typeof states.add === 'function') {
        if (on) states.add('--selected');
        else states.delete('--selected');
      }
    }
  }

  customElements.define('punica-toggle-button', ToggleButton);
})();
